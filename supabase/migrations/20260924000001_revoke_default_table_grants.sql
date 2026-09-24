-- New tables and sequences in public no longer start out accessible to anon, authenticated
-- and service_role. From here on every migration that creates a table must say who may use it.
--
-- Why now: Supabase is ending the automatic exposure of new public tables to the Data API. It
-- applies to new projects already and to every existing project on 2026-10-30
-- (https://github.com/orgs/supabase/discussions/45329). Doing it here, on our own timetable,
-- makes local, CI, preview and production behave identically, so a migration that forgets its
-- GRANT fails in CI instead of failing in production.
--
-- This undoes the ALTER DEFAULT PRIVILEGES lines in 20260912000001 and 20260912170001, which
-- only ever affected tables created after they ran. It changes nothing for tables that already
-- exist: they keep every privilege they have today. Functions are already handled by
-- 20260920000005.
--
-- WHAT THIS MEANS FOR EVERY FUTURE MIGRATION that creates a table: add explicit grants, for
-- example
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO authenticated, service_role;
-- (only the roles and privileges that are really needed), plus
--   GRANT USAGE ON SEQUENCE public.some_seq TO authenticated;
-- for any table with a serial or identity column that a logged-in user inserts into. Server-only
-- tables need service_role alone. Forgetting fails loudly with "permission denied for table",
-- which is the safe direction to fail, and table-privileges.test.ts catches it in CI.
--
-- Only affects objects created by the postgres role, which is the role every migration and the
-- SQL Editor runs as. Tables created through the Supabase dashboard are made by another role and
-- are not covered here.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
