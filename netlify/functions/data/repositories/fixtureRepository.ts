import { getSupabase } from '../supabase';

export interface FixtureRow {
  id: number;
  api_id: number;
  league_id: number;
  season: number;
  home_team_id: number;
  away_team_id: number;
  fixture_date: string;
  timestamp: number | null;
  timezone: string | null;
  venue_name: string | null;
  venue_city: string | null;
  status_short: string;
  status_long: string | null;
  elapsed: number | null;
  home_goals: number | null;
  away_goals: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  home_score_ft: number | null;
  away_score_ft: number | null;
  home_score_et: number | null;
  away_score_et: number | null;
  home_score_pen: number | null;
  away_score_pen: number | null;
  referee: string | null;
  round: string | null;
  is_live: boolean;
  is_finalized: boolean;
  last_api_sync: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertFixture(data: {
  apiId: number;
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  fixtureDate: string;
  timestamp?: number;
  timezone?: string;
  venueName?: string;
  venueCity?: string;
  statusShort: string;
  statusLong?: string;
  elapsed?: number;
  homeGoals?: number;
  awayGoals?: number;
  homeScoreHt?: number;
  awayScoreHt?: number;
  homeScoreFt?: number;
  awayScoreFt?: number;
  homeScoreEt?: number;
  awayScoreEt?: number;
  homeScorePen?: number;
  awayScorePen?: number;
  referee?: string;
  round?: string;
  isLive?: boolean;
  isFinalized?: boolean;
}): Promise<FixtureRow> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('fixtures')
    .upsert({
      api_id: data.apiId,
      league_id: data.leagueId,
      season: data.season,
      home_team_id: data.homeTeamId,
      away_team_id: data.awayTeamId,
      fixture_date: data.fixtureDate.split('T')[0],
      timestamp: data.timestamp || null,
      timezone: data.timezone || null,
      venue_name: data.venueName || null,
      venue_city: data.venueCity || null,
      status_short: data.statusShort,
      status_long: data.statusLong || null,
      elapsed: data.elapsed || null,
      home_goals: data.homeGoals ?? null,
      away_goals: data.awayGoals ?? null,
      home_score_ht: data.homeScoreHt ?? null,
      away_score_ht: data.awayScoreHt ?? null,
      home_score_ft: data.homeScoreFt ?? null,
      away_score_ft: data.awayScoreFt ?? null,
      home_score_et: data.homeScoreEt ?? null,
      away_score_et: data.awayScoreEt ?? null,
      home_score_pen: data.homeScorePen ?? null,
      away_score_pen: data.awayScorePen ?? null,
      referee: data.referee || null,
      round: data.round || null,
      is_live: data.isLive || false,
      is_finalized: data.isFinalized || false,
      last_api_sync: new Date().toISOString(),
    }, { onConflict: 'api_id' })
    .select()
    .single();

  if (error) throw new Error(`DB upsert fixture: ${error.message}`);
  return row;
}

export async function getFixtureByApiId(apiId: number): Promise<FixtureRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('api_id', apiId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get fixture: ${error.message}`);
  return data;
}

export async function getFixtureById(id: number): Promise<FixtureRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get fixture by id: ${error.message}`);
  return data;
}

export async function getFixturesByDate(date: string, leagueApiIds?: number[]): Promise<FixtureRow[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('fixtures')
    .select('*')
    .eq('fixture_date', date)
    .order('timestamp', { ascending: true });

  if (leagueApiIds && leagueApiIds.length > 0) {
    // Join with leagues to filter by api_id
    const { data: leagueRows } = await supabase
      .from('leagues')
      .select('id')
      .in('api_id', leagueApiIds);

    if (leagueRows && leagueRows.length > 0) {
      query = query.in('league_id', leagueRows.map((l) => l.id));
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`DB get fixtures by date: ${error.message}`);
  return data || [];
}

export async function getLiveFixtures(): Promise<FixtureRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('is_live', true)
    .order('timestamp', { ascending: true });

  if (error) throw new Error(`DB get live fixtures: ${error.message}`);
  return data || [];
}

export async function updateFixtureStatus(
  fixtureId: number,
  statusShort: string,
  elapsed?: number,
  homeGoals?: number,
  awayGoals?: number,
): Promise<void> {
  const supabase = getSupabase();
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(statusShort);

  const update: Record<string, unknown> = {
    status_short: statusShort,
    is_live: isLive,
    is_finalized: isFinished,
    last_api_sync: new Date().toISOString(),
  };
  if (elapsed != null) update.elapsed = elapsed;
  if (homeGoals != null) update.home_goals = homeGoals;
  if (awayGoals != null) update.away_goals = awayGoals;

  const { error } = await supabase
    .from('fixtures')
    .update(update)
    .eq('id', fixtureId);

  if (error) throw new Error(`DB update fixture status: ${error.message}`);
}
