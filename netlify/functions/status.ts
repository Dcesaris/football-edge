import { jsonResponse, handleCORS } from './utils';
import { getSupabase } from './data/supabase';
import { getUsageStats } from './data/repositories/cacheRepository';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  const apiFootballConfigured = !!process.env.API_FOOTBALL_KEY;
  const nvidiaConfigured = !!process.env.NVIDIA_API_KEY;
  const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let dbConnected = false;
  let dbError: string | null = null;
  let usage = null;

  if (supabaseConfigured) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('api_usage').select('id', { count: 'exact', head: true });
      if (error) {
        dbError = error.message;
      } else {
        dbConnected = true;
        usage = await getUsageStats(new Date(Date.now() - 24 * 60 * 60 * 1000));
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : 'Unknown DB error';
    }
  }

  return jsonResponse({
    apiFootballConfigured,
    nvidiaConfigured,
    supabaseConfigured,
    dbConnected,
    dbError,
    usage,
    timestamp: new Date().toISOString(),
  });
}
