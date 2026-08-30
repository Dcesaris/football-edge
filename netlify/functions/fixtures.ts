import type { APIFootballFixture, HIDDEN_STATUSES } from './types';
import { apiFootballFetch, jsonResponse, errorResponse, handleCORS } from './utils';

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P'];

interface FixturesQuery {
  date?: string;
  live?: string;
  league?: string;
  season?: string;
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
  const date = url.searchParams.get('date');
  const live = url.searchParams.get('live');
  const league = url.searchParams.get('league');
  const season = url.searchParams.get('season');

  if (!date && !live) {
    return errorResponse('Missing required parameter: date or live', 400);
  }

  try {
    const fixtures: APIFootballFixture[] = [];

    // Fetch fixtures by date
    if (date) {
      const params: Record<string, string> = { date };
      if (league) params.league = league;
      if (season) params.season = season;

      const { data } = await apiFootballFetch<APIFootballFixture[]>(
        'fixtures',
        params,
        apiKey,
        false,
      );
      fixtures.push(...data.response);
    }

    // Fetch live fixtures
    if (live === 'true') {
      const { data } = await apiFootballFetch<APIFootballFixture[]>(
        'fixtures',
        { live: 'all' },
        apiKey,
        true,
      );
      // Merge without duplicates
      const existingIds = new Set(fixtures.map((f) => f.fixture.id));
      data.response.forEach((f) => {
        if (!existingIds.has(f.fixture.id)) {
          fixtures.push(f);
        }
      });
    }

    // Filter out hidden statuses
    const filtered = fixtures.filter((f) => {
      const status = f.fixture.status.short;
      return !['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO', 'PST'].includes(status);
    });

    return jsonResponse({
      fixtures: filtered,
      count: filtered.length,
    });
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
