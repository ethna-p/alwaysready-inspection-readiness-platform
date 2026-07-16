-- =============================================================
-- Demo lead capture
--
-- Stores contact details submitted on the /demo gate form.
-- Fields match OpenCRM lead fields: first_name, last_name, email.
--
-- RLS is enabled with no permissive policies, so the anon key
-- cannot read or write this table. All inserts go through the
-- service role key via the saveDemoLead server action.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.demo_leads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lock it down — service role only, no anon access
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.demo_leads IS
  'Leads captured from the /demo gate form. Writable only via service role key.';
