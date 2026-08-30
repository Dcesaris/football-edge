import { supabaseSelect, supabaseUpsert } from '../supabase';

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
  const result = await supabaseUpsert<LeagueRow>('leagues', {
    api_id: data.apiId,
    name: data.name,
    country: data.country,
    logo: data.logo || null,
    flag: data.flag || null,
  }, { onConflict: 'api_id', select: '*' });

  if (result.error) throw new Error(`DB upsert league: ${result.error.message}`);
  return result.data![0];
}

export async function getLeagueByApiId(apiId: number): Promise<LeagueRow | null> {
  const result = await supabaseSelect<LeagueRow>('leagues', {
    select: '*',
    filters: { api_id: apiId },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get league: ${result.error.message}`);
  return result.data?.[0] || null;
}

export async function getLeagueById(id: number): Promise<LeagueRow | null> {
  const result = await supabaseSelect<LeagueRow>('leagues', {
    select: '*',
    filters: { id },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get league by id: ${result.error.message}`);
  return result.data?.[0] || null;
}
