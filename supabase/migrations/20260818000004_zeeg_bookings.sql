-- Migration: create zeeg_bookings table
-- Stores booking confirmations received via Zeeg webhook.
-- Captures email and name of the booker — data not available at demo intake time.

CREATE TABLE IF NOT EXISTS zeeg_bookings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uuid      TEXT        NOT NULL,          -- Zeeg eventUuid (zg-XXX), dedup key
  invitee_uuid    TEXT        NOT NULL,          -- Zeeg inviteeUuid, tracks reschedules
  invitee_email   TEXT        NOT NULL,
  invitee_name    TEXT,
  demo_type       TEXT        NOT NULL,          -- '15min' | '30min' derived from duration
  booked_at       TIMESTAMPTZ NOT NULL,          -- startAt from webhook
  cancelled       BOOLEAN     NOT NULL DEFAULT false,
  raw_payload     JSONB,                         -- full webhook payload for reference
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique on invitee_uuid so rescheduled bookings can be upserted without duplicates
CREATE UNIQUE INDEX IF NOT EXISTS zeeg_bookings_invitee_uuid_idx ON zeeg_bookings (invitee_uuid);

ALTER TABLE zeeg_bookings ENABLE ROW LEVEL SECURITY;
-- No public access — read/write only via the service role key (admin client).
