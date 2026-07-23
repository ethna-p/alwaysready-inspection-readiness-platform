-- Add is_beta flag to organisations.
-- Beta users are manually provisioned by superadmin and receive extended
-- trials, personal onboarding, and are tracked separately from self-service signups.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS is_beta boolean NOT NULL DEFAULT false;
