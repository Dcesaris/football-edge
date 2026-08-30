import { insertOddsSnapshots, getLatestOdds, hasRecentOdds } from '../repositories/oddsRepository';
import { apiFootballFetch } from '../providers/apiFootball';
import { acquireSyncLock, releaseSyncLock } from '../repositories/cacheRepository';
import { TTL } from '../ttls';

export async function fetchAndStoreOdds(
  fixtureId: number,
  apiKey: string,
  isLive: boolean,
): Promise<{
  odds: unknown[];
  source: 'database' | 'api-football';
  snapshotCount: number;
}> {
  // 1. Check if we have recent odds
  const hasRecent = await hasRecentOdds(fixtureId, TTL.RAW_DEFAULT);
  if (hasRecent) {
    const dbOdds = await getLatestOdds(fixtureId);
    return { odds: dbOdds, source: 'database', snapshotCount: dbOdds.length };
  }

  // 2. Fetch from API with lock
  const lockKey = `fixture:${fixtureId}:odds`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);

  if (!gotLock) {
    await new Promise((r) => setTimeout(r, 2000));
    const retryOdds = await getLatestOdds(fixtureId);
    return { odds: retryOdds, source: 'database', snapshotCount: retryOdds.length };
  }

  try {
    const endpoint = isLive ? 'odds/live' : 'odds';
    const { data } = await apiFootballFetch<unknown[]>(
      endpoint,
      { fixture: fixtureId.toString() },
      { apiKey, isLive, fixtureId },
    );

    const rawOdds = data.response;

    // Parse and store snapshots
    const snapshots = parseOddsForStorage(rawOdds);
    let snapshotCount = 0;
    if (snapshots.length > 0) {
      snapshotCount = await insertOddsSnapshots(fixtureId, snapshots, isLive);
    }

    return { odds: rawOdds, source: 'api-football', snapshotCount };
  } finally {
    await releaseSyncLock(lockKey);
  }
}

function parseOddsForStorage(
  oddsData: unknown[],
): Array<{
  bookmakerId?: number;
  bookmakerName?: string;
  marketId?: number;
  marketName?: string;
  selection?: string;
  line?: string;
  odd?: number;
}> {
  const snapshots: Array<{
    bookmakerId?: number;
    bookmakerName?: string;
    marketId?: number;
    marketName?: string;
    selection?: string;
    line?: string;
    odd?: number;
  }> = [];

  for (const bookmaker of oddsData) {
    const bm = bookmaker as {
      id?: number;
      name?: string;
      bets?: Array<{
        id?: number;
        name?: string;
        values?: Array<{ value?: string; odd?: string }>;
      }>;
    };

    for (const bet of bm.bets || []) {
      for (const val of bet.values || []) {
        snapshots.push({
          bookmakerId: bm.id,
          bookmakerName: bm.name,
          marketId: bet.id,
          marketName: bet.name,
          selection: val.value,
          line: undefined,
          odd: val.odd ? parseFloat(val.odd) : undefined,
        });
      }
    }
  }

  return snapshots;
}
