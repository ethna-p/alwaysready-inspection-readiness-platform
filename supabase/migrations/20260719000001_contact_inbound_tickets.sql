-- Migration: support website enquiry tickets
-- Makes organisation_id nullable and adds source/external contact columns.

-- Allow tickets without an organisation (website enquiries)
ALTER TABLE public.support_tickets
  ALTER COLUMN organisation_id DROP NOT NULL;

-- Track ticket origin and external sender details
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS source        text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS external_email text,
  ADD COLUMN IF NOT EXISTS external_name  text;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS support_tickets_source_idx
  ON public.support_tickets (source);
