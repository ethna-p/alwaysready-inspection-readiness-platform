-- M21: cron_heartbeats, the "last time this scheduled job finished successfully" record.
--
-- Vercel runs the scheduled jobs (vercel.json) but does not tell anyone when one stops running, times
-- out or errors. Each job now stamps its row here when it finishes successfully, and /api/health turns
-- 503 when any job has been quiet for longer than its schedule allows (see lib/cron-health.ts), which an
-- external uptime monitor watching that endpoint turns into an email.
--
-- The rows are seeded with now() so a job that NEVER runs after this deploy still goes stale, instead of
-- being invisible because it has no row.
--
-- Server-only: RLS on with no policies; anon and authenticated have no privileges. Service role only.

CREATE TABLE public.cron_heartbeats (
  job             text        PRIMARY KEY,
  last_success_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_heartbeats ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cron_heartbeats FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cron_heartbeats TO service_role;

INSERT INTO public.cron_heartbeats (job) VALUES
  ('review-reminders'),
  ('trial-emails'),
  ('onboarding-emails'),
  ('waitlist-nurture'),
  ('governance-digest'),
  ('data-deletion'),
  ('notification-reconfirmation'),
  ('demo-reminder');

COMMENT ON TABLE public.cron_heartbeats IS
  'Last successful finish of each scheduled job. Read by /api/health to alert when a job goes quiet. Service role only.';
