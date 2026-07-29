-- Track when an organisation's subscription was first confirmed by Stripe.
-- Set by the stripe-webhook on checkout.session.completed.
-- Used to drive the post-subscription weekly onboarding email sequence.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ;
