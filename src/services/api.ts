import type { Match, Team, League } from '../types';

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

// API-Football raw response types
interface APIFootballFixtureResponse {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: { long: string; short: string; elapsed: number | null };
    venue?: { name?: string | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    flag?: string | null;
    season?: number;
    round?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string; winner?: boolean | null };
    away: { id: number; name: string; logo?: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
}

interface FixturesApiResponse {
  fixtures: APIFootballFixtureResponse[];
  count: number;
}

export interface FixtureDetailResponse {
  fixture: APIFootballFixtureResponse;
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    statistics: Array<{ type: string; value: string | number | null }>;
  }>;
  lineups: Array<{
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
    substitutes: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
  }>;
  players: Array<{
    player: {
      id: number;
      name: string;
      photo?: string;
      position?: string;
      rating?: number | null;
      captain?: boolean;
      substitute?: boolean;
    };
  }>;
  h2h: APIFootballFixtureResponse[];
  predictions: unknown;
  odds: unknown;
}

export interface AnalysisEntry {
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
}

export interface AnalysisResponse {
  entries: AnalysisEntry[];
  model: string;
  analyzedAt: string;
  fixtureId: number;
}

// Convert API-Football fixture to our Match type
function apiFixtureToMatch(f: APIFootballFixtureResponse): Match {
  const statusShort = f.fixture.status.short;
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  if (isLive) status = 'live';
  else if (isFinished) status = 'finished';

  const teamToTeam = (t: APIFootballFixtureResponse['teams']['home']): Team => ({
    id: String(t.id),
    name: t.name,
    shortName: t.name.split(' ').pop()?.substring(0, 3).toUpperCase() || t.name.substring(0, 3).toUpperCase(),
    shield: t.logo || '',
  });

  const dateObj = new Date(f.fixture.date);
  const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = dateObj.toISOString().split('T')[0];

  return {
    id: String(f.fixture.id),
    home: teamToTeam(f.teams.home),
    away: teamToTeam(f.teams.away),
    league: {
      id: String(f.league.id),
      name: f.league.name,
      country: f.league.country,
      badge: f.league.flag || '',
    },
    date: dateStr,
    time,
    status,
    minute: f.fixture.status.elapsed || undefined,
    score: f.goals.home != null && f.goals.away != null
      ? { home: f.goals.home, away: f.goals.away }
      : undefined,
    hasOdds: false,
    hasAI: false,
  };
}

// Public API

export async function fetchFixtures(date: string, live = false): Promise<Match[]> {
  try {
    const data = await fetchFunction<FixturesApiResponse>('fixtures', {
      date,
      live: live ? 'true' : 'false',
    });
    return (data.fixtures || []).map(apiFixtureToMatch);
  } catch {
    return [];
  }
}

export async function fetchFixtureDetail(id: string, live = false): Promise<FixtureDetailResponse> {
  return fetchFunction<FixtureDetailResponse>('fixture-detail', {
    id,
    live: live ? 'true' : 'false',
    mode: 'basic',
  });
}

export async function fetchFixtureAnalysis(id: string, live = false): Promise<FixtureDetailResponse> {
  return fetchFunction<FixtureDetailResponse>('fixture-detail', {
    id,
    live: live ? 'true' : 'false',
    mode: 'analysis',
  });
}

export async function analyzeMatch(data: Record<string, unknown>): Promise<AnalysisResponse> {
  return fetchFunction<AnalysisResponse>('analyze', undefined, {
    method: 'POST',
    body: data,
  });
}

export async function checkAPIStatus(): Promise<boolean> {
  try {
    await fetchFunction<unknown>('fixtures', { date: new Date().toISOString().split('T')[0] });
    return true;
  } catch {
    return false;
  }
}

export async function checkAIStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/analyze`, { method: 'OPTIONS' });
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}
