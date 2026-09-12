-- Restore service_role's table-level grants.
--
-- Every Supabase project normally gets this automatically at creation, as
-- part of Supabase's own project bootstrap (independent of any migration
-- file here) — so it was never something this repo's migrations needed to
-- set up themselves, on the assumption a project always already has it.
--
-- That assumption broke for the alwaysready-preview project (see
-- docs/handoff-preview-production-split.md): it was migrated by running
-- these files directly over a raw Postgres connection rather than through
-- Supabase's own tooling, and came out with `authenticated` correctly
-- granted (SELECT etc., likely inherited from default privileges the
-- `postgres` role already had), but service_role only had REFERENCES/
-- TRIGGER/TRUNCATE on tables — no SELECT/INSERT/UPDATE/DELETE. Any use of
-- the service_role key via the Supabase client library (as opposed to a
-- direct Postgres connection, which stayed unaffected since it runs as
-- `postgres`) failed with "permission denied for table ...".
--
-- Harmless to (re-)run anywhere, including on a project that already has
-- these grants (this repo's production project included) — it only adds
-- privileges service_role already either has or is supposed to have, and
-- ALTER DEFAULT PRIVILEGES only affects objects created after this runs, so
-- it can't retroactively change anything by itself.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
