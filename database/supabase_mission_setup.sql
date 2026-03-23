-- ================================================================
-- Supabase SQL Setup — Robot Dashboard Mission Planner
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- NOTE: org_id is stored as TEXT to be compatible with both
--       integer org_ids (e.g. "1") and UUID org_ids.
-- ================================================================

-- 1. Maps table
CREATE TABLE IF NOT EXISTS maps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,        -- text: works with both int (1) and uuid org_ids
  name        text NOT NULL,
  image_url   text NOT NULL,
  width       int,
  height      int,
  scale       float DEFAULT 1.0,
  created_at  timestamptz DEFAULT now()
);

-- 2. Routes table
CREATE TABLE IF NOT EXISTS routes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id      uuid REFERENCES maps(id) ON DELETE CASCADE,
  org_id      text NOT NULL,
  name        text NOT NULL,
  path_json   jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 3. Missions table
CREATE TABLE IF NOT EXISTS missions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id      uuid NOT NULL,
  route_id      uuid REFERENCES routes(id),
  status        text DEFAULT 'pending',  -- pending | active | completed | cancelled
  started_at    timestamptz,
  completed_at  timestamptz
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE maps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write rows matching their org_id
CREATE POLICY "org_maps_policy" ON maps
  USING (org_id = (auth.jwt()->'app_metadata'->>'org_id')::text)
  WITH CHECK (org_id = (auth.jwt()->'app_metadata'->>'org_id')::text);

CREATE POLICY "org_routes_policy" ON routes
  USING (org_id = (auth.jwt()->'app_metadata'->>'org_id')::text)
  WITH CHECK (org_id = (auth.jwt()->'app_metadata'->>'org_id')::text);

CREATE POLICY "org_missions_read" ON missions
  FOR SELECT USING (true);  -- All authenticated org members can read missions

CREATE POLICY "admin_missions_write" ON missions
  FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- ── Storage Bucket ────────────────────────────────────────────────────────────
-- In Supabase Dashboard:
--   Storage → New Bucket → Name: "maps" → Enable "Public bucket" → Save
