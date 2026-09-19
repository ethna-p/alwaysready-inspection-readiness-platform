-- Fix: demo_leads was originally created in July 2026 for the /demo gate form
-- (first_name, last_name, email, marketing_consent). The August 2026 migration
-- tried to replace the schema for the pre-booking intake flow, but used
-- CREATE TABLE IF NOT EXISTS — which silently no-ops when the table exists.
--
-- Result: /api/inbound-demo has been failing silently on every insert because
-- the columns (service_type, cqc_rating, demo_type) don't exist. Users are
-- always redirected to Zeeg regardless, so the failure was invisible.
--
-- Fix: clear the stale gate-form rows and replace the column set.

DELETE FROM public.demo_leads;

ALTER TABLE public.demo_leads
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS marketing_consent;

ALTER TABLE public.demo_leads
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cqc_rating   TEXT,
  ADD COLUMN IF NOT EXISTS demo_type    TEXT NOT NULL DEFAULT '';

-- Remove the temporary defaults now that the table is empty
ALTER TABLE public.demo_leads
  ALTER COLUMN service_type DROP DEFAULT,
  ALTER COLUMN demo_type    DROP DEFAULT;
