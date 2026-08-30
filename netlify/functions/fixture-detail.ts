import type {
  APIFootballFixture,
  APIFootballStatistics,
  APIFootballLineup,
  APIFootballPlayer,
  APIFootballH2H,
} from './types';
import { jsonResponse, errorResponse, handleCORS } from './utils';
import { getFixtureDetail } from './data/services/fixtureService';
import { apiFootballFetch } from './data/providers/apiFootball';
import { fetchAndStoreStatistics, fetchAndStoreLineups, fetchAndStorePlayers } from './data/services/statsService';
import { fetchAndStoreOdds } from './data/services/oddsService';
import { getSupabase } from './data/supabase';

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
  const fixtureApiId = parseInt(fixtureId, 10);

  try {
    // 1. Get fixture (uses DB cache / API)
    const { fixture } = await getFixtureDetail(fixtureApiId, apiKey, isLive);

    // 2. Get DB fixture ID for relations
    const supabase = getSupabase();
    const { data: dbFixture } = await supabase
      .from('fixtures')
      .select('id')
      .eq('api_id', fixtureApiId)
      .single();

    const fixtureDbId = dbFixture?.id;

    // 3. Fetch statistics, lineups, players in parallel (basic mode)
    let statistics: APIFootballStatistics[] = [];
    let lineups: APIFootballLineup[] = [];
    let players: APIFootballPlayer[] = [];

    if (fixtureDbId) {
      // Try to persist and retrieve from DB
      const [statsOk, lineupsOk, playersOk] = await Promise.allSettled([
        fetchAndStoreStatistics(fixtureDbId, fixtureApiId, apiKey),
        fetchAndStoreLineups(fixtureDbId, fixtureApiId, apiKey),
        fetchAndStorePlayers(fixtureDbId, fixtureApiId, apiKey),
      ]);

      // Read from DB if stored
      if (statsOk.status === 'fulfilled' && statsOk.value) {
        const { data: statsRows } = await supabase
          .from('fixture_statistics')
          .select('*')
          .eq('fixture_id', fixtureDbId);
        if (statsRows && statsRows.length > 0) {
          statistics = statsRows.map((s) => ({
            team: { id: 0, name: '', logo: '' },
            statistics: s.raw_json || [],
          })) as APIFootballStatistics[];
        }
      }
    }

    // Fallback: use embedded data from fixture response
    if (statistics.length === 0) {
      const fixtureAny = fixture as Record<string, unknown>;
      if (Array.isArray(fixtureAny.statistics) && fixtureAny.statistics.length > 0) {
        statistics = fixtureAny.statistics as APIFootballStatistics[];
      }
    }
    if (lineups.length === 0) {
      const fixtureAny = fixture as Record<string, unknown>;
      if (Array.isArray(fixtureAny.lineups) && fixtureAny.lineups.length > 0) {
        lineups = fixtureAny.lineups as APIFootballLineup[];
      }
    }
    if (players.length === 0) {
      const fixtureAny = fixture as Record<string, unknown>;
      if (Array.isArray(fixtureAny.players) && fixtureAny.players.length > 0) {
        players = fixtureAny.players as APIFootballPlayer[];
      }
    }

    // 4. In basic mode, fetch missing data from API
    if (mode === 'basic') {
      if (statistics.length === 0) {
        try {
          const { data: statsData } = await apiFootballFetch<APIFootballStatistics[]>(
            'fixtures/statistics',
            { fixture: fixtureId },
            { apiKey, isLive, fixtureId: fixtureApiId },
          );
          statistics = statsData.response;
        } catch { /* Statistics might not be available */ }
      }

      if (lineups.length === 0) {
        try {
          const { data: lineupData } = await apiFootballFetch<APIFootballLineup[]>(
            'fixtures/lineups',
            { fixture: fixtureId },
            { apiKey, isLive, fixtureId: fixtureApiId },
          );
          lineups = lineupData.response;
        } catch { /* Lineups might not be available */ }
      }

      if (players.length === 0) {
        try {
          const { data: playerData } = await apiFootballFetch<APIFootballPlayer[]>(
            'fixtures/players',
            { fixture: fixtureId },
            { apiKey, isLive, fixtureId: fixtureApiId },
          );
          players = playerData.response;
        } catch { /* Players might not be available */ }
      }
    }

    // 5. Analysis mode: H2H, predictions, odds
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
          { apiKey, fixtureId: fixtureApiId },
        ),
        apiFootballFetch<unknown[]>(
          'predictions',
          { fixture: fixtureId },
          { apiKey, fixtureId: fixtureApiId },
        ),
        fetchAndStoreOdds(fixtureApiId, apiKey, isLive),
      ]);

      h2h = h2hResult.status === 'fulfilled' ? h2hResult.value.data.response : [];
      predictions = predictionsResult.status === 'fulfilled' ? predictionsResult.value.data.response : null;
      odds = oddsResult.status === 'fulfilled' ? oddsResult.value.odds : null;
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
