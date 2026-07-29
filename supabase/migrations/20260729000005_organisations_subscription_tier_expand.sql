-- Extend subscription_tier CHECK to include 'past_due' and 'canceled'.
--
-- The Stripe webhook has always written these values on payment failure and
-- cancellation, but the CHECK constraint only allowed 'trial' and 'active',
-- causing those updates to fail silently and leaving lapsed orgs with full
-- dashboard access indefinitely.
--
-- This migration makes the constraint match the webhook's actual behaviour.
-- dashboard/layout.tsx is updated in the same deploy to block access for
-- 'canceled' and 'past_due' tiers.

ALTER TABLE public.organisations
  DROP CONSTRAINT IF EXISTS organisations_subscription_tier_check;

ALTER TABLE public.organisations
  ADD CONSTRAINT organisations_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'active', 'past_due', 'canceled'));
