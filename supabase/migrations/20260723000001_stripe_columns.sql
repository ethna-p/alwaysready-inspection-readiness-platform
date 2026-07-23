-- Add Stripe customer and subscription tracking columns to organisations.
-- stripe_customer_id  — Stripe's Customer object ID (cus_...)
-- stripe_subscription_id — Stripe's Subscription object ID (sub_...)
-- subscription_tier is already present and used for access control:
--   'trial'   — within free trial period
--   'active'  — paying subscriber
--   'past_due'— payment failed, grace period
--   'canceled' — subscription ended, access blocked

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
