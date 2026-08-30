import { supabaseSelect, supabaseUpsert } from '../supabase';

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
  const result = await supabaseUpsert<TeamRow>('teams', {
    api_id: data.apiId,
    name: data.name,
    code: data.code || null,
    country: data.country || null,
    logo: data.logo || null,
  }, { onConflict: 'api_id', select: '*' });

  if (result.error) throw new Error(`DB upsert team: ${result.error.message}`);
  return result.data![0];
}

export async function getTeamByApiId(apiId: number): Promise<TeamRow | null> {
  const result = await supabaseSelect<TeamRow>('teams', {
    select: '*',
    filters: { api_id: apiId },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get team: ${result.error.message}`);
  return result.data?.[0] || null;
}

export async function upsertTeams(teams: Array<{ apiId: number; name: string; code?: string; country?: string; logo?: string }>): Promise<TeamRow[]> {
  const results: TeamRow[] = [];
  for (const team of teams) {
    results.push(await upsertTeam(team));
  }
  return results;
}
