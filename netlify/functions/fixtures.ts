import { jsonResponse, errorResponse, handleCORS } from './utils';
import { getFixturesByDate, getLiveFixtures } from './data/services/fixtureService';

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
    if (live === 'true') {
      const result = await getLiveFixtures(apiKey);
      return jsonResponse({
        fixtures: result.fixtures,
        count: result.fixtures.length,
        source: result.source,
      });
    }

    if (date) {
      const result = await getFixturesByDate(date, apiKey);
      const filtered = result.fixtures.filter((f) => {
        const status = f.fixture.status.short;
        return !['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO', 'PST'].includes(status);
      });
      return jsonResponse({
        fixtures: filtered,
        count: filtered.length,
        source: result.source,
      });
    }

    return errorResponse('Invalid parameters', 400);
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
