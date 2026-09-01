-- Migration: enforce viewer_expires_at in database RLS helpers
--
-- SECURITY FIX (H3): viewer_expires_at was previously enforced only
-- in Next.js middleware. Expired viewers could still read tenant data
-- and Storage objects directly via the Supabase Data API.
--
-- Fix: replace both SECURITY DEFINER helper functions so they return
-- NULL when the caller is a viewer whose expiry has passed.
--
-- Because every RLS policy on every table calls get_user_org_id() or
-- get_user_role(), returning NULL propagates the block automatically:
--   - organisation_id = NULL  → always false  → SELECT/INSERT/UPDATE blocked
--   - role = NULL             → always false  → role checks blocked
--
-- No individual policy changes are required.

-- ─────────────────────────────────────────────────────────────────────
-- 1. get_user_org_id() — returns NULL for expired viewers
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
      -- non-viewer accounts: always valid
      role != 'viewer'
      OR
      -- viewer accounts: only valid before expiry
      (viewer_expires_at IS NOT NULL AND viewer_expires_at > now())
    );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. get_user_role() — returns NULL for expired viewers
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
      role != 'viewer'
      OR
      (viewer_expires_at IS NOT NULL AND viewer_expires_at > now())
    );
$$;
