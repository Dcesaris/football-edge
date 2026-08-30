import type { APIFootballResponse, CacheEntry } from './types';

const API_BASE = 'https://v3.football.api-sports.io';
const DEFAULT_TTL = 60_000; // 1 minute
const LIVE_TTL = 30_000; // 30 seconds
const QUOTA_WARNING_THRESHOLD = 100;

const cache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(endpoint: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${endpoint}?${sorted.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

function getTTL(isLive: boolean): number {
  return isLive ? LIVE_TTL : DEFAULT_TTL;
}

function isValidEntry<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && isValidEntry(entry)) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

export async function apiFootballFetch<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
  isLive = false,
): Promise<{ data: APIFootballResponse<T>; quotaRemaining: number | null }> {
  const key = getCacheKey(endpoint, params);
  const cached = getFromCache<APIFootballResponse<T>>(key);
  if (cached) {
    return { data: cached, quotaRemaining: null };
  }

  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: { 'x-apisports-key': apiKey },
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    throw new Error(`API_FOOTBALL_ERROR: ${response.status}`);
  }

  const quotaRemaining = response.headers.get('x-ratelimit-remaining');
  const data: APIFootballResponse<T> = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API_FOOTBALL_ERROR: ${JSON.stringify(data.errors)}`);
  }

  setCache(key, data, getTTL(isLive));

  return {
    data,
    quotaRemaining: quotaRemaining ? parseInt(quotaRemaining, 10) : null,
  };
}

export function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}
