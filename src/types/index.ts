export interface Team {
  id: string;
  name: string;
  shortName: string;
  shield: string;
}

export interface Match {
  id: string;
  home: Team;
  away: Team;
  league: League;
  date: string;
  time: string;
  status: MatchStatus;
  minute?: number;
  score?: { home: number; away: number };
  xG?: { home: number; away: number };
  stats?: MatchStats;
  hasOdds: boolean;
  hasAI: boolean;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface League {
  id: string;
  name: string;
  country: string;
  badge: string;
}

export interface MatchStats {
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  cards: { home: number; away: number };
  possession: { home: number; away: number };
  fouls: { home: number; away: number };
  xG: { home: number; away: number };
  pressure: { home: number; away: number };
}

export interface AIResult {
  entry: BestEntry | null;
  model: string;
  fallback: string;
  profile: 'conservative' | 'balanced' | 'aggressive';
  reasoning: 'fast' | 'high' | 'maximum';
  analyzedAt: string;
}

export interface BestEntry {
  market: string;
  currentOdd: number;
  probability: number;
  fairOdd: number;
  minOdd: number;
  edge: number;
  risk: RiskLevel;
  confidence: number;
  decision: 'ENTER' | 'WATCH' | 'NO_BET';
  explanation: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface ScannerItem {
  rank: number;
  match: string;
  league: string;
  market: string;
  odd: number;
  probability: number;
  fairOdd: number;
  edge: number;
  risk: RiskLevel;
  confidence: number;
}

export interface OddsData {
  bookmaker: string;
  market: string;
  line: string;
  currentOdd: number;
  estimatedProb: number;
  fairOdd: number;
  edge: number;
  updatedAt: string;
  source: 'live' | 'pre-match' | 'ai-inference';
}

export interface PlayerProps {
  id: string;
  name: string;
  avatar: string;
  team: string;
  position: string;
  isStarter: boolean;
  minutes: number;
  stat: string;
  line: string;
  odd: number;
  probability: number;
  fairOdd: number;
  edge: number;
  risk: RiskLevel;
  substituted: boolean;
}

export interface Settings {
  analysis: {
    riskProfile: 'conservative' | 'balanced' | 'aggressive';
    minEdge: number;
    minProbability: number;
    minOdd: number;
    maxRecommendations: number;
  };
  ai: {
    model: string;
    fallback: string;
    reasoning: 'fast' | 'high' | 'maximum';
    status: 'online' | 'offline';
  };
  api: {
    status: 'connected' | 'disconnected';
    quota: number;
    lastUpdate: string;
  };
  preferences: {
    theme: 'dark' | 'light';
    language: string;
    timezone: string;
  };
}

export type TabType = 'overview' | 'ai' | 'odds' | 'stats' | 'players' | 'lineups' | 'h2h' | 'json';

export type NavPage = 'matches' | 'live' | 'scanner' | 'ai' | 'settings';

export type FilterType = 'today' | 'tomorrow' | 'calendar';

export type ScannerFilter = 'all' | 'high-confidence' | 'positive-edge' | 'low-risk' | 'goals' | 'corners' | 'cards' | 'players';
