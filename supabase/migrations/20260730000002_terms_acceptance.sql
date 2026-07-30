-- Migration: add T&Cs acceptance tracking to organisations
--
-- terms_accepted_at — timestamp when the trial signup user ticked the
--   "I agree to the Terms & Conditions" checkbox. NULL for organisations
--   provisioned by superadmin before this feature existed.
--
-- terms_version — which version of the T&Cs was accepted (e.g. 'v1.0').
--   Allows us to identify which version was in force at acceptance time,
--   and to prompt re-acceptance if the T&Cs are materially updated.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terms_version      TEXT        DEFAULT NULL;

COMMENT ON COLUMN organisations.terms_accepted_at IS
  'Timestamp when the admin accepted the T&Cs at trial signup. NULL for superadmin-provisioned orgs.';

COMMENT ON COLUMN organisations.terms_version IS
  'Version string of the T&Cs accepted (e.g. ''v1.0''). Used to detect when re-acceptance is needed.';

GRANT SELECT, UPDATE ON public.organisations TO authenticated;
