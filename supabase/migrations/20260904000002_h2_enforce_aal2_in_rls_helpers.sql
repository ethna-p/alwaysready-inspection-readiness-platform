-- Migration: H2 — enforce AAL2 (MFA) in RLS helper functions
--
-- SECURITY FIX (H2): Database and Storage RLS policies authorise sessions
-- based on uid, role, and organisation, but do not check the JWT aal claim.
-- An attacker with a valid password-derived AAL1 session can call PostgREST
-- or Storage directly and bypass the mandatory second factor.
--
-- Fix: update both SECURITY DEFINER helpers to return NULL when the caller
-- is an admin or user role whose JWT aal is not 'aal2'. Because every RLS
-- policy calls get_user_org_id() or get_user_role(), returning NULL propagates
-- the block automatically — no individual policy changes are needed.
--
-- Viewer accounts retain AAL1 access (MFA is not enforced for viewers) but
-- still require a non-expired session as per the previous fix.
--
-- This supersedes the version written in 20260901000003_enforce_viewer_expiry_in_rls.sql.

-- ─────────────────────────────────────────────────────────────────────
-- 1. get_user_org_id() — returns NULL for AAL1 admin/user sessions
-- ─────────────────────────────────────────────────────────────────────
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
    AND  (
      -- admin and user roles: require completed MFA (AAL2)
      (role IN ('admin', 'user') AND (auth.jwt() ->> 'aal') = 'aal2')
      OR
      -- viewer accounts: AAL1 is acceptable; enforce expiry only
      (role = 'viewer' AND viewer_expires_at IS NOT NULL AND viewer_expires_at > now())
    );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. get_user_role() — returns NULL for AAL1 admin/user sessions
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM   public.users
  WHERE  id = auth.uid()
    AND  (
      (role IN ('admin', 'user') AND (auth.jwt() ->> 'aal') = 'aal2')
      OR
      (role = 'viewer' AND viewer_expires_at IS NOT NULL AND viewer_expires_at > now())
    );
$$;
