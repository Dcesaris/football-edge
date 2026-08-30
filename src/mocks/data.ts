import { Match, ScannerItem, AIResult, OddsData, PlayerProps, Settings, League, Team } from '../types';

const leagues: League[] = [
  { id: 'pl', name: 'Premier League', country: 'England', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'll', name: 'La Liga', country: 'Spain', badge: '🇪🇸' },
  { id: 'sa', name: 'Serie A', country: 'Italy', badge: '🇮🇹' },
  { id: 'bl', name: 'Bundesliga', country: 'Germany', badge: '🇩🇪' },
  { id: 'cl', name: 'Champions League', country: 'Europe', badge: '🏆' },
  { id: 'fl', name: 'Ligue 1', country: 'France', badge: '🇫🇷' },
];

const teams: Record<string, Team> = {
 Arsenal: { id: 'ars', name: 'Arsenal', shortName: 'ARS', shield: '🔴' },
  'Man City': { id: 'mci', name: 'Manchester City', shortName: 'MCI', shield: '🔵' },
  'Liverpool': { id: 'liv', name: 'Liverpool', shortName: 'LIV', shield: '🔴' },
  'Chelsea': { id: 'che', name: 'Chelsea', shortName: 'CHE', shield: '🔵' },
  'Barcelona': { id: 'bar', name: 'Barcelona', shortName: 'BAR', shield: '🔵🔴' },
  'Real Madrid': { id: 'rma', name: 'Real Madrid', shortName: 'RMA', shield: '⚪' },
  'Inter': { id: 'int', name: 'Inter Milan', shortName: 'INT', shield: '🔵⚫' },
  'AC Milan': { id: 'mil', name: 'AC Milan', shortName: 'MIL', shield: '🔴⚫' },
  'Bayern': { id: 'bay', name: 'Bayern Munich', shortName: 'BAY', shield: '🔴' },
  'Dortmund': { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', shield: '🟡' },
  'PSG': { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', shield: '🔵🔴' },
  'Juventus': { id: 'juv', name: 'Juventus', shortName: 'JUV', shield: '⚪⚫' },
};

export const mockMatches: Match[] = [
  {
    id: 'm1',
    home: teams['Arsenal'],
    away: teams['Man City'],
    league: leagues[0],
    date: '2026-08-30',
    time: '17:30',
    status: 'live',
    minute: 67,
    score: { home: 2, away: 1 },
    xG: { home: 2.34, away: 1.12 },
    stats: {
      shots: { home: 14, away: 8 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 4 },
      cards: { home: 1, away: 2 },
      possession: { home: 58, away: 42 },
      fouls: { home: 8, away: 11 },
      xG: { home: 2.34, away: 1.12 },
      pressure: { home: 72, away: 45 },
    },
    hasOdds: true,
    hasAI: true,
  },
  {
    id: 'm2',
    home: teams['Barcelona'],
    away: teams['Real Madrid'],
    league: leagues[1],
    date: '2026-08-30',
    time: '21:00',
    status: 'live',
    minute: 34,
    score: { home: 1, away: 1 },
    xG: { home: 1.45, away: 1.23 },
    stats: {
      shots: { home: 9, away: 7 },
      shotsOnTarget: { home: 4, away: 3 },
      corners: { home: 5, away: 3 },
      cards: { home: 0, away: 1 },
      possession: { home: 62, away: 38 },
      fouls: { home: 5, away: 7 },
      xG: { home: 1.45, away: 1.23 },
      pressure: { home: 65, away: 50 },
    },
    hasOdds: true,
    hasAI: true,
  },
  {
    id: 'm3',
    home: teams['Bayern'],
    away: teams['Dortmund'],
    league: leagues[3],
    date: '2026-08-30',
    time: '15:30',
    status: 'upcoming',
    hasOdds: true,
    hasAI: false,
  },
  {
    id: 'm4',
    home: teams['Inter'],
    away: teams['AC Milan'],
    league: leagues[2],
    date: '2026-08-30',
    time: '20:45',
    status: 'upcoming',
    hasOdds: true,
    hasAI: true,
  },
  {
    id: 'm5',
    home: teams['Liverpool'],
    away: teams['Chelsea'],
    league: leagues[0],
    date: '2026-08-31',
    time: '14:00',
    status: 'upcoming',
    hasOdds: false,
    hasAI: false,
  },
  {
    id: 'm6',
    home: teams['PSG'],
    away: teams['Juventus'],
    league: leagues[4],
    date: '2026-08-31',
    time: '21:00',
    status: 'upcoming',
    hasOdds: true,
    hasAI: true,
  },
];

export const mockScannerItems: ScannerItem[] = [
  { rank: 1, match: 'Arsenal vs Man City', league: 'Premier League', market: 'Under 13 Asian Corners', odd: 1.72, probability: 0.64, fairOdd: 1.56, edge: 10.2, risk: 'low', confidence: 81 },
  { rank: 2, match: 'Barcelona vs Real Madrid', league: 'La Liga', market: 'BTTS Yes', odd: 1.55, probability: 0.71, fairOdd: 1.41, edge: 9.9, risk: 'low', confidence: 78 },
  { rank: 3, match: 'Inter vs AC Milan', league: 'Serie A', market: 'Over 2.5 Goals', odd: 2.10, probability: 0.52, fairOdd: 1.92, edge: 9.4, risk: 'moderate', confidence: 72 },
  { rank: 4, match: 'Bayern vs Dortmund', league: 'Bundesliga', market: 'Home Win & Over 2.5', odd: 2.45, probability: 0.44, fairOdd: 2.27, edge: 7.9, risk: 'moderate', confidence: 68 },
  { rank: 5, match: 'PSG vs Juventus', league: 'Champions League', market: 'Under 10.5 Corners', odd: 1.90, probability: 0.56, fairOdd: 1.79, edge: 6.1, risk: 'low', confidence: 74 },
];

export const mockAIResult: AIResult = {
  entry: {
    market: 'Under 13 Asian Corners',
    currentOdd: 1.72,
    probability: 0.64,
    fairOdd: 1.56,
    minOdd: 1.65,
    edge: 10.2,
    risk: 'low',
    confidence: 81,
    decision: 'ENTER',
    explanation: 'Arsenal averages 10.2 corners at home this season. Man City averages 4.8 conceded corners away. Head-to-head last 5 meetings averaged 9.8 corners. The line at 13 is set too high for this matchup profile.',
  },
  model: 'Kimi K3',
  fallback: 'Nemotron',
  profile: 'balanced',
  reasoning: 'high',
  analyzedAt: '2 min ago',
};

export const mockOdds: OddsData[] = [
  { bookmaker: 'Bet365', market: 'Match Result', line: 'Home', currentOdd: 2.10, estimatedProb: 0.48, fairOdd: 2.08, edge: 1.0, updatedAt: '12s ago', source: 'live' },
  { bookmaker: 'Bet365', market: 'Match Result', line: 'Draw', currentOdd: 3.40, estimatedProb: 0.29, fairOdd: 3.45, edge: -1.4, updatedAt: '12s ago', source: 'live' },
  { bookmaker: 'Bet365', market: 'Match Result', line: 'Away', currentOdd: 3.60, estimatedProb: 0.28, fairOdd: 3.57, edge: 0.8, updatedAt: '12s ago', source: 'live' },
  { bookmaker: 'Bet365', market: 'Over/Under 2.5', line: 'Over', currentOdd: 1.85, estimatedProb: 0.54, fairOdd: 1.85, edge: 0.0, updatedAt: '12s ago', source: 'live' },
  { bookmaker: 'Bet365', market: 'Over/Under 2.5', line: 'Under', currentOdd: 2.00, estimatedProb: 0.50, fairOdd: 2.00, edge: 0.0, updatedAt: '12s ago', source: 'live' },
  { bookmaker: 'Pinnacle', market: 'Asian Corners', line: 'Under 13', currentOdd: 1.72, estimatedProb: 0.64, fairOdd: 1.56, edge: 10.2, updatedAt: '18s ago', source: 'live' },
  { bookmaker: 'Pinnacle', market: 'Asian Corners', line: 'Over 13', currentOdd: 2.15, estimatedProb: 0.47, fairOdd: 2.13, edge: 0.9, updatedAt: '18s ago', source: 'live' },
  { bookmaker: 'AI Model', market: 'Match Result', line: 'Home', currentOdd: 1.95, estimatedProb: 0.51, fairOdd: 1.96, edge: -0.5, updatedAt: '2h ago', source: 'ai-inference' },
];

export const mockPlayers: PlayerProps[] = [
  { id: 'p1', name: 'B. Saka', avatar: '⚽', team: 'Arsenal', position: 'RW', isStarter: true, minutes: 67, stat: 'Shots on Target', line: 'Over 1.5', odd: 2.10, probability: 0.48, fairOdd: 2.08, edge: 1.0, risk: 'moderate', substituted: false },
  { id: 'p2', name: 'K. Havertz', avatar: '⚽', team: 'Arsenal', position: 'ST', isStarter: true, minutes: 67, stat: 'Goals', line: 'Anytime Scorer', odd: 2.50, probability: 0.40, fairOdd: 2.50, edge: 0.0, risk: 'moderate', substituted: false },
  { id: 'p3', name: 'E. Haaland', avatar: '⚽', team: 'Man City', position: 'ST', isStarter: true, minutes: 67, stat: 'Shots on Target', line: 'Over 2.5', odd: 3.20, probability: 0.31, fairOdd: 3.23, edge: -0.9, risk: 'high', substituted: false },
  { id: 'p4', name: 'K. De Bruyne', avatar: '⚽', team: 'Man City', position: 'CM', isStarter: true, minutes: 58, stat: 'Assists', line: 'Anytime Assist', odd: 4.50, probability: 0.22, fairOdd: 4.55, edge: -1.1, risk: 'high', substituted: false },
  { id: 'p5', name: 'B. Walker', avatar: '⚽', team: 'Man City', position: 'RB', isStarter: true, minutes: 45, stat: 'Fouls Committed', line: 'Over 1.5', odd: 1.85, probability: 0.54, fairOdd: 1.85, edge: 0.0, risk: 'low', substituted: true },
];

export const mockSettings: Settings = {
  analysis: {
    riskProfile: 'balanced',
    minEdge: 5.0,
    minProbability: 0.55,
    minOdd: 1.50,
    maxRecommendations: 3,
  },
  ai: {
    model: 'Kimi K3',
    fallback: 'Nemotron',
    reasoning: 'high',
    status: 'online',
  },
  api: {
    status: 'connected',
    quota: 847,
    lastUpdate: '18s ago',
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
  },
};
