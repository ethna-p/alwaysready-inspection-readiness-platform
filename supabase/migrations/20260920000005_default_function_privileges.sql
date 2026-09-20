-- M17: New functions no longer start out callable by anon and authenticated.
--
-- Root cause of the 2026-09-20 finding (see 20260920000001): Postgres grants
-- EXECUTE on every new function to PUBLIC by default, and Supabase's default
-- privileges for the public schema additionally grant it to anon, authenticated
-- and service_role. A SECURITY DEFINER function written without an explicit
-- REVOKE was therefore callable by an unauthenticated caller through
-- /rest/v1/rpc, and this went unnoticed for months.
--
-- This changes the defaults for functions created by the postgres role, which
-- is the role every migration and the SQL Editor runs as:
--   1. PUBLIC no longer receives EXECUTE. Postgres only allows this to be
--      changed globally for the role, not per schema.
--   2. In the public schema, anon and authenticated no longer receive EXECUTE.
--      postgres and service_role keep it.
--
-- WHAT THIS MEANS FOR EVERY FUTURE MIGRATION: a new function that logged-in
-- users must call (an RPC called with the user client, or a helper used inside
-- an RLS policy such as get_user_org_id) now needs an explicit
--   GRANT EXECUTE ON FUNCTION public.name(args) TO authenticated;
-- exactly as new tables already need explicit GRANTs. Forgetting it fails loudly
-- ("permission denied for function"), which is the safe direction to fail.
-- Trigger functions need no grant: EXECUTE is only checked when the trigger is
-- created. Functions called only through the service-role client need nothing.
--
-- Not affected: every function that already exists (their privileges are
-- unchanged), and functions created by other roles such as supabase_admin
-- (Supabase-managed schemas and extensions).

ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
