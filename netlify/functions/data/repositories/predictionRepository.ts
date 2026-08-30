import { getSupabase } from '../supabase';

export interface PredictionRow {
  id: number;
  fixture_id: number;
  winner_team_id: number | null;
  winner_comment: string | null;
  home_percent: number | null;
  draw_percent: number | null;
  away_percent: number | null;
  under_over: string | null;
  advice: string | null;
  raw_json: unknown;
  fetched_at: string;
  expires_at: string;
}

export async function upsertPrediction(data: {
  fixtureId: number;
  winnerTeamId?: number;
  winnerComment?: string;
  homePercent?: number;
  drawPercent?: number;
  awayPercent?: number;
  underOver?: string;
  advice?: string;
  rawJson: unknown;
  expiresAt: Date;
}): Promise<PredictionRow> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('predictions')
    .upsert({
      fixture_id: data.fixtureId,
      winner_team_id: data.winnerTeamId || null,
      winner_comment: data.winnerComment || null,
      home_percent: data.homePercent ?? null,
      draw_percent: data.drawPercent ?? null,
      away_percent: data.awayPercent ?? null,
      under_over: data.underOver || null,
      advice: data.advice || null,
      raw_json: data.rawJson,
      fetched_at: new Date().toISOString(),
      expires_at: data.expiresAt.toISOString(),
    }, { onConflict: 'fixture_id' })
    .select()
    .single();

  if (error) throw new Error(`DB upsert prediction: ${error.message}`);
  return row;
}

export async function getPrediction(fixtureId: number): Promise<PredictionRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get prediction: ${error.message}`);
  return data;
}
