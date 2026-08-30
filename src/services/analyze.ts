export interface AnalyzeParams {
  fixture: {
    id: number;
    home: string;
    away: string;
    league: string;
    status: string;
    minute?: number;
    score?: { home: number; away: number };
  };
  statistics?: Record<string, unknown>;
  xG?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
  cards?: { home: number; away: number };
  lineups?: unknown[];
  players?: unknown[];
  odds?: unknown[];
  form?: { home: string[]; away: string[] };
  h2h?: unknown[];
  injuries?: unknown[];
  profile: 'conservative' | 'balanced' | 'aggressive';
  reasoning: 'fast' | 'high' | 'maximum';
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

export interface AnalyzeResponse {
  entries: AnalysisEntry[];
  model: string;
  analyzedAt: string;
  fixtureId: number;
}

const FUNCTIONS_BASE = '/.netlify/functions';

export async function analyzeMatch(params: AnalyzeParams): Promise<AnalyzeResponse> {
  const res = await fetch(`${FUNCTIONS_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (res.status === 429) {
    throw new Error('Quota da IA esgotada. Tente novamente mais tarde.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Análise falhou' }));
    throw new Error(body.error || 'Análise falhou');
  }

  return res.json() as Promise<AnalyzeResponse>;
}
