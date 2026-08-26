-- Add is_tester flag to organisations
-- Used to distinguish internal test accounts from genuine beta/paid orgs

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS is_tester boolean NOT NULL DEFAULT false;
