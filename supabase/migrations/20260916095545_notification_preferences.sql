-- ── Opt-in system notifications (Issue #31) ─────────────────────────────────
--
-- review-reminders and governance-digest (the two cron-driven "operational"
-- emails, as opposed to trial/billing or compliance-critical ones like
-- data-deletion) currently go out to every admin unconditionally. Per #31,
-- these become opt-in: an admin gets neither unless they've explicitly
-- turned it on from Account -> Notifications.
--
-- notification_prefs_confirmed_at drives the 4-6 week re-confirmation cron
-- (not yet added here) -- set whenever the admin visits/saves the
-- Notifications tab, so a stale confirmation is the trigger for the next
-- re-confirmation email. No magic-link token needed: that email just points
-- back to the same authenticated tab.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notify_review_reminders        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_governance_digest        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_prefs_confirmed_at timestamptz;

COMMENT ON COLUMN public.users.notify_review_reminders IS
  'Opt-in for KLOE/HR review-due cron emails (app/api/cron/review-reminders). Default false -- opt-in, not opt-out.';
COMMENT ON COLUMN public.users.notify_governance_digest IS
  'Opt-in for the weekly governance digest cron email (app/api/cron/governance-digest). Default false -- opt-in, not opt-out.';
COMMENT ON COLUMN public.users.notification_prefs_confirmed_at IS
  'Last time this user visited/saved Account -> Notifications. Drives the 4-6 week re-confirmation cron -- stale or null (with something enabled) triggers the next re-confirmation email.';

-- ── Notification feedback (the re-confirmation email's poll) ───────────────
--
-- One row per submission, account-wide (not per-notification-type, matching
-- the single re-confirmation check-in decision) -- a short usefulness rating
-- plus an optional free-text suggestion.
--
-- No RLS policies granted to `authenticated`: every read and write goes
-- through a 'use server' action on the service-role admin client (the same
-- deliberate pattern already used for mfa_backup_codes -- see that table's
-- own migration comment), including the submitting user's own insert.

CREATE TABLE IF NOT EXISTS public.notification_feedback (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id  uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  usefulness       text        NOT NULL CHECK (usefulness IN ('very_useful', 'somewhat_useful', 'not_useful')),
  suggestion       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_feedback_org_idx ON public.notification_feedback (organisation_id, created_at DESC);

ALTER TABLE public.notification_feedback ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only, by design (see comment above).
