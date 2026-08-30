export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  paging: { current: number; total: number };
  response: T;
}

export interface APIFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface APIFootballStatistics {
  team: { id: number; name: string; logo: string };
  statistics: {
    type: string;
    value: string | number | null;
  }[];
}

export interface APIFootballLineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: {
    player: { id: number; name: string; number: number; pos: string; grid: string | null };
  }[];
  substitutes: {
    player: { id: number; name: string; number: number; pos: string };
  }[];
}

export interface APIFootballPlayer {
  player: {
    id: number;
    name: string;
    photo: string;
    position: string;
    rating: number | null;
    captain: boolean;
    substitute: boolean;
    statistics: {
      games: { minutes: number; position: string; rating: number | null; captain: boolean };
      shots: { total: number | null; on: number | null };
      goals: { total: number | null; conceded: number | null; assists: number | null };
      passes: { total: number | null; key: number | null; accuracy: number | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number | null; red: number | null };
      penalty: { won: number | null; scored: number | null; missed: number | null };
    };
  }[];
}

export interface APIFootballH2H {
  // Same structure as APIFootballFixture
  fixture: APIFootballFixture['fixture'];
  league: APIFootballFixture['league'];
  teams: APIFootballFixture['teams'];
  goals: APIFootballFixture['goals'];
  score: APIFootballFixture['score'];
}

export type MatchStatus = 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'FT' | 'AET' | 'PEN' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'PST' | 'TBD';

export const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'BT', 'P'];
export const FINISHED_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN'];
export const HIDDEN_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO', 'PST'];

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
