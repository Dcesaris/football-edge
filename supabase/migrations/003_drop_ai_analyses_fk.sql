-- ============================================================
-- 003: Drop FK constraint on ai_analyses.fixture_id
-- ============================================================
-- The FK to fixtures(id) blocks caching analysis for fixtures
-- that exist in api-football but haven't been synced to fixtures table.
-- Cache the analysis regardless; fixture_id is just an analytical reference.

ALTER TABLE ai_analyses DROP CONSTRAINT IF EXISTS ai_analyses_fixture_id_fkey;

-- Add a regular index for fixture lookups (already exists via idx_analyses_fixture)
