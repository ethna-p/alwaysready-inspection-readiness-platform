-- ── Data retention: deletion due date ────────────────────────────────────────
--
-- Adds data_deletion_due_at to organisations.
-- Set to now() + 30 days when:
--   (a) a trial lapses without subscribing (detected by cron)
--   (b) a paid subscription is cancelled (detected by Stripe webhook)
--
-- The /api/cron/data-deletion job runs daily and hard-deletes any organisation
-- where data_deletion_due_at < now(). All child rows are removed via ON DELETE
-- CASCADE on their foreign keys to organisations(id).

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS data_deletion_due_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.organisations.data_deletion_due_at IS
  'When set, the organisation''s data will be permanently deleted on this date. '
  'Set 30 days after trial expiry or subscription cancellation. '
  'NULL means no scheduled deletion.';
