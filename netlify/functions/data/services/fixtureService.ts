import type { APIFootballFixture } from '../../types';
import { upsertLeague } from '../repositories/leagueRepository';
import { upsertTeam } from '../repositories/teamRepository';
import { upsertFixture, getFixtureByApiId, updateFixtureStatus, getFixturesByDate as dbGetFixturesByDate, getLiveFixtures as dbGetLiveFixtures } from '../repositories/fixtureRepository';
import { acquireSyncLock, releaseSyncLock } from '../repositories/cacheRepository';
import { apiFootballFetch } from '../providers/apiFootball';
import { TTL, getFixtureTTL, isStale, expiresAt } from '../ttls';

// ============================================================
// UPSERT NORMALIZED DATA FROM API RESPONSE
// ============================================================

async function upsertFixtureFromApi(fixture: APIFootballFixture): Promise<number> {
  // Upsert league
  const league = await upsertLeague({
    apiId: fixture.league.id,
    name: fixture.league.name,
    country: fixture.league.country,
    logo: fixture.league.logo,
    flag: fixture.league.flag || undefined,
  });

  // Upsert teams
  const homeTeam = await upsertTeam({
    apiId: fixture.teams.home.id,
    name: fixture.teams.home.name,
    logo: fixture.teams.home.logo,
  });
  const awayTeam = await upsertTeam({
    apiId: fixture.teams.away.id,
    name: fixture.teams.away.name,
    logo: fixture.teams.away.logo,
  });

  // Upsert fixture
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(fixture.fixture.status.short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);

  const row = await upsertFixture({
    apiId: fixture.fixture.id,
    leagueId: league.id,
    season: fixture.league.season,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    fixtureDate: fixture.fixture.date,
    timestamp: fixture.fixture.timestamp,
    timezone: fixture.fixture.timezone,
    venueName: fixture.fixture.venue?.name || undefined,
    venueCity: fixture.fixture.venue?.city || undefined,
    statusShort: fixture.fixture.status.short,
    statusLong: fixture.fixture.status.long,
    elapsed: fixture.fixture.status.elapsed || undefined,
    homeGoals: fixture.goals.home ?? undefined,
    awayGoals: fixture.goals.away ?? undefined,
    homeScoreHt: fixture.score.halftime.home ?? undefined,
    awayScoreHt: fixture.score.halftime.away ?? undefined,
    homeScoreFt: fixture.score.fulltime.home ?? undefined,
    awayScoreFt: fixture.score.fulltime.away ?? undefined,
    homeScoreEt: fixture.score.extratime.home ?? undefined,
    awayScoreEt: fixture.score.extratime.away ?? undefined,
    homeScorePen: fixture.score.penalty.home ?? undefined,
    awayScorePen: fixture.score.penalty.away ?? undefined,
    referee: fixture.fixture.referee || undefined,
    round: fixture.league.round || undefined,
    isLive,
    isFinalized: isFinished,
  });

  return row.id;
}

// ============================================================
// GET FIXTURES BY DATE
// ============================================================

export async function getFixturesByDate(
  date: string,
  apiKey: string,
): Promise<{
  fixtures: APIFootballFixture[];
  source: 'database' | 'api-football';
}> {
  // 1. Check DB
  const dbFixtures = await dbGetFixturesByDate(date);
  if (dbFixtures.length > 0 && !isStale(dbFixtures[0].updated_at, TTL.RAW_DEFAULT)) {
    // Reconstruct API response from DB (need teams/league info)
    // For now, fetch fresh if DB has data but it's basic
    // The DB stores normalized data; for the list endpoint we return raw API format
  }

  // 2. Check raw cache
  const requestKey = `api-football:fixtures:date=${date}`;
  const cached = await getRawCache('api-football', requestKey);
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    if (ageMs < TTL.RAW_DEFAULT) {
      return { fixtures: (cached.response as { response: APIFootballFixture[] }).response, source: 'database' };
    }
  }

  // 3. Fetch from API
  const lockKey = `fixtures:date:${date}`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);

  if (!gotLock) {
    // Another process is fetching, wait briefly then check DB again
    await new Promise((r) => setTimeout(r, 2000));
    const retryCached = await getRawCache('api-football', requestKey);
    if (retryCached) {
      return { fixtures: (retryCached.response as { response: APIFootballFixture[] }).response, source: 'database' };
    }
    throw new Error('SYNC_IN_PROGRESS');
  }

  try {
    const { data, quotaRemaining } = await apiFootballFetch<APIFootballFixture[]>(
      'fixtures',
      { date },
      { apiKey, isLive: false },
    );

    // Upsert all fixtures to DB
    for (const fixture of data.response) {
      try {
        await upsertFixtureFromApi(fixture);
      } catch {
        // Individual fixture upsert failed, continue
      }
    }

    return { fixtures: data.response, source: 'api-football' };
  } finally {
    await releaseSyncLock(lockKey);
  }
}

// ============================================================
// GET LIVE FIXTURES
// ============================================================

export async function getLiveFixtures(
  apiKey: string,
): Promise<{
  fixtures: APIFootballFixture[];
  source: 'database' | 'api-football';
}> {
  // 1. Check DB for recently synced live fixtures
  const dbLive = await dbGetLiveFixtures();
  if (dbLive.length > 0 && !isStale(dbLive[0].updated_at, TTL.LIVE_SCORE)) {
    // DB has recent live data, but we need raw API format for frontend
    // Fall through to API since live data must be fresh
  }

  // 2. Fetch live from API (always fresh for live)
  const lockKey = 'fixtures:live:all';
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);

  if (!gotLock) {
    await new Promise((r) => setTimeout(r, 2000));
    // Try DB again
    const retryDb = await dbGetLiveFixtures();
    if (retryDb.length > 0) {
      // Need to reconstruct API format from DB... for now return empty
    }
    throw new Error('SYNC_IN_PROGRESS');
  }

  try {
    const { data } = await apiFootballFetch<APIFootballFixture[]>(
      'fixtures',
      { live: 'all' },
      { apiKey, isLive: true },
    );

    // Upsert all live fixtures to DB
    for (const fixture of data.response) {
      try {
        await upsertFixtureFromApi(fixture);
      } catch {
        // Continue
      }
    }

    return { fixtures: data.response, source: 'api-football' };
  } finally {
    await releaseSyncLock(lockKey);
  }
}

// ============================================================
// GET SINGLE FIXTURE DETAIL
// ============================================================

export async function getFixtureDetail(
  fixtureApiId: number,
  apiKey: string,
  isLive: boolean,
): Promise<{
  fixture: APIFootballFixture;
  source: 'database' | 'api-football';
}> {
  // 1. Check DB
  const dbFixture = await getFixtureByApiId(fixtureApiId);
  const ttl = dbFixture
    ? getFixtureTTL(dbFixture.fixture_date + 'T' + (dbFixture.timestamp ? new Date(dbFixture.timestamp * 1000).toISOString().split('T')[1] : '00:00:00Z'), dbFixture.status_short)
    : 0;

  if (dbFixture && !isStale(dbFixture.updated_at, ttl) && !isStale(dbFixture.last_api_sync || dbFixture.created_at, ttl)) {
    // DB data is fresh; need to reconstruct API format
    // For simplicity, fetch from API if we don't have the full raw response
  }

  // 2. Fetch from API
  const lockKey = `fixture:${fixtureApiId}:basic`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);

  if (!gotLock) {
    await new Promise((r) => setTimeout(r, 2000));
    const retryFixture = await getFixtureByApiId(fixtureApiId);
    if (retryFixture) {
      // Return what we have from DB
      throw new Error('SYNC_IN_PROGRESS');
    }
    throw new Error('SYNC_IN_PROGRESS');
  }

  try {
    const { data } = await apiFootballFetch<{ response: APIFootballFixture[] }>(
      'fixtures',
      { id: fixtureApiId.toString() },
      { apiKey, isLive, fixtureId: fixtureApiId },
    );

    if (data.response.length === 0) {
      throw new Error('FIXTURE_NOT_FOUND');
    }

    const fixture = data.response[0];

    // Upsert to DB
    try {
      await upsertFixtureFromApi(fixture);
    } catch {
      // Continue
    }

    return { fixture, source: 'api-football' };
  } finally {
    await releaseSyncLock(lockKey);
  }
}
