-- =============================================================
-- Add marketing_consent to demo_leads
--
-- Tracks whether the visitor opted in to blog/newsletter updates
-- from the /demo gate form. Unchecked by default — valid GDPR
-- opt-in requires an explicitly affirmative action.
-- =============================================================

ALTER TABLE public.demo_leads
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.demo_leads.marketing_consent IS
  'TRUE if the visitor ticked "Keep me updated" on the /demo gate form. Unchecked by default (GDPR).';
