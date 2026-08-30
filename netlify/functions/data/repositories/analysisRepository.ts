import { supabaseSelect, supabaseUpsert } from '../supabase';

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
  const result = await supabaseSelect<AiAnalysisRow>('ai_analyses', {
    select: '*',
    filters: { fixture_id: fixtureId, model, input_hash: inputHash },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get analysis: ${result.error.message}`);
  return result.data?.[0] || null;
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
  const result = await supabaseUpsert<AiAnalysisRow>('ai_analyses', {
    fixture_id: data.fixtureId,
    model: data.model,
    profile: data.profile,
    reasoning: data.reasoning,
    input_hash: data.inputHash,
    data_quality: data.dataQuality || null,
    missing_data: data.missingData || null,
    result: data.result,
  }, { onConflict: 'fixture_id,model,input_hash', select: '*' });

  if (result.error) throw new Error(`DB insert analysis: ${result.error.message}`);
  return result.data![0];
}

export async function getAnalysesForFixture(fixtureId: number): Promise<AiAnalysisRow[]> {
  const result = await supabaseSelect<AiAnalysisRow>('ai_analyses', {
    select: '*',
    filters: { fixture_id: fixtureId },
    order: { column: 'created_at', ascending: false },
  });

  if (result.error) throw new Error(`DB get analyses: ${result.error.message}`);
  return result.data || [];
}
