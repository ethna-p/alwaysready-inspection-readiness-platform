-- Migration: allow self-read on public.users regardless of AAL
--
-- BUG FIX: 20260904000002_h2_enforce_aal2_in_rls_helpers.sql changed
-- get_user_org_id() to return NULL for admin/user sessions that have not
-- completed MFA (aal1). The users SELECT policy is
-- `organisation_id = get_user_org_id()`, so at aal1 that policy returns
-- zero rows -- including for a user's own row.
--
-- This breaks the MFA-enrolment flow itself: middleware.ts needs to read
-- a newly-provisioned user's role (to know whether to force them to
-- /dashboard/account/mfa/setup) before they have a chance to enrol, and
-- app/dashboard/layout.tsx needs organisation_id for the same aal1 user.
-- Both queries are blocked by RLS, both return null, and the app ends up
-- bouncing the user between /login and /dashboard forever
-- (ERR_TOO_MANY_REDIRECTS).
--
-- Fix: add a second, additive SELECT policy that lets a user read their
-- own row by id, independent of AAL or organisation. Postgres evaluates
-- multiple permissive policies for the same command with OR, so this
-- does not weaken the existing org-scoped policy for reading OTHER users'
-- rows, and it does not touch get_user_org_id() or any other table's
-- policy -- cross-user and cross-org reads at aal1 remain blocked exactly
-- as H2 intended. It only ever exposes a user's own row to themselves.

CREATE POLICY "users_select_own_row" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
