-- Migration: fix "Admins can change another team member's role" -- it
-- never actually worked
--
-- 20260915100601_allow_admin_change_team_member_role.sql added a policy
-- meant to let an admin change another team member's role, but wrote its
-- USING/WITH CHECK conditions as raw inline subqueries against
-- public.users itself:
--   (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
-- Confirmed directly against the database (a real admin session update,
-- checked before and after) that this still updated zero rows -- the
-- exact same silent no-op the migration was meant to fix. A raw
-- self-referential subquery inside a policy on the SAME table it
-- protects is a known Postgres RLS footgun: every other working policy
-- in this codebase (incidents_update, governance_meetings_update,
-- feedback_records_update, and this table's own other policies) reads
-- the acting user's role/org through the get_user_role()/
-- get_user_org_id() SECURITY DEFINER helpers instead, precisely to avoid
-- it -- 20260915100601 just didn't follow that pattern.
--
-- Those helpers also enforce H2's AAL2 requirement
-- (20260904000002_h2_enforce_aal2_in_rls_helpers.sql): get_user_role()
-- returns NULL for an admin/user-role session that hasn't completed MFA
-- this session, so an admin using this policy is also implicitly
-- required to be AAL2 -- matching every other sensitive admin action in
-- this app, which the original version didn't enforce either.
--
-- Replaces the policy with the identical intent, this time using the
-- helpers.

DROP POLICY IF EXISTS "Admins can change another team member's role" ON public.users;

CREATE POLICY "Admins can change another team member's role"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id != auth.uid()
    AND organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  )
  WITH CHECK (
    id != auth.uid()
    AND organisation_id = get_user_org_id()
  );
