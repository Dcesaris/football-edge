import type { Match, OddsData } from '../types';

const API_BASE = '/.netlify/functions';

function apiUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (res.status === 429) {
    throw new APIError('Quota da API esgotada. Tente novamente mais tarde.', 429);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new APIError(body.error || `Erro ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export async function getFixtures(date: string, live = false): Promise<Match[]> {
  try {
    const data = await apiFetch<{ fixtures: Match[] }>(
      apiUrl('fixtures', { date, live: String(live) }),
    );
    return data.fixtures || [];
  } catch (err) {
    if (err instanceof APIError && err.status === 429) {
      throw err;
    }
    console.error('Failed to fetch fixtures:', err);
    return [];
  }
}

export async function getFixtureDetail(id: string): Promise<unknown> {
  try {
    return await apiFetch<unknown>(apiUrl('fixture-detail', { id }));
  } catch (err) {
    if (err instanceof APIError && err.status === 429) {
      throw err;
    }
    console.error('Failed to fetch fixture detail:', err);
    return null;
  }
}

export async function getLiveOdds(fixtureId: string): Promise<OddsData[]> {
  try {
    const detail = await getFixtureDetail(fixtureId) as { odds?: OddsData[] };
    return detail?.odds || [];
  } catch {
    return [];
  }
}
