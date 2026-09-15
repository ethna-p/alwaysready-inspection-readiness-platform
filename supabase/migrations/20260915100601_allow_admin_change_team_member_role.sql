-- Migration: allow admins to actually change another team member's role
--
-- FUNCTIONAL FIX: changeTeamMemberRole() (app/dashboard/account/team-actions.ts)
-- has always silently no-op'd. The only UPDATE policy on public.users was
-- "Users can update their own profile" (id = auth.uid()), added by
-- 20260901000002_protect_auth_columns.sql ("H2") to close a genuine
-- self-escalation hole -- but as a side effect, that policy's USING clause
-- also blocks the one thing an admin is supposed to be able to do: change
-- another team member's role from the Team page. The action uses the
-- regular RLS-enforced client (not the admin/service-role client), so
-- every attempt to change someone else's role has always updated zero
-- rows and still returned "Role updated." -- confirmed directly against
-- the database (a real UPDATE from a real admin session, not just read
-- from the code): the row's role never moved.
--
-- Adds a second, narrowly-scoped UPDATE policy: an admin may update
-- another user's row, but only one already in their own org (mirrored in
-- both USING and WITH CHECK, so this can never be used to move a row
-- into, or reach a row already in, a different org). It cannot be used on
-- the admin's own row (id != auth.uid()), so it can't be used to route
-- around H2's self-update protections either -- an admin changing their
-- own role must still go through that policy, which still forbids it.
-- The app's own update() call only sets `role`, so no other column is
-- actually at risk here regardless, but WITH CHECK pins organisation_id
-- explicitly as defence-in-depth against a forged payload, not just the
-- app's current well-behaved one.

CREATE POLICY "Admins can change another team member's role"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id != auth.uid()
    AND organisation_id = (
      SELECT u.organisation_id FROM public.users u WHERE u.id = auth.uid()
    )
    AND (
      SELECT u.role FROM public.users u WHERE u.id = auth.uid()
    ) = 'admin'
  )
  WITH CHECK (
    id != auth.uid()
    AND organisation_id = (
      SELECT u.organisation_id FROM public.users u WHERE u.id = auth.uid()
    )
  );
