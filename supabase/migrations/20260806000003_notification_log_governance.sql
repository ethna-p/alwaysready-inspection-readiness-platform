-- Extend notification_log CHECK constraints to support weekly governance digest.

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'due_soon', 'overdue',
    'trial_day', 'onboarding_week', 'user_onboarding',
    'weekly_digest'
  ));

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_entity_type_check;
ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_entity_type_check
  CHECK (entity_type IN (
    'kloe', 'hr_dbs', 'hr_supervision', 'hr_appraisal', 'hr_training',
    'trial', 'onboarding', 'user',
    'governance_digest'
  ));
