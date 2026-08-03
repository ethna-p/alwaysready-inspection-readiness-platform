-- Add nurture_opt_in consent field to waitlist_leads
-- Tracks whether a waitlist subscriber has opted in to receive
-- the AlwaysReady nurture email sequence.

ALTER TABLE waitlist_leads
  ADD COLUMN nurture_opt_in boolean NOT NULL DEFAULT false;
