-- Migration: H3 — replace direct public.users lookups with expiry-aware helpers
--
-- SECURITY FIX (H3): Several Storage and table RLS policies bypass the
-- get_user_org_id() / get_user_role() helper functions and query
-- public.users directly. This means viewer expiry (migration 20260901000003)
-- and the new AAL2 check (migration 20260904000002) have no effect on these
-- policies — an expired viewer or an AAL1 admin/user can still reach them.
--
-- Fix: replace every direct (SELECT organisation_id / role FROM public.users
-- WHERE id = auth.uid()) with the helper function calls. Because the helpers
-- are SECURITY DEFINER and return NULL for expired viewers and AAL1
-- admin/user sessions, this propagates both controls automatically.
--
-- Tables / buckets affected:
--   storage.objects (evidence bucket) — SELECT, INSERT, DELETE
--   public.kloe_evidence              — SELECT, INSERT, DELETE
--   public.i_statement_evidence_files — SELECT, INSERT, DELETE
--   public.saved_report_views         — SELECT, INSERT, DELETE

-- ── storage.objects (evidence bucket) ────────────────────────────────────────

DROP POLICY IF EXISTS "org members can read evidence files"   ON storage.objects;
DROP POLICY IF EXISTS "org members can upload evidence files" ON storage.objects;
DROP POLICY IF EXISTS "admins can delete evidence files"      ON storage.objects;

CREATE POLICY "org members can read evidence files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
);

CREATE POLICY "org members can upload evidence files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
  AND get_user_role() IN ('admin', 'user')
);

CREATE POLICY "admins can delete evidence files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
  AND get_user_role() = 'admin'
);

-- ── public.kloe_evidence ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "org members can read kloe_evidence"   ON public.kloe_evidence;
DROP POLICY IF EXISTS "org members can insert kloe_evidence" ON public.kloe_evidence;
DROP POLICY IF EXISTS "admins can delete kloe_evidence"      ON public.kloe_evidence;

CREATE POLICY "org members can read kloe_evidence"
ON public.kloe_evidence FOR SELECT
TO authenticated
USING (organisation_id = get_user_org_id());

CREATE POLICY "org members can insert kloe_evidence"
ON public.kloe_evidence FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id = get_user_org_id()
  AND get_user_role() IN ('admin', 'user')
);

CREATE POLICY "admins can delete kloe_evidence"
ON public.kloe_evidence FOR DELETE
TO authenticated
USING (
  organisation_id = get_user_org_id()
  AND get_user_role() = 'admin'
);

-- ── public.i_statement_evidence_files ────────────────────────────────────────

DROP POLICY IF EXISTS "org members can read i_statement_evidence_files"  ON public.i_statement_evidence_files;
DROP POLICY IF EXISTS "non-viewers can insert i_statement_evidence_files" ON public.i_statement_evidence_files;
DROP POLICY IF EXISTS "admins can delete i_statement_evidence_files"      ON public.i_statement_evidence_files;

CREATE POLICY "org members can read i_statement_evidence_files"
ON public.i_statement_evidence_files FOR SELECT
TO authenticated
USING (organisation_id = get_user_org_id());

CREATE POLICY "non-viewers can insert i_statement_evidence_files"
ON public.i_statement_evidence_files FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id = get_user_org_id()
  AND get_user_role() IN ('admin', 'user')
);

CREATE POLICY "admins can delete i_statement_evidence_files"
ON public.i_statement_evidence_files FOR DELETE
TO authenticated
USING (
  organisation_id = get_user_org_id()
  AND get_user_role() = 'admin'
);

-- ── public.saved_report_views ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Read own org views and system views" ON public.saved_report_views;
DROP POLICY IF EXISTS "Admins can create views"             ON public.saved_report_views;
DROP POLICY IF EXISTS "Admins can delete custom views"      ON public.saved_report_views;

CREATE POLICY "Read own org views and system views"
ON public.saved_report_views FOR SELECT
TO authenticated
USING (
  is_system = true
  OR org_id = get_user_org_id()
);

CREATE POLICY "Admins can create views"
ON public.saved_report_views FOR INSERT
TO authenticated
WITH CHECK (
  is_system = false
  AND org_id = get_user_org_id()
  AND get_user_role() = 'admin'
);

CREATE POLICY "Admins can delete custom views"
ON public.saved_report_views FOR DELETE
TO authenticated
USING (
  is_system = false
  AND org_id = get_user_org_id()
  AND get_user_role() = 'admin'
);
