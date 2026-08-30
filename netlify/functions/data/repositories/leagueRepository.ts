import { getSupabase } from '../supabase';

export interface LeagueRow {
  id: number;
  api_id: number;
  name: string;
  country: string;
  logo: string | null;
  flag: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertLeague(data: { apiId: number; name: string; country: string; logo?: string; flag?: string }): Promise<LeagueRow> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('leagues')
    .upsert({
      api_id: data.apiId,
      name: data.name,
      country: data.country,
      logo: data.logo || null,
      flag: data.flag || null,
    }, { onConflict: 'api_id' })
    .select()
    .single();

  if (error) throw new Error(`DB upsert league: ${error.message}`);
  return row;
}

export async function getLeagueByApiId(apiId: number): Promise<LeagueRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('api_id', apiId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get league: ${error.message}`);
  return data;
}

export async function getLeagueById(id: number): Promise<LeagueRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get league by id: ${error.message}`);
  return data;
}
