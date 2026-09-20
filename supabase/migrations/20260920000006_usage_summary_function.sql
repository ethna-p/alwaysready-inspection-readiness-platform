-- M18: get_usage_summary(), the data source for the live Supabase card on the
-- superadmin Infrastructure page (free-tier usage monitor).
--
-- Security assumptions, stated before writing it:
--   * Who can call it: service_role only (the app's admin client, used by the
--     superadmin-only Infrastructure page). EXECUTE is revoked from PUBLIC, anon
--     and authenticated explicitly, even though the default privileges set in
--     20260920000005 already withhold it, so this file is safe on its own.
--   * What it returns: project-wide totals (database size, file storage size and
--     count) and the names and sizes of the five largest public tables. No
--     customer rows and no per-organisation data, so there is no tenant
--     boundary to enforce.
--   * Inputs: none, so nothing to malform. Read-only and idempotent.
--
-- SECURITY DEFINER is needed because storage.objects is not readable by the
-- role the app connects as; the function runs as its owner (postgres). The
-- search_path is pinned so it cannot be redirected to look-alike objects.
--
-- database_bytes is pg_database_size(), which may differ slightly from the
-- figure on Supabase's own usage page, so the UI labels it approximate.

CREATE OR REPLACE FUNCTION public.get_usage_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes',  COALESCE((SELECT SUM((metadata->>'size')::bigint) FROM storage.objects), 0),
    'storage_files',  (SELECT COUNT(*) FROM storage.objects),
    'top_tables',     COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', t.relname, 'bytes', t.bytes) ORDER BY t.bytes DESC)
      FROM (
        SELECT c.relname, pg_total_relation_size(c.oid) AS bytes
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 5
      ) t
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_usage_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_summary() TO service_role;
