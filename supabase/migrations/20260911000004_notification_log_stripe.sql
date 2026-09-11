-- Extend notification_log CHECK constraints to support Stripe webhook emails.
--
-- Audit finding (#24 — trial signup -> Stripe -> cron pipeline): the Stripe
-- webhook (app/api/stripe-webhook/route.ts) sends a "subscription active"
-- email on checkout.session.completed and a "data will be deleted" email on
-- customer.subscription.deleted, neither claimed against notification_log
-- first. Stripe explicitly does not guarantee exactly-once delivery -- the
-- same event can be redelivered (network issues, timeouts, manual resends
-- from the Stripe dashboard) -- and event.id is stable across redeliveries
-- of the same event, so it's a correct dedup key.
--
-- Note: lib/types.ts (generated from the live schema) already includes
-- 'data_deletion_warning' and 'organisation' as allowed values, but no
-- migration file in this repo adds them -- the live constraint has drifted
-- ahead of what's tracked here, presumably via a manual change. This
-- migration's base list includes both so it stays a safe superset of the
-- live constraint regardless; it doesn't attempt to reconcile the drift
-- itself.
--
-- notification_type gains: 'stripe_event'
-- entity_type gains:       'subscription'
--
-- Stripe webhook emails use:
--   notification_type = 'stripe_event'
--   entity_type       = 'subscription'
--   entity_id         = the Stripe event.id (stable across redeliveries of the same event)
--   due_date          = today's date (no real "due date" concept here; kept
--                        NOT NULL-compatible and consistent with other rows)
--   recipient_email   = admin email
--
-- The existing unique index already covers this combination, so no new
-- index needed.

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'due_soon', 'overdue',
    'trial_day', 'onboarding_week', 'user_onboarding',
    'weekly_digest', 'data_deletion_warning',
    'stripe_event'
  ));

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_entity_type_check;
ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_entity_type_check
  CHECK (entity_type IN (
    'kloe', 'hr_dbs', 'hr_supervision', 'hr_appraisal', 'hr_training',
    'trial', 'onboarding', 'user', 'organisation',
    'governance_digest',
    'subscription'
  ));
