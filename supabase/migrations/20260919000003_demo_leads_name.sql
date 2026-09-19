-- Add name to demo_leads so the person's full name from the intake form
-- is stored alongside their email, service type, and CQC rating.
-- Mirrors what the intake API already sends on every insert.
ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS name TEXT;
