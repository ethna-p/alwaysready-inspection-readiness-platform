-- Add is_charity flag to organisations.
-- Charity orgs receive a 20% discount automatically applied at Stripe checkout
-- via a pre-created coupon (STRIPE_CHARITY_COUPON_ID env var).
-- Default false — existing organisations are unaffected.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS is_charity boolean NOT NULL DEFAULT false;
