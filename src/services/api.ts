const FUNCTIONS_BASE = '/.netlify/functions';

interface FetchOptions {
  method?: string;
  body?: unknown;
}

async function fetchFunction<T>(name: string, params?: Record<string, string>, options?: FetchOptions): Promise<T> {
  const url = new URL(`${FUNCTIONS_BASE}/${name}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: options?.method || 'GET',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 429) {
    throw new Error('Quota da API esgotada. Tente novamente mais tarde.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface FixtureResponse {
  fixtures: unknown[];
  count: number;
}

export interface FixtureDetailResponse {
  fixture: unknown;
  statistics: unknown[];
  lineups: unknown[];
  players: unknown[];
  h2h: unknown[];
  predictions: unknown;
  odds: unknown;
}

export interface AnalysisResponse {
  entries: Array<{
    market: string;
    line: string;
    currentOdd: number;
    estimatedProbability: number;
    fairOdd: number;
    minimumOdd: number;
    edge: number;
    risk: 'low' | 'moderate' | 'high';
    confidence: number;
    decision: 'ENTER' | 'WATCH' | 'NO_BET';
    explanation: string;
  }>;
  model: string;
  analyzedAt: string;
  fixtureId: number;
}

export async function fetchFixtures(date: string, live = false): Promise<FixtureResponse> {
  return fetchFunction<FixtureResponse>('fixtures', { date, live: live ? 'true' : 'false' });
}

export async function fetchFixtureDetail(id: string, live = false): Promise<FixtureDetailResponse> {
  return fetchFunction<FixtureDetailResponse>('fixture-detail', { id, live: live ? 'true' : 'false' });
}

export async function analyzeMatch(data: Record<string, unknown>): Promise<AnalysisResponse> {
  return fetchFunction<AnalysisResponse>('analyze', undefined, {
    method: 'POST',
    body: data,
  });
}
