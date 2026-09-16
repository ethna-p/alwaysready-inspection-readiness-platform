-- ── Editable email templates ─────────────────────────────────────────────────
--
-- Lets a superadmin edit the HTML of any customer-facing email from
-- app/superadmin/email-templates without a code change or deploy. Storage is
-- append-only: every save inserts a new version rather than overwriting, so
-- the superadmin UI can show history and restore an older version (itself
-- just another insert, keeping the trail intact).
--
-- template_id is a stable string matching a lib/email-templates/registry.ts
-- entry (e.g. 'onboarding_week_01'). "Current" for a template is simply its
-- most recent row. A template with no rows here has never been customized;
-- the send path falls back to the hardcoded default already in the code.
--
-- html stores plain HTML with {{token}} placeholders (e.g. {{firstName}}),
-- substituted at send time. No RLS policies granted to `authenticated`:
-- service-role only via superadmin server actions, matching the pattern
-- already used for mfa_backup_codes and notification_feedback.

CREATE TABLE IF NOT EXISTS public.email_template_versions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  text        NOT NULL,
  html         text        NOT NULL,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_template_versions_template_idx
  ON public.email_template_versions (template_id, created_at DESC);

ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only, by design (see comment above).
