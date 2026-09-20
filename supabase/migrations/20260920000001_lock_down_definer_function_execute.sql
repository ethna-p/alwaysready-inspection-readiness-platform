-- M14: Close unauthenticated and cross-tenant access to SECURITY DEFINER functions.
--
-- Found by the 2026-09-20 production readiness review. Postgres grants EXECUTE on
-- a new function to PUBLIC by default, and Supabase also grants it to anon and
-- authenticated, so every SECURITY DEFINER function in the public schema was
-- callable through the REST API (/rest/v1/rpc/...) by an unauthenticated caller
-- unless a migration explicitly revoked it. None of the earlier audit chunks
-- looked at function privileges, only at table RLS.
--
-- 1. Legacy demo functions. The demo feature was abandoned; 20260901000008 was
--    written to drop create_demo_session(uuid) and cleanup_expired_demo_orgs()
--    but was never run on production, and create_demo_session(text) was never
--    dropped anywhere. All three are dead code with a privilege-escalation
--    surface (they create organisations and users rows, or delete organisations,
--    bypassing RLS). Drop them. IF EXISTS keeps this safe on both projects.
--
-- 2. get_org_upload_usage(uuid) has no caller check, so any anonymous caller who
--    knows an organisation UUID could read that organisation's file count and
--    storage bytes. Its only callers are the two upload routes, both via the
--    service-role admin client.
--
-- 3. seed_default_training_types(uuid) skips its membership check when
--    auth.uid() IS NULL (added so the service-role caller works, see
--    20260912205715). An anonymous caller also has a NULL auth.uid(), so it
--    passed the check too. Its only caller is app/dashboard/hr/page.tsx via
--    the admin client.
--
-- For 2 and 3, EXECUTE is limited to service_role. The end-user (authenticated)
-- path was never a legitimate call site, and removing it also retires the
-- cross-tenant scenario the L3 check was written for.
--
-- Trigger and event-trigger functions are deliberately untouched: Postgres does
-- not allow them to be called directly, and EXECUTE is only checked when the
-- trigger is created. get_user_org_id() and get_user_role() are used inside RLS
-- policies and only ever return the caller's own values, so they are left alone.

DROP FUNCTION IF EXISTS public.create_demo_session(uuid);
DROP FUNCTION IF EXISTS public.create_demo_session(text);
DROP FUNCTION IF EXISTS public.cleanup_expired_demo_orgs();

REVOKE EXECUTE ON FUNCTION public.get_org_upload_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_org_upload_usage(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.seed_default_training_types(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.seed_default_training_types(uuid) TO service_role;
