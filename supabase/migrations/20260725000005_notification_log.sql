-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: notification_log
--
-- Tracks every review-reminder email sent by the nightly cron so the same
-- notification is never sent twice for the same entity / due-date cycle.
--
-- entity_type values:
--   'kloe'            — a compliance_record review reminder
--   'hr_dbs'          — DBS check renewal (hr_staff_profiles.dbs_next_review_due)
--   'hr_supervision'  — Supervision renewal  (hr_staff_profiles.supervision_next_due)
--   'hr_appraisal'    — Appraisal renewal    (hr_staff_profiles.appraisal_next_due)
--   'hr_training'     — Training renewal     (hr_training_records.next_due)
--
-- notification_type values:
--   'due_soon'  — sent when due date is 1–7 days away
--   'overdue'   — sent when due date has passed
--
-- The unique index on (organisation_id, notification_type, entity_type,
-- entity_id, due_date, recipient_email) ensures exactly one row per event,
-- so the cron can safely re-run without double-sending.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.notification_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  notification_type text        NOT NULL CHECK (notification_type IN ('due_soon', 'overdue')),
  entity_type       text        NOT NULL CHECK (entity_type IN ('kloe', 'hr_dbs', 'hr_supervision', 'hr_appraisal', 'hr_training')),
  entity_id         text        NOT NULL,  -- klo_item_id, staff user_id, or hr_training_record_id
  due_date          date        NOT NULL,  -- the due date that triggered this notification
  recipient_email   text        NOT NULL,
  sent_at           timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate sends for the same event
CREATE UNIQUE INDEX notification_log_unique
  ON public.notification_log (organisation_id, notification_type, entity_type, entity_id, due_date, recipient_email);

-- Index for cron lookups (checking what's already been sent)
CREATE INDEX notification_log_lookup
  ON public.notification_log (organisation_id, entity_type, entity_id, due_date);

-- RLS — admins can view their org's log; service role bypasses for cron writes
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their org notification log"
  ON public.notification_log
  FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

GRANT SELECT ON public.notification_log TO authenticated;
-- INSERT/DELETE only via service role (used by the cron route)
