-- M20: cron_claims, a generic "send this once" ledger for scheduled jobs that have no organisation.
--
-- Problem found by the 2026-09-21 audit: several scheduled email jobs could send the same
-- email twice. Vercel can deliver a cron invocation more than once, and on the Hobby plan a
-- job fires anywhere within its scheduled hour. The organisation-scoped jobs already have a
-- guard (notification_log's unique index), but the jobs that email AlwaysReady itself or a
-- waitlist lead (demo-reminder, waitlist-nurture) have no organisation to key on, and
-- demo-reminder had no guard at all.
--
-- Usage: a job INSERTs (job, claim_key) before sending. Postgres error 23505 means another
-- invocation already claimed it, so the job skips. If the send then fails, the job DELETEs the
-- claim so a later run can retry. The insert is atomic, so two overlapping invocations can
-- never both win.
--
-- Server-only: RLS is on with no policies, and anon/authenticated have no privileges at all.
-- Only the service role (used by the cron routes) can read or write it.

CREATE TABLE public.cron_claims (
  job        text        NOT NULL,
  claim_key  text        NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job, claim_key)
);

ALTER TABLE public.cron_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cron_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.cron_claims TO service_role;

COMMENT ON TABLE public.cron_claims IS
  'Send-once ledger for org-less scheduled jobs. Insert to claim, 23505 = already done, delete to release after a failed send. Service role only.';
