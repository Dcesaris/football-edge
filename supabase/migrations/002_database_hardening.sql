-- Football Edge Database Hardening
-- Migration 002: FK fix, RLS, indexes
-- Date: 2026-08-30

-- ============================================================
-- 1. FIX FK: fixture_events.player_id → players(id)
-- ============================================================

-- Drop the incorrect FK (references teams instead of players)
ALTER TABLE fixture_events
  DROP CONSTRAINT IF EXISTS fixture_events_player_id_fkey;

-- Re-create with correct reference
ALTER TABLE fixture_events
  ADD CONSTRAINT fixture_events_player_id_fkey
  FOREIGN KEY (player_id)
  REFERENCES players(id)
  ON DELETE SET NULL;

-- ============================================================
-- 2. RLS — enable on all tables, no public policies
-- ============================================================

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_raw_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (service_role bypasses RLS by default,
-- but this ensures anon/authenticated get nothing)
ALTER TABLE leagues FORCE ROW LEVEL SECURITY;
ALTER TABLE seasons FORCE ROW LEVEL SECURITY;
ALTER TABLE league_coverage FORCE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;
ALTER TABLE fixtures FORCE ROW LEVEL SECURITY;
ALTER TABLE fixture_statistics FORCE ROW LEVEL SECURITY;
ALTER TABLE fixture_events FORCE ROW LEVEL SECURITY;
ALTER TABLE players FORCE ROW LEVEL SECURITY;
ALTER TABLE fixture_players FORCE ROW LEVEL SECURITY;
ALTER TABLE lineups FORCE ROW LEVEL SECURITY;
ALTER TABLE lineup_players FORCE ROW LEVEL SECURITY;
ALTER TABLE injuries FORCE ROW LEVEL SECURITY;
ALTER TABLE predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses FORCE ROW LEVEL SECURITY;
ALTER TABLE api_raw_cache FORCE ROW LEVEL SECURITY;
ALTER TABLE sync_locks FORCE ROW LEVEL SECURITY;
ALTER TABLE api_usage FORCE ROW LEVEL SECURITY;

-- No policies created → anon/authenticated get zero rows
-- service_role bypasses RLS by default → backend works normally

-- ============================================================
-- 3. ADD MISSING INDEXES
-- ============================================================

-- api_raw_cache: compound index for lookup
CREATE INDEX IF NOT EXISTS idx_raw_cache_provider_key
  ON api_raw_cache(provider, request_key);

-- api_usage: compound index for provider + time queries
CREATE INDEX IF NOT EXISTS idx_usage_provider_requested
  ON api_usage(provider, requested_at);

-- odds_snapshots: compound index for fixture + time (closing odds)
CREATE INDEX IF NOT EXISTS idx_odds_fixture_captured
  ON odds_snapshots(fixture_id, captured_at DESC);

-- ai_analyses: compound index for dedup lookup
CREATE INDEX IF NOT EXISTS idx_analyses_fixture_model_hash
  ON ai_analyses(fixture_id, model, input_hash);

-- fixtures: compound index for date + status (common query)
CREATE INDEX IF NOT EXISTS idx_fixtures_date_status
  ON fixtures(fixture_date, status_short);

-- fixture_statistics: index for fixture lookup
CREATE INDEX IF NOT EXISTS idx_stats_fixture
  ON fixture_statistics(fixture_id);

-- fixture_players: index for fixture lookup
CREATE INDEX IF NOT EXISTS idx_players_fixture
  ON fixture_players(fixture_id);

-- ============================================================
-- 4. VERIFY FK INTEGRITY AUDIT
-- ============================================================
-- All FKs verified correct:
--
-- fixture_statistics.fixture_id → fixtures(id) ✓
-- fixture_statistics.team_id → teams(id) ✓
-- fixture_events.fixture_id → fixtures(id) ✓
-- fixture_events.team_id → teams(id) ✓
-- fixture_events.player_id → players(id) ✓ (FIXED in this migration)
-- fixture_players.fixture_id → fixtures(id) ✓
-- fixture_players.team_id → teams(id) ✓
-- fixture_players.player_id → players(id) ✓
-- lineups.fixture_id → fixtures(id) ✓
-- lineups.team_id → teams(id) ✓
-- lineup_players.lineup_id → lineups(id) ✓
-- lineup_players.player_id → players(id) ✓
-- injuries.fixture_id → fixtures(id) ✓
-- injuries.team_id → teams(id) ✓
-- injuries.player_id → players(id) ✓
-- predictions.fixture_id → fixtures(id) ✓
-- predictions.winner_team_id → teams(id) ✓
-- odds_snapshots.fixture_id → fixtures(id) ✓
-- ai_analyses.fixture_id → fixtures(id) ✓
-- seasons.league_id → leagues(id) ✓
-- league_coverage.league_id → leagues(id) ✓
-- fixtures.league_id → leagues(id) ✓
-- fixtures.home_team_id → teams(id) ✓
-- fixtures.away_team_id → teams(id) ✓
