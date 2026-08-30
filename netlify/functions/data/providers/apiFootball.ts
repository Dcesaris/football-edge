import { createHash } from 'crypto';
import type { APIFootballResponse } from '../../types';
import { getRawCache, setRawCache, logApiUsage } from '../repositories/cacheRepository';
import { TTL } from '../ttls';

const API_BASE = 'https://v3.football.api-sports.io';

// Build a deterministic request key from endpoint + sorted params
export function buildRequestKey(endpoint: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const query = sorted.map(([k, v]) => `${k}=${v}`).join('&');
  return `api-football:${endpoint}:${query}`;
}

// Build a content hash for analysis deduplication
export function buildInputHash(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Tiered TTL for raw cache based on endpoint
function getRawTTL(endpoint: string, isLive: boolean): number {
  if (isLive) return TTL.RAW_LIVE;
  if (endpoint === 'fixtures' || endpoint === 'odds') return TTL.RAW_DEFAULT;
  if (endpoint === 'predictions') return TTL.PREDICTIONS;
  if (endpoint === 'fixtures/headtohead') return TTL.H2H;
  return TTL.RAW_DEFAULT;
}

interface FetchOptions {
  apiKey: string;
  isLive?: boolean;
  skipCache?: boolean;
  fixtureId?: number;
}

// Core fetch with DB cache layer
export async function apiFootballFetch<T>(
  endpoint: string,
  params: Record<string, string>,
  options: FetchOptions,
): Promise<{
  data: APIFootballResponse<T>;
  quotaRemaining: number | null;
  source: 'cache' | 'api-football';
}> {
  const requestKey = buildRequestKey(endpoint, params);
  const ttl = getRawTTL(endpoint, options.isLive || false);
  const startTime = Date.now();

  // 1. Check DB cache
  if (!options.skipCache) {
    try {
      const cached = await getRawCache('api-football', requestKey);
      if (cached) {
        const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
        if (ageMs < ttl) {
          await logApiUsage({
            provider: 'api-football',
            endpoint,
            requestKey,
            cacheHit: true,
            durationMs: Date.now() - startTime,
          });
          return {
            data: cached.response as APIFootballResponse<T>,
            quotaRemaining: null,
            source: 'cache',
          };
        }
      }
    } catch {
      // DB cache read failed, continue to API
    }
  }

  // 2. Fetch from API
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: { 'x-apisports-key': options.apiKey },
  });

  const durationMs = Date.now() - startTime;

  if (response.status === 429) {
    await logApiUsage({
      provider: 'api-football',
      endpoint,
      requestKey,
      statusCode: 429,
      cacheHit: false,
      durationMs,
    });
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    await logApiUsage({
      provider: 'api-football',
      endpoint,
      requestKey,
      statusCode: response.status,
      cacheHit: false,
      durationMs,
    });
    throw new Error(`API_FOOTBALL_ERROR: ${response.status}`);
  }

  const data: APIFootballResponse<T> = await response.json();
  const quotaRemaining = response.headers.get('x-ratelimit-remaining');
  const rateLimitRemaining = response.headers.get('x-ratelimit-requests-remaining');

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API_FOOTBALL_ERROR: ${JSON.stringify(data.errors)}`);
  }

  // 3. Store in DB cache
  try {
    await setRawCache(
      'api-football',
      endpoint,
      requestKey,
      data,
      response.status,
      ttl,
      options.fixtureId,
    );
  } catch {
    // DB write failed, not critical
  }

  // 4. Log usage
  await logApiUsage({
    provider: 'api-football',
    endpoint,
    requestKey,
    statusCode: response.status,
    cacheHit: false,
    quotaRemaining: quotaRemaining ? parseInt(quotaRemaining, 10) : undefined,
    rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
    durationMs,
  });

  return {
    data,
    quotaRemaining: quotaRemaining ? parseInt(quotaRemaining, 10) : null,
    source: 'api-football',
  };
}
