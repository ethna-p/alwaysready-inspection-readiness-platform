-- Add is_beta flag to organisations.
-- Beta partners pay £50/month permanently in exchange for feedback.
-- Default false — existing organisations are unaffected.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS is_beta boolean NOT NULL DEFAULT false;
