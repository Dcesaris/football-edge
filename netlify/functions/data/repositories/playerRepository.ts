import { getSupabase } from '../supabase';

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
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('players')
    .upsert({
      api_id: data.apiId,
      name: data.name,
      firstname: data.firstname || null,
      lastname: data.lastname || null,
      age: data.age || null,
      nationality: data.nationality || null,
      photo: data.photo || null,
    }, { onConflict: 'api_id' })
    .select()
    .single();

  if (error) throw new Error(`DB upsert player: ${error.message}`);
  return row;
}

export async function getPlayerByApiId(apiId: number): Promise<PlayerRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('api_id', apiId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get player: ${error.message}`);
  return data;
}
