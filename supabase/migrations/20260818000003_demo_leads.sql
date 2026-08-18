-- Migration: create demo_leads table
-- Stores pre-booking intake data from the /demo page on alwaysready.uk.
-- Collected before the user is sent to the Zeeg scheduler.

CREATE TABLE IF NOT EXISTS demo_leads (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT        NOT NULL,
  cqc_rating   TEXT,
  demo_type    TEXT        NOT NULL, -- '15min' | '30min'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;
-- No public access — read/write only via the service role key (admin client).
