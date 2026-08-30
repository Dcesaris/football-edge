import { supabaseSelect, supabaseUpsert } from '../supabase';

export interface PlayerRow {
  id: number;
  api_id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertPlayer(data: {
  apiId: number;
  name: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  nationality?: string;
  photo?: string;
}): Promise<PlayerRow> {
  const result = await supabaseUpsert<PlayerRow>('players', {
    api_id: data.apiId,
    name: data.name,
    firstname: data.firstname || null,
    lastname: data.lastname || null,
    age: data.age || null,
    nationality: data.nationality || null,
    photo: data.photo || null,
  }, { onConflict: 'api_id', select: '*' });

  if (result.error) throw new Error(`DB upsert player: ${result.error.message}`);
  return result.data![0];
}

export async function getPlayerByApiId(apiId: number): Promise<PlayerRow | null> {
  const result = await supabaseSelect<PlayerRow>('players', {
    select: '*',
    filters: { api_id: apiId },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get player: ${result.error.message}`);
  return result.data?.[0] || null;
}
