import type {
  APIFootballFixture,
  APIFootballStatistics,
  APIFootballLineup,
  APIFootballPlayer,
  APIFootballH2H,
} from './types';
import { apiFootballFetch, jsonResponse, errorResponse, handleCORS } from './utils';

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

  try {
    // Fetch fixture details
    const { data: fixtureData } = await apiFootballFetch<{ fixture: APIFootballFixture }[]>(
      'fixtures',
      { id: fixtureId },
      apiKey,
      isLive,
    );

    if (fixtureData.response.length === 0) {
      return errorResponse('Fixture not found', 404);
    }

    const fixture = fixtureData.response[0];

    // Fetch statistics
    let statistics: APIFootballStatistics[] = [];
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

    // Fetch lineups
    let lineups: APIFootballLineup[] = [];
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

    // Fetch players
    let players: APIFootballPlayer[] = [];
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

    // Fetch H2H
    let h2h: APIFootballH2H[] = [];
    try {
      const homeId = fixture.teams.home.id.toString();
      const awayId = fixture.teams.away.id.toString();
      const { data: h2hData } = await apiFootballFetch<APIFootballH2H[]>(
        'fixtures/headtohead',
        { h2h: `${homeId}-${awayId}`, last: '5' },
        apiKey,
        false,
      );
      h2h = h2hData.response;
    } catch {
      // H2H might not be available
    }

    // Fetch predictions
    let predictions: unknown = null;
    try {
      const { data: predData } = await apiFootballFetch<unknown[]>(
        'fixtures/predictions',
        { fixture: fixtureId },
        apiKey,
        false,
      );
      predictions = predData.response;
    } catch {
      // Predictions might not be available
    }

    // Fetch odds
    let odds: unknown = null;
    try {
      const { data: oddsData } = await apiFootballFetch<unknown[]>(
        'fixtures/odds',
        { fixture: fixtureId },
        apiKey,
        false,
      );
      odds = oddsData.response;
    } catch {
      // Odds might not be available
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
