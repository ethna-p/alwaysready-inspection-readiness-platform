-- Migration: add CQC rating columns to organisations
-- Stores the most recent CQC overall rating fetched from the public
-- CQC Syndication API, along with the inspection date and when we
-- last refreshed the data.  All columns are nullable — orgs without
-- a published CQC rating simply have NULL values.

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS cqc_location_name      TEXT,
  ADD COLUMN IF NOT EXISTS cqc_rating              TEXT,
  ADD COLUMN IF NOT EXISTS cqc_last_inspection_date DATE,
  ADD COLUMN IF NOT EXISTS cqc_rating_fetched_at   TIMESTAMPTZ;

-- No new RLS policies needed — the existing policies on organisations
-- already control access to all columns on this table.
-- No GRANTs needed — existing grants on organisations cover new columns.

COMMENT ON COLUMN public.organisations.cqc_location_name      IS 'Service name as held on the CQC public register';
COMMENT ON COLUMN public.organisations.cqc_rating              IS 'Overall CQC rating: Outstanding | Good | Requires improvement | Inadequate';
COMMENT ON COLUMN public.organisations.cqc_last_inspection_date IS 'Date of the most recently published CQC inspection report';
COMMENT ON COLUMN public.organisations.cqc_rating_fetched_at   IS 'When we last fetched rating data from the CQC Syndication API';
