-- Add optional charity registration number to organisations.
-- Stored as entered by the user at trial signup; used to verify charity status
-- and apply the charity discount. NULL means not a charity (or not yet confirmed).

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS charity_number TEXT;
