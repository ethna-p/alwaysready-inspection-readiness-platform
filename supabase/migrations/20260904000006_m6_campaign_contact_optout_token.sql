-- Migration: M6 — per-contact opt-out token on campaign_contacts
--
-- SECURITY FIX (M6): The inbound-optout route matches campaign contacts by
-- postcode only. Anyone who knows a care home's postcode can opt them out of
-- marketing without their consent.
--
-- Fix: add a unique optout_token (UUID) per campaign_contact, generated at
-- insert time. Marketing emails will include this token in the opt-out URL.
-- The inbound-optout route is updated separately to:
--   1. Accept token-based opt-outs (look up the specific contact directly).
--   2. Reject postcode-only requests (require email + postcode together if no
--      token is provided).

ALTER TABLE public.campaign_contacts
  ADD COLUMN IF NOT EXISTS optout_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Unique index so token lookups are fast and collision-safe
CREATE UNIQUE INDEX IF NOT EXISTS campaign_contacts_optout_token_idx
  ON public.campaign_contacts (optout_token);
