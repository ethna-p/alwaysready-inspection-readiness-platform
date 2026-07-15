-- Migration: Beta launch + billing fields
--
-- Adds trial_expires_at (for real beta/trial accounts, separate from
-- demo_expires_at which is for anonymous shadow orgs).
-- Simplifies subscription_tier to 'trial' | 'active'.
-- Adds Stripe references for Phase 2.
-- Adds marketing_consent + onboarding_complete to users.

-- ─────────────────────────────────────────────
-- organisations: trial + billing columns
-- ─────────────────────────────────────────────

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS trial_expires_at        timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text;

-- Replace 'starter' | 'pro' with 'active' in the CHECK constraint
ALTER TABLE public.organisations
  DROP CONSTRAINT IF EXISTS organisations_subscription_tier_check;

UPDATE public.organisations
  SET subscription_tier = 'active'
  WHERE subscription_tier IN ('starter', 'pro');

ALTER TABLE public.organisations
  ADD CONSTRAINT organisations_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'active'));

-- ─────────────────────────────────────────────
-- users: consent + onboarding flag
-- ─────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_consent    boolean,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_complete  boolean NOT NULL DEFAULT false;
