import { getSupabase } from '../supabase';

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
  const supabase = getSupabase();
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

  const { data, error } = await supabase
    .from('odds_snapshots')
    .insert(rows)
    .select('id');

  if (error) throw new Error(`DB insert odds: ${error.message}`);
  return data?.length || 0;
}

export async function getLatestOdds(fixtureId: number): Promise<OddsSnapshotRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('odds_snapshots')
    .select('*')
    .eq('fixture_id', fixtureId)
    .order('captured_at', { ascending: false });

  if (error) throw new Error(`DB get odds: ${error.message}`);
  return data || [];
}

export async function getOddsHistory(fixtureId: number, marketName?: string): Promise<OddsSnapshotRow[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('odds_snapshots')
    .select('*')
    .eq('fixture_id', fixtureId)
    .order('captured_at', { ascending: true });

  if (marketName) {
    query = query.eq('market_name', marketName);
  }

  const { data, error } = await query;
  if (error) throw new Error(`DB get odds history: ${error.message}`);
  return data || [];
}

export async function hasRecentOdds(fixtureId: number, withinMs: number): Promise<boolean> {
  const supabase = getSupabase();
  const since = new Date(Date.now() - withinMs).toISOString();
  const { count, error } = await supabase
    .from('odds_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('fixture_id', fixtureId)
    .gte('captured_at', since);

  if (error) throw new Error(`DB check odds: ${error.message}`);
  return (count || 0) > 0;
}
