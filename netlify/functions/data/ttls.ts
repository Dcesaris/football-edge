// TTLs in milliseconds
export const TTL = {
  // Static data — refresh weekly
  LEAGUES: 7 * 24 * 60 * 60 * 1000,
  TEAMS: 7 * 24 * 60 * 60 * 1000,

  // Coverage metadata
  COVERAGE: 12 * 60 * 60 * 1000,

  // Match data
  H2H: 24 * 60 * 60 * 1000,
  PREDICTIONS: 6 * 60 * 60 * 1000,
  INJURIES: 6 * 60 * 60 * 1000,

  // Fixture freshness
  FIXTURE_FUTURE_24H: 30 * 60 * 1000,
  FIXTURE_FUTURE_1H: 10 * 60 * 1000,
  FIXTURE_PRE_2H: 5 * 60 * 1000,

  // Lineups
  LINEUPS_UNCONFIRMED: 5 * 60 * 1000,

  // Live
  LIVE_SCORE: 60 * 1000,
  LIVE_STATS: 60 * 1000,

  // Permanent after finalization
  FT_FIXTURE: 365 * 24 * 60 * 60 * 1000,
  FT_STATISTICS: 365 * 24 * 60 * 60 * 1000,
  FT_LINEUPS: 365 * 24 * 60 * 60 * 1000,
  FT_EVENTS: 365 * 24 * 60 * 60 * 1000,
  FT_PLAYERS: 365 * 24 * 60 * 60 * 1000,

  // Raw API cache
  RAW_DEFAULT: 5 * 60 * 1000,
  RAW_LIVE: 60 * 1000,

  // Sync lock duration
  SYNC_LOCK: 30 * 1000,
} as const;

export function getFixtureTTL(fixtureDate: string, statusShort: string): number {
  const now = Date.now();
  const kickOff = new Date(fixtureDate).getTime();
  const diffMs = kickOff - now;
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

  if (isFinished) return TTL.FT_FIXTURE;
  if (isLive) return TTL.LIVE_SCORE;
  if (diffMs < 0) return TTL.RAW_DEFAULT;
  if (diffMs < 2 * 60 * 60 * 1000) return TTL.FIXTURE_PRE_2H;
  if (diffMs < 60 * 60 * 1000) return TTL.FIXTURE_FUTURE_1H;
  return TTL.FIXTURE_FUTURE_24H;
}

export function getStatsTTL(statusShort: string): number {
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);
  if (isFinished) return TTL.FT_STATISTICS;
  return TTL.LIVE_STATS;
}

export function isStale(fetchedAt: string | Date, ttlMs: number): boolean {
  const fetched = typeof fetchedAt === 'string' ? new Date(fetchedAt).getTime() : fetchedAt.getTime();
  return Date.now() - fetched > ttlMs;
}

export function isExpired(expiresAt: string | Date): boolean {
  const exp = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  return Date.now() > exp;
}

export function expiresAt(ttlMs: number): Date {
  return new Date(Date.now() + ttlMs);
}
