-- Migration 4: RLS helper function + all org-scoped policies
-- This runs after both organisations and users tables exist.

-- ─────────────────────────────────────────────
-- Helper: get the current user's organisation_id
-- SECURITY DEFINER so it can read public.users even when the
-- caller's RLS policies haven't been evaluated yet (avoids
-- infinite recursion). STABLE because it won't change within
-- a single query.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM   public.users
  WHERE  id = auth.uid()
  LIMIT  1
$$;

-- ─────────────────────────────────────────────
-- organisations policies
-- ─────────────────────────────────────────────
CREATE POLICY "Users can view their own organisation"
  ON public.organisations
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

-- ─────────────────────────────────────────────
-- users policies
-- ─────────────────────────────────────────────

-- Users can read all members of their own organisation
-- (useful for showing "who last updated" in audit trails)
CREATE POLICY "Users can view members of their organisation"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (organisation_id = public.get_user_org_id());

-- Users can update their own row only (e.g. email change in future)
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────
-- Grant EXECUTE on the helper function to authenticated role
-- ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
