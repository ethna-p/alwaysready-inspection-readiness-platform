-- Migration: close the viewer-expiry gap reopened by users_select_own_row
--
-- SECURITY FIX: 20260901000003_enforce_viewer_expiry_in_rls.sql (H3) made
-- get_user_org_id()/get_user_role() return NULL for an expired viewer, so
-- every table whose RLS policies key off those helpers correctly blocks an
-- expired viewer's direct API access — confirmed still true today.
--
-- 20260911000001_users_select_own_row.sql later added a second, additive
-- SELECT policy on public.users — `USING (id = auth.uid())`, unconditional —
-- to fix a real, separate bug (an aal1 admin/user account couldn't read
-- their own row to learn they needed MFA setup, causing a redirect loop).
-- Postgres evaluates multiple permissive policies for the same command with
-- OR, so this new policy independently allows a SELECT the org-scoped policy
-- would otherwise block — including an expired viewer reading their OWN row.
--
-- Confirmed directly (not just in theory): signed in as a real viewer whose
-- viewer_expires_at was already in the past, `.from('users').select(...).eq('id',
-- <their own id>).single()` via their own JWT (anon key, real RLS context —
-- not the service-role client) successfully returned organisation_id, role,
-- and onboarding_complete. No other table is affected — every other table's
-- RLS still keys off get_user_org_id()/get_user_role(), which correctly
-- return NULL for this same account, so no tenant DATA is exposed. But the
-- app's own H3 migration comment claims "RLS already blocks them at the DB
-- layer" for viewer expiry specifically, and for this one table that's no
-- longer true — an expired viewer can still learn their own org_id, role,
-- and expiry timestamp indefinitely via a direct API call that bypasses the
-- app's own JS-level expiry recheck in lib/session.ts entirely.
--
-- Found via the Playwright walkthrough's visitor-login test (item 12): the
-- app itself still correctly blocks an expired viewer in practice (every
-- real dashboard page calls getCurrentUserProfile(), which re-derives
-- expiry from viewer_expires_at in JS after RLS lets the row through) — but
-- that's a single, easily-bypassed line of defense, not the two independent
-- layers this app is designed to have everywhere else.
--
-- Fix: replace the additive policy with the same viewer-expiry condition
-- already used by get_user_org_id()/get_user_role(), OR'd with the original
-- bug's actual requirement (an aal1 admin/user reading their own row). This
-- keeps the MFA-redirect-loop fix intact — role != 'viewer' is unconditional,
-- exactly as before — while a viewer's self-read now requires the same
-- not-yet-expired check every other table already enforces.

DROP POLICY IF EXISTS "users_select_own_row" ON public.users;

CREATE POLICY "users_select_own_row" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    AND (
      role != 'viewer'
      OR
      (viewer_expires_at IS NOT NULL AND viewer_expires_at > now())
    )
  );
