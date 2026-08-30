import { getSupabase } from '../supabase';

export interface AiAnalysisRow {
  id: number;
  fixture_id: number;
  model: string;
  profile: string;
  reasoning: string;
  input_hash: string;
  data_quality: string | null;
  missing_data: string[] | null;
  result: unknown;
  created_at: string;
}

export async function getAnalysisByHash(
  fixtureId: number,
  model: string,
  inputHash: string,
): Promise<AiAnalysisRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('fixture_id', fixtureId)
    .eq('model', model)
    .eq('input_hash', inputHash)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get analysis: ${error.message}`);
  return data;
}

export async function insertAnalysis(data: {
  fixtureId: number;
  model: string;
  profile: string;
  reasoning: string;
  inputHash: string;
  dataQuality?: string;
  missingData?: string[];
  result: unknown;
}): Promise<AiAnalysisRow> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('ai_analyses')
    .upsert({
      fixture_id: data.fixtureId,
      model: data.model,
      profile: data.profile,
      reasoning: data.reasoning,
      input_hash: data.inputHash,
      data_quality: data.dataQuality || null,
      missing_data: data.missingData || null,
      result: data.result,
    }, { onConflict: 'fixture_id,model,input_hash' })
    .select()
    .single();

  if (error) throw new Error(`DB insert analysis: ${error.message}`);
  return row;
}

export async function getAnalysesForFixture(fixtureId: number): Promise<AiAnalysisRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('fixture_id', fixtureId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`DB get analyses: ${error.message}`);
  return data || [];
}
