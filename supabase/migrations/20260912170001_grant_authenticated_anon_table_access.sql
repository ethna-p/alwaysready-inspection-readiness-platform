-- Restore anon/authenticated's table-level grants.
--
-- Same root cause and same fix shape as
-- 20260912000001_grant_service_role_table_access.sql, for the other two
-- roles: every Supabase project normally gets full table grants for
-- anon/authenticated/service_role automatically at creation, as part of
-- Supabase's own bootstrap (independent of any migration file here) —
-- Supabase's actual security model relies entirely on RLS as the real
-- per-row gate, not on narrow table-level grants, so a fresh project always
-- grants ALL privileges broadly to anon and authenticated alike.
--
-- alwaysready-preview didn't get that (see
-- docs/handoff-preview-production-split.md: provisioned by running these
-- migration files directly over a raw Postgres connection, not through
-- Supabase's own tooling). The service_role migration's own comment
-- assumed authenticated had come out "correctly granted (SELECT etc.)" —
-- true as far as it checked, but incomplete: authenticated had SELECT,
-- REFERENCES, TRIGGER, TRUNCATE on every table, but never INSERT, UPDATE,
-- or DELETE. Nothing surfaced this for months because almost every write
-- in this app goes through either the service-role admin client or an
-- INSERT into an *_history table with a SECURITY DEFINER trigger doing the
-- real write (compliance_record_history -> compliance_records, for
-- instance) — both bypass this gap entirely. The one place that didn't:
-- assignKloe (app/dashboard/kloes/actions.ts) does a direct
-- .from('compliance_records').update(...) as the calling user, and hit
-- "permission denied for table compliance_records" (42501) — caught by
-- the Playwright walkthrough's KLOE-assignment test, item 11.
--
-- Checked directly: 19 of this project's 47 public tables had zero
-- INSERT/UPDATE/DELETE grant for authenticated. Most of those are only
-- ever written via the admin client anyway (marketing/lead tables,
-- superadmin-only tables) so were never actually broken by this — but
-- there's no way to be confident every current and future direct-write
-- code path is covered by only patching the one table that happened to
-- get caught. Restoring the full standard grant is what a correctly
-- bootstrapped project already has: RLS remains the actual enforcement
-- layer regardless, exactly as it does for every table already.
--
-- Harmless to (re-)run anywhere, including on a project that already has
-- these grants (this repo's production project included) — it only adds
-- privileges these roles already have or are supposed to have, and ALTER
-- DEFAULT PRIVILEGES only affects objects created after this runs, so it
-- can't retroactively change anything by itself.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
