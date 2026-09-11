-- Migration: force a password change after an admin-initiated reset
--
-- resetTeamMemberPassword (app/dashboard/account/team-actions.ts) lets an org
-- admin generate a new password for a teammate and hand it to them out of
-- band. Today that password just works indefinitely — the teammate is never
-- prompted to pick their own. This column lets that flow flag the account so
-- the app can force a change before the teammate can do anything else.
--
-- Not touched by the ordinary self-service flows (trial signup, team invite,
-- visitor login): those already create the auth user with no usable password
-- at all, so the user must set one via an email link before they can even
-- log in — there's nothing to force here.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.must_change_password IS
  'Set true when an admin resets this user''s password for them. Middleware forces a redirect to /dashboard/account/change-password until the user sets their own password, which clears this flag.';
