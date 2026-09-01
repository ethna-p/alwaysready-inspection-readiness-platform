-- Migration: protect authorisation columns from self-modification
--
-- SECURITY FIX (H2): The previous UPDATE policy on public.users only
-- checked id = auth.uid(), meaning any authenticated user could rewrite
-- their own role, organisation_id, or viewer_expires_at directly via
-- the Supabase Data API — bypassing all application-level controls and
-- unlocking admin/cross-tenant access.
--
-- This migration replaces the policy with one whose WITH CHECK asserts
-- that those three columns must remain equal to their current database
-- values. The subqueries read the pre-update committed row, so any
-- attempt to change role, organisation_id, or viewer_expires_at is
-- rejected by Postgres before the UPDATE commits.
--
-- Legitimate profile updates (e.g. email) are unaffected.

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- role must not change
    AND role = (
      SELECT u.role FROM public.users u WHERE u.id = auth.uid()
    )
    -- organisation must not change
    AND organisation_id = (
      SELECT u.organisation_id FROM public.users u WHERE u.id = auth.uid()
    )
    -- viewer expiry must not change (IS NOT DISTINCT FROM handles NULL)
    AND viewer_expires_at IS NOT DISTINCT FROM (
      SELECT u.viewer_expires_at FROM public.users u WHERE u.id = auth.uid()
    )
  );
