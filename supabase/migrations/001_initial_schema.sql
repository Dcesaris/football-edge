-- Football Edge Database Schema
-- Migration 001: Initial schema
-- Date: 2026-08-30

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- LEAGUES
-- ============================================================
CREATE TABLE leagues (
  id BIGSERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  logo TEXT,
  flag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEASONS
-- ============================================================
CREATE TABLE seasons (
  id BIGSERIAL PRIMARY KEY,
  league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, year)
);

-- ============================================================
-- LEAGUE COVERAGE
-- ============================================================
CREATE TABLE league_coverage (
  id BIGSERIAL PRIMARY KEY,
  league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  events BOOLEAN DEFAULT false,
  lineups BOOLEAN DEFAULT false,
  fixture_statistics BOOLEAN DEFAULT false,
  player_statistics BOOLEAN DEFAULT false,
  injuries BOOLEAN DEFAULT false,
  predictions BOOLEAN DEFAULT false,
  odds BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(league_id, season)
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  country TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIXTURES
-- ============================================================
CREATE TABLE fixtures (
  id BIGSERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,

  league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,

  home_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  fixture_date DATE NOT NULL,
  "timestamp" BIGINT,
  timezone TEXT,
  venue_name TEXT,
  venue_city TEXT,

  status_short TEXT NOT NULL DEFAULT 'NS',
  status_long TEXT,
  elapsed INTEGER,

  home_goals INTEGER,
  away_goals INTEGER,

  home_score_ht INTEGER,
  away_score_ht INTEGER,
  home_score_ft INTEGER,
  away_score_ft INTEGER,
  home_score_et INTEGER,
  away_score_et INTEGER,
  home_score_pen INTEGER,
  away_score_pen INTEGER,

  referee TEXT,
  round TEXT,

  is_live BOOLEAN DEFAULT false,
  is_finalized BOOLEAN DEFAULT false,
  last_api_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixtures_date ON fixtures(fixture_date);
CREATE INDEX idx_fixtures_status ON fixtures(status_short);
CREATE INDEX idx_fixtures_league ON fixtures(league_id);
CREATE INDEX idx_fixtures_home ON fixtures(home_team_id);
CREATE INDEX idx_fixtures_away ON fixtures(away_team_id);
CREATE INDEX idx_fixtures_live ON fixtures(is_live) WHERE is_live = true;
CREATE INDEX idx_fixtures_timestamp ON fixtures("timestamp");

-- ============================================================
-- FIXTURE STATISTICS
-- ============================================================
CREATE TABLE fixture_statistics (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  possession INTEGER,
  total_shots INTEGER,
  shots_on_goal INTEGER,
  shots_off_goal INTEGER,
  blocked_shots INTEGER,

  corner_kicks INTEGER,
  fouls INTEGER,
  offsides INTEGER,

  yellow_cards INTEGER,
  red_cards INTEGER,

  goalkeeper_saves INTEGER,

  expected_goals NUMERIC(5,2),

  raw_json JSONB,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fixture_id, team_id)
);

-- ============================================================
-- FIXTURE EVENTS
-- ============================================================
CREATE TABLE fixture_events (
  id BIGSERIAL PRIMARY KEY,
  api_event_key TEXT UNIQUE,

  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  player_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  player_name TEXT,

  event_type TEXT,
  event_detail TEXT,
  minute INTEGER,
  extra_minute INTEGER,

  raw_json JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_fixture ON fixture_events(fixture_id);

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  firstname TEXT,
  lastname TEXT,
  age INTEGER,
  nationality TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIXTURE PLAYERS
-- ============================================================
CREATE TABLE fixture_players (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  starter BOOLEAN DEFAULT false,
  substitute BOOLEAN DEFAULT false,
  position TEXT,
  shirt_number INTEGER,
  minutes INTEGER,
  rating NUMERIC(4,2),
  captain BOOLEAN DEFAULT false,

  shots INTEGER,
  shots_on_target INTEGER,
  goals INTEGER,
  assists INTEGER,

  passes INTEGER,
  tackles INTEGER,

  fouls_committed INTEGER,
  fouls_drawn INTEGER,

  yellow_cards INTEGER,
  red_cards INTEGER,

  raw_json JSONB,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fixture_id, player_id)
);

-- ============================================================
-- LINEUPS
-- ============================================================
CREATE TABLE lineups (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  formation TEXT,
  confirmed BOOLEAN DEFAULT false,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_json JSONB,

  UNIQUE(fixture_id, team_id)
);

-- ============================================================
-- LINEUP PLAYERS
-- ============================================================
CREATE TABLE lineup_players (
  id BIGSERIAL PRIMARY KEY,
  lineup_id BIGINT NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,

  starter BOOLEAN DEFAULT false,
  position TEXT,
  grid TEXT,
  shirt_number INTEGER
);

-- ============================================================
-- INJURIES
-- ============================================================
CREATE TABLE injuries (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT,

  injury_type TEXT,
  reason TEXT,
  status TEXT,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_json JSONB
);

CREATE INDEX idx_injuries_fixture ON injuries(fixture_id);

-- ============================================================
-- PREDICTIONS
-- ============================================================
CREATE TABLE predictions (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT UNIQUE NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,

  winner_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  winner_comment TEXT,

  home_percent NUMERIC(5,2),
  draw_percent NUMERIC(5,2),
  away_percent NUMERIC(5,2),

  under_over TEXT,
  advice TEXT,

  raw_json JSONB,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- ODDS SNAPSHOTS
-- ============================================================
CREATE TABLE odds_snapshots (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,

  bookmaker_id INTEGER,
  bookmaker_name TEXT,

  market_id INTEGER,
  market_name TEXT,

  selection TEXT,
  "line" TEXT,

  odd NUMERIC(8,3),

  is_live BOOLEAN DEFAULT false,

  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_odds_fixture ON odds_snapshots(fixture_id);
CREATE INDEX idx_odds_bookmaker ON odds_snapshots(bookmaker_id);
CREATE INDEX idx_odds_market ON odds_snapshots(market_id);
CREATE INDEX idx_odds_captured ON odds_snapshots(captured_at);

-- ============================================================
-- AI ANALYSES
-- ============================================================
CREATE TABLE ai_analyses (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,

  model TEXT NOT NULL,
  profile TEXT NOT NULL,
  reasoning TEXT NOT NULL,

  input_hash TEXT NOT NULL,

  data_quality TEXT,
  missing_data JSONB,

  result JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fixture_id, model, input_hash)
);

CREATE INDEX idx_analyses_fixture ON ai_analyses(fixture_id);
CREATE INDEX idx_analyses_hash ON ai_analyses(input_hash);

-- ============================================================
-- API RAW CACHE
-- ============================================================
CREATE TABLE api_raw_cache (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_key TEXT NOT NULL,

  fixture_id BIGINT REFERENCES fixtures(id) ON DELETE SET NULL,

  response JSONB,
  http_status INTEGER,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  UNIQUE(provider, request_key)
);

CREATE INDEX idx_raw_cache_provider ON api_raw_cache(provider);
CREATE INDEX idx_raw_cache_fixture ON api_raw_cache(fixture_id);
CREATE INDEX idx_raw_cache_expires ON api_raw_cache(expires_at);

-- ============================================================
-- SYNC LOCKS
-- ============================================================
CREATE TABLE sync_locks (
  id BIGSERIAL PRIMARY KEY,
  resource_key TEXT UNIQUE NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- API USAGE
-- ============================================================
CREATE TABLE api_usage (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_key TEXT,

  status_code INTEGER,
  cache_hit BOOLEAN DEFAULT false,

  requested_at TIMESTAMPTZ DEFAULT NOW(),

  quota_remaining INTEGER,
  rate_limit_remaining INTEGER,

  duration_ms INTEGER
);

CREATE INDEX idx_usage_provider ON api_usage(provider);
CREATE INDEX idx_usage_requested ON api_usage(requested_at);
CREATE INDEX idx_usage_cache_hit ON api_usage(cache_hit);

-- ============================================================
-- UTILITY: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixture_statistics_updated_at BEFORE UPDATE ON fixture_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
