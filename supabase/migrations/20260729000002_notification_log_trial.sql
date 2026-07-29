-- Extend notification_log CHECK constraints to support trial lifecycle emails.
--
-- notification_type gains: 'trial_day'
-- entity_type gains:       'trial'
--
-- Trial emails use:
--   notification_type = 'trial_day'
--   entity_type       = 'trial'
--   entity_id         = 'day_01' | 'day_03' | 'day_05' | 'day_07' | 'day_09' | 'day_11' | 'day_13'
--   due_date          = trial_expires_at (anchor; ensures re-fire if trial extended)
--   recipient_email   = admin email
--
-- The existing unique index already covers this combination, so no new index needed.

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN ('due_soon', 'overdue', 'trial_day'));

ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_entity_type_check;

ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_entity_type_check
  CHECK (entity_type IN ('kloe', 'hr_dbs', 'hr_supervision', 'hr_appraisal', 'hr_training', 'trial'));
