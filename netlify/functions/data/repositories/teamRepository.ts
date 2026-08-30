import { getSupabase } from '../supabase';

export interface TeamRow {
  id: number;
  api_id: number;
  name: string;
  code: string | null;
  country: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertTeam(data: { apiId: number; name: string; code?: string; country?: string; logo?: string }): Promise<TeamRow> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('teams')
    .upsert({
      api_id: data.apiId,
      name: data.name,
      code: data.code || null,
      country: data.country || null,
      logo: data.logo || null,
    }, { onConflict: 'api_id' })
    .select()
    .single();

  if (error) throw new Error(`DB upsert team: ${error.message}`);
  return row;
}

export async function getTeamByApiId(apiId: number): Promise<TeamRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('api_id', apiId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get team: ${error.message}`);
  return data;
}

export async function upsertTeams(teams: Array<{ apiId: number; name: string; code?: string; country?: string; logo?: string }>): Promise<TeamRow[]> {
  const results: TeamRow[] = [];
  for (const team of teams) {
    results.push(await upsertTeam(team));
  }
  return results;
}
