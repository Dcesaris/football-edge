import type { APIFootballFixture } from './types';
import { apiFootballFetch, jsonResponse, errorResponse, handleCORS } from './utils';

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

  if (!date && !live) {
    return errorResponse('Missing required parameter: date or live', 400);
  }

  try {
    let fixtures: APIFootballFixture[] = [];

    if (live === 'true') {
      // Live: ONLY use live=all (1 API call)
      const { data } = await apiFootballFetch<APIFootballFixture[]>(
        'fixtures',
        { live: 'all' },
        apiKey,
        true,
      );
      fixtures = data.response;
    } else if (date) {
      // Date: fetch by date (1 API call)
      const { data } = await apiFootballFetch<APIFootballFixture[]>(
        'fixtures',
        { date },
        apiKey,
        false,
      );
      fixtures = data.response;
    }

    // Filter out finished/hidden statuses
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
