-- Extend notification_log CHECK constraints to support weekly onboarding emails.
--
-- notification_type gains: 'onboarding_week'
-- entity_type gains:       'onboarding'
--
-- Onboarding emails use:
--   notification_type = 'onboarding_week'
--   entity_type       = 'onboarding'
--   entity_id         = 'week_01' … 'week_12'
--   due_date          = subscribed_at date (anchor)
--   recipient_email   = admin email

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN ('due_soon', 'overdue', 'trial_day', 'onboarding_week'));

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_entity_type_check;

ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_entity_type_check
  CHECK (entity_type IN ('kloe', 'hr_dbs', 'hr_supervision', 'hr_appraisal', 'hr_training', 'trial', 'onboarding'));
