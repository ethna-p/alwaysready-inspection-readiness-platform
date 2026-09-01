-- M12: Remove the legacy create_demo_session RPC.
--
-- This SECURITY DEFINER function was granted EXECUTE to the `authenticated`
-- role, meaning any logged-in user could call it directly via the Supabase
-- client. It creates an organisation and inserts a users row — bypassing RLS —
-- with a caller-supplied p_user_id, so a malicious user could provision new
-- orgs or impersonate other user IDs.
--
-- The demo org flow was removed from the application in task #308. The
-- function is dead code and presents an unacceptable privilege-escalation
-- surface. Drop it entirely.
--
-- cleanup_expired_demo_orgs() has no GRANT to authenticated (service role
-- only) so it is lower risk, but it is also dead code — drop it too.

REVOKE EXECUTE ON FUNCTION public.create_demo_session(UUID) FROM authenticated;
DROP FUNCTION IF EXISTS public.create_demo_session(UUID);
DROP FUNCTION IF EXISTS public.cleanup_expired_demo_orgs();
