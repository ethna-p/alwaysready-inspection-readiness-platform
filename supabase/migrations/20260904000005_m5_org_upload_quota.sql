-- Migration: M5 — per-org upload quota enforcement
--
-- SECURITY FIX (M5): The upload routes check individual file size (10 MB max)
-- but apply no per-org cap. An org could upload an unbounded number of files,
-- consuming arbitrary storage and bandwidth.
--
-- Fix: a SECURITY DEFINER function get_org_upload_usage() returns the current
-- file count and total bytes for an org across both evidence tables. The upload
-- routes call this before accepting each file and reject when either cap is hit.
--
-- Limits:
--   MAX_FILES : 500 files per org
--   MAX_BYTES : 500 MB per org (524,288,000 bytes)
--
-- Both limits are enforced inside the function so they are defined in one place.

CREATE OR REPLACE FUNCTION public.get_org_upload_usage(p_org_id uuid)
RETURNS TABLE (
  file_count  bigint,
  total_bytes bigint,
  at_file_limit boolean,
  at_byte_limit boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH combined AS (
    SELECT file_size FROM public.kloe_evidence
    WHERE organisation_id = p_org_id
    UNION ALL
    SELECT file_size FROM public.i_statement_evidence_files
    WHERE organisation_id = p_org_id
  )
  SELECT
    COUNT(*)::bigint                              AS file_count,
    COALESCE(SUM(file_size), 0)::bigint          AS total_bytes,
    COUNT(*) >= 500                              AS at_file_limit,
    COALESCE(SUM(file_size), 0) >= 524288000    AS at_byte_limit
  FROM combined;
$$;

-- Grant execute to authenticated so the upload routes can call it via RPC
-- (routes use the service-role admin client for the actual call, but granting
-- here keeps the security model explicit and allows the user client to call it
-- too if needed for UI feedback).
GRANT EXECUTE ON FUNCTION public.get_org_upload_usage(uuid) TO authenticated;
