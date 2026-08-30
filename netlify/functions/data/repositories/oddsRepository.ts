import { supabaseSelect, supabaseInsert } from '../supabase';

export interface OddsSnapshotRow {
  id: number;
  fixture_id: number;
  bookmaker_id: number | null;
  bookmaker_name: string | null;
  market_id: number | null;
  market_name: string | null;
  selection: string | null;
  line: string | null;
  odd: number | null;
  is_live: boolean;
  captured_at: string;
}

export async function insertOddsSnapshots(
  fixtureId: number,
  oddsData: Array<{
    bookmakerId?: number;
    bookmakerName?: string;
    marketId?: number;
    marketName?: string;
    selection?: string;
    line?: string;
    odd?: number;
  }>,
  isLive = false,
): Promise<number> {
  const rows = oddsData.map((o) => ({
    fixture_id: fixtureId,
    bookmaker_id: o.bookmakerId ?? null,
    bookmaker_name: o.bookmakerName || null,
    market_id: o.marketId ?? null,
    market_name: o.marketName || null,
    selection: o.selection || null,
    line: o.line || null,
    odd: o.odd ?? null,
    is_live: isLive,
  }));

  const result = await supabaseInsert('odds_snapshots', rows);
  if (result.error) throw new Error(`DB insert odds: ${result.error.message}`);
  return result.data?.length || 0;
}

export async function getLatestOdds(fixtureId: number): Promise<OddsSnapshotRow[]> {
  const result = await supabaseSelect<OddsSnapshotRow>('odds_snapshots', {
    select: '*',
    filters: { fixture_id: fixtureId },
    order: { column: 'captured_at', ascending: false },
  });

  if (result.error) throw new Error(`DB get odds: ${result.error.message}`);
  return result.data || [];
}

export async function getOddsHistory(fixtureId: number, marketName?: string): Promise<OddsSnapshotRow[]> {
  const filters: Record<string, unknown> = { fixture_id: fixtureId };
  if (marketName) filters.market_name = marketName;

  const result = await supabaseSelect<OddsSnapshotRow>('odds_snapshots', {
    select: '*',
    filters,
    order: { column: 'captured_at', ascending: true },
  });

  if (result.error) throw new Error(`DB get odds history: ${result.error.message}`);
  return result.data || [];
}

export async function hasRecentOdds(fixtureId: number, withinMs: number): Promise<boolean> {
  const since = new Date(Date.now() - withinMs).toISOString();
  const result = await supabaseSelect('odds_snapshots', {
    select: 'id',
    filters: { fixture_id: fixtureId, captured_at: { gte: since } },
    limit: 1,
    count: 'exact',
    head: true,
  });

  if (result.error) throw new Error(`DB check odds: ${result.error.message}`);
  return (result.count || 0) > 0;
}
