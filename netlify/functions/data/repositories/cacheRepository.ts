import { getSupabase } from '../supabase';

// ============================================================
// RAW API CACHE
// ============================================================

export interface RawCacheRow {
  id: number;
  provider: string;
  endpoint: string;
  request_key: string;
  fixture_id: number | null;
  response: unknown;
  http_status: number | null;
  fetched_at: string;
  expires_at: string;
}

export async function getRawCache(
  provider: string,
  requestKey: string,
): Promise<RawCacheRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_raw_cache')
    .select('*')
    .eq('provider', provider)
    .eq('request_key', requestKey)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`DB get raw cache: ${error.message}`);
  return data;
}

export async function setRawCache(
  provider: string,
  endpoint: string,
  requestKey: string,
  response: unknown,
  httpStatus: number,
  ttlMs: number,
  fixtureId?: number,
): Promise<void> {
  const supabase = getSupabase();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  const { error } = await supabase
    .from('api_raw_cache')
    .upsert({
      provider,
      endpoint,
      request_key: requestKey,
      fixture_id: fixtureId || null,
      response,
      http_status: httpStatus,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: 'provider,request_key' });

  if (error) throw new Error(`DB set raw cache: ${error.message}`);
}

export async function deleteExpiredRawCache(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_raw_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) throw new Error(`DB delete expired cache: ${error.message}`);
  return data?.length || 0;
}

// ============================================================
// SYNC LOCKS
// ============================================================

export async function acquireSyncLock(
  resourceKey: string,
  lockDurationMs = 30000,
): Promise<boolean> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + lockDurationMs).toISOString();

  // Try to insert or update
  const { data: existing } = await supabase
    .from('sync_locks')
    .select('*')
    .eq('resource_key', resourceKey)
    .single();

  if (existing) {
    // Check if lock expired
    if (new Date(existing.expires_at).getTime() > Date.now()) {
      return false; // Lock held by another process
    }
    // Lock expired, update it
    const { error } = await supabase
      .from('sync_locks')
      .update({ locked_at: now, expires_at: expiresAt })
      .eq('resource_key', resourceKey);
    if (error) throw new Error(`DB update sync lock: ${error.message}`);
    return true;
  }

  // Insert new lock
  const { error } = await supabase
    .from('sync_locks')
    .insert({ resource_key: resourceKey, locked_at: now, expires_at: expiresAt });

  if (error) throw new Error(`DB insert sync lock: ${error.message}`);
  return true;
}

export async function releaseSyncLock(resourceKey: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('sync_locks')
    .delete()
    .eq('resource_key', resourceKey);

  if (error) throw new Error(`DB release sync lock: ${error.message}`);
}

// ============================================================
// API USAGE
// ============================================================

export async function logApiUsage(data: {
  provider: string;
  endpoint: string;
  requestKey?: string;
  statusCode?: number;
  cacheHit: boolean;
  quotaRemaining?: number;
  rateLimitRemaining?: number;
  durationMs?: number;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('api_usage')
    .insert({
      provider: data.provider,
      endpoint: data.endpoint,
      request_key: data.requestKey || null,
      status_code: data.statusCode || null,
      cache_hit: data.cacheHit,
      quota_remaining: data.quotaRemaining ?? null,
      rate_limit_remaining: data.rateLimitRemaining ?? null,
      duration_ms: data.durationMs ?? null,
    });

  if (error) throw new Error(`DB log usage: ${error.message}`);
}

export async function getUsageStats(since?: Date): Promise<{
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  byProvider: Record<string, { requests: number; cacheHits: number }>;
}> {
  const supabase = getSupabase();
  let query = supabase.from('api_usage').select('provider, cache_hit');
  if (since) {
    query = query.gte('requested_at', since.toISOString());
  }
  const { data, error } = await query;
  if (error) throw new Error(`DB get usage: ${error.message}`);

  const stats = {
    totalRequests: data?.length || 0,
    cacheHits: data?.filter((r) => r.cache_hit).length || 0,
    cacheMisses: data?.filter((r) => !r.cache_hit).length || 0,
    byProvider: {} as Record<string, { requests: number; cacheHits: number }>,
  };

  for (const row of data || []) {
    if (!stats.byProvider[row.provider]) {
      stats.byProvider[row.provider] = { requests: 0, cacheHits: 0 };
    }
    stats.byProvider[row.provider].requests++;
    if (row.cache_hit) stats.byProvider[row.provider].cacheHits++;
  }

  return stats;
}
