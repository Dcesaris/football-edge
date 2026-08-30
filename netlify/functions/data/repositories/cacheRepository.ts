import { supabaseSelect, supabaseUpsert, supabaseInsert, supabaseDelete } from '../supabase';

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
  const result = await supabaseSelect<RawCacheRow>('api_raw_cache', {
    select: '*',
    filters: { provider, request_key: requestKey },
    limit: 1,
  });

  if (result.error) throw new Error(`DB get raw cache: ${result.error.message}`);
  return result.data?.[0] || null;
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
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const result = await supabaseUpsert('api_raw_cache', {
    provider,
    endpoint,
    request_key: requestKey,
    fixture_id: fixtureId || null,
    response,
    http_status: httpStatus,
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt,
  }, { onConflict: 'provider,request_key' });

  if (result.error) throw new Error(`DB set raw cache: ${result.error.message}`);
}

export async function deleteExpiredRawCache(): Promise<number> {
  const now = new Date().toISOString();
  const result = await supabaseDelete('api_raw_cache', {
    expires_at: { lt: now },
  });

  if (result.error) throw new Error(`DB delete expired cache: ${result.error.message}`);
  return 0; // Delete doesn't return count in REST API
}

// ============================================================
// SYNC LOCKS
// ============================================================

export async function acquireSyncLock(
  resourceKey: string,
  lockDurationMs = 30000,
): Promise<boolean> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + lockDurationMs).toISOString();

  // Check existing lock
  const existing = await supabaseSelect('sync_locks', {
    select: '*',
    filters: { resource_key: resourceKey },
    limit: 1,
  });

  if (existing.data && existing.data.length > 0) {
    const lock = existing.data[0] as { expires_at: string };
    if (new Date(lock.expires_at).getTime() > Date.now()) {
      return false; // Lock held
    }
    // Lock expired, update
    const result = await supabaseUpsert('sync_locks', {
      resource_key: resourceKey,
      locked_at: now,
      expires_at: expiresAt,
    }, { onConflict: 'resource_key' });
    if (result.error) throw new Error(`DB update sync lock: ${result.error.message}`);
    return true;
  }

  // Insert new lock
  const result = await supabaseInsert('sync_locks', {
    resource_key: resourceKey,
    locked_at: now,
    expires_at: expiresAt,
  });
  if (result.error) throw new Error(`DB insert sync lock: ${result.error.message}`);
  return true;
}

export async function releaseSyncLock(resourceKey: string): Promise<void> {
  const result = await supabaseDelete('sync_locks', { resource_key: resourceKey });
  if (result.error) throw new Error(`DB release sync lock: ${result.error.message}`);
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
  const result = await supabaseInsert('api_usage', {
    provider: data.provider,
    endpoint: data.endpoint,
    request_key: data.requestKey || null,
    status_code: data.statusCode || null,
    cache_hit: data.cacheHit,
    quota_remaining: data.quotaRemaining ?? null,
    rate_limit_remaining: data.rateLimitRemaining ?? null,
    duration_ms: data.durationMs ?? null,
  });

  if (result.error) throw new Error(`DB log usage: ${result.error.message}`);
}

export async function getUsageStats(since?: Date): Promise<{
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  byProvider: Record<string, { requests: number; cacheHits: number }>;
}> {
  const filters: Record<string, unknown> = {};
  if (since) {
    filters.requested_at = { gte: since.toISOString() };
  }

  const result = await supabaseSelect<{ provider: string; cache_hit: boolean }>('api_usage', {
    select: 'provider,cache_hit',
    filters,
  });

  if (result.error) throw new Error(`DB get usage: ${result.error.message}`);

  const data = result.data || [];
  const stats = {
    totalRequests: data.length,
    cacheHits: data.filter((r) => r.cache_hit).length,
    cacheMisses: data.filter((r) => !r.cache_hit).length,
    byProvider: {} as Record<string, { requests: number; cacheHits: number }>,
  };

  for (const row of data) {
    if (!stats.byProvider[row.provider]) {
      stats.byProvider[row.provider] = { requests: 0, cacheHits: 0 };
    }
    stats.byProvider[row.provider].requests++;
    if (row.cache_hit) stats.byProvider[row.provider].cacheHits++;
  }

  return stats;
}
