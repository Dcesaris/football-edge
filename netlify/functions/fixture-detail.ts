import type {
  APIFootballFixture,
  APIFootballStatistics,
  APIFootballLineup,
  APIFootballPlayer,
  APIFootballH2H,
} from './types';
import { apiFootballFetch, jsonResponse, errorResponse, handleCORS } from './utils';

interface APIFootballFixturesResponse {
  response: APIFootballFixture[];
}

interface FixtureDetailResponse {
  fixture: APIFootballFixture;
  statistics: APIFootballStatistics[];
  lineups: APIFootballLineup[];
  players: APIFootballPlayer[];
  h2h: APIFootballH2H[];
  predictions: unknown;
  odds: unknown;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return errorResponse('API_FOOTBALL_KEY not configured', 500);
  }

  const url = new URL(req.url);
  const fixtureId = url.searchParams.get('id');

  if (!fixtureId) {
    return errorResponse('Missing required parameter: id', 400);
  }

  const isLive = url.searchParams.get('live') === 'true';
  const mode = url.searchParams.get('mode') || 'basic';

  try {
    // 1 call: /fixtures?id=FIXTURE_ID (may include embedded statistics, lineups, players)
    const { data: fixtureData } = await apiFootballFetch<APIFootballFixturesResponse>(
      'fixtures',
      { id: fixtureId },
      apiKey,
      isLive,
    );

    if (fixtureData.response.length === 0) {
      return errorResponse('Fixture not found', 404);
    }

    const fixture = fixtureData.response[0];

    // Extract embedded data if present in the response
    let statistics: APIFootballStatistics[] = [];
    let lineups: APIFootballLineup[] = [];
    let players: APIFootballPlayer[] = [];

    const fixtureAny = fixture as Record<string, unknown>;
    if (Array.isArray(fixtureAny.statistics) && fixtureAny.statistics.length > 0) {
      statistics = fixtureAny.statistics as APIFootballStatistics[];
    }
    if (Array.isArray(fixtureAny.lineups) && fixtureAny.lineups.length > 0) {
      lineups = fixtureAny.lineups as APIFootballLineup[];
    }
    if (Array.isArray(fixtureAny.players) && fixtureAny.players.length > 0) {
      players = fixtureAny.players as APIFootballPlayer[];
    }

    // Only fetch missing data via separate endpoints in basic mode
    if (mode === 'basic') {
      if (statistics.length === 0) {
        try {
          const { data: statsData } = await apiFootballFetch<APIFootballStatistics[]>(
            'fixtures/statistics',
            { fixture: fixtureId },
            apiKey,
            isLive,
          );
          statistics = statsData.response;
        } catch {
          // Statistics might not be available yet
        }
      }

      if (lineups.length === 0) {
        try {
          const { data: lineupData } = await apiFootballFetch<APIFootballLineup[]>(
            'fixtures/lineups',
            { fixture: fixtureId },
            apiKey,
            isLive,
          );
          lineups = lineupData.response;
        } catch {
          // Lineups might not be available yet
        }
      }

      if (players.length === 0) {
        try {
          const { data: playerData } = await apiFootballFetch<APIFootballPlayer[]>(
            'fixtures/players',
            { fixture: fixtureId },
            apiKey,
            isLive,
          );
          players = playerData.response;
        } catch {
          // Players might not be available yet
        }
      }
    }

    // In analysis mode, also fetch H2H, predictions, odds
    let h2h: APIFootballH2H[] = [];
    let predictions: unknown = null;
    let odds: unknown = null;

    if (mode === 'analysis') {
      const homeId = fixture.teams.home.id.toString();
      const awayId = fixture.teams.away.id.toString();

      const [h2hResult, predictionsResult, oddsResult] = await Promise.allSettled([
        apiFootballFetch<APIFootballH2H[]>(
          'fixtures/headtohead',
          { h2h: `${homeId}-${awayId}`, last: '5' },
          apiKey,
          false,
        ),
        apiFootballFetch<unknown[]>(
          'predictions',
          { fixture: fixtureId },
          apiKey,
          false,
        ),
        apiFootballFetch<unknown[]>(
          isLive ? 'odds/live' : 'odds',
          { fixture: fixtureId },
          apiKey,
          isLive,
        ),
      ]);

      h2h = h2hResult.status === 'fulfilled' ? h2hResult.value.data.response : [];
      predictions = predictionsResult.status === 'fulfilled' ? predictionsResult.value.data.response : null;
      odds = oddsResult.status === 'fulfilled' ? oddsResult.value.data.response : null;
    }

    return jsonResponse({
      fixture,
      statistics,
      lineups,
      players,
      h2h,
      predictions,
      odds,
    } satisfies FixtureDetailResponse);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RATE_LIMITED') {
        return errorResponse('API rate limited. Please try again later.', 429);
      }
      return errorResponse(error.message, 502);
    }
    return errorResponse('Unknown error', 500);
  }
}
