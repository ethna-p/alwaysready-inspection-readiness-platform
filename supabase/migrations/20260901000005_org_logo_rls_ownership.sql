-- Migration: add org-boundary ownership check to org-logos Storage policies
--
-- SECURITY FIX (M1): The DELETE policy on org-logos checked only that the
-- caller is an admin — it did not verify that the file being deleted belongs
-- to the caller's own organisation. An admin from any tenant could delete
-- another org's logo by calling the Storage API directly.
--
-- The INSERT policy was already dropped in migration 20260901000004
-- (H6 — block direct writes). We replace only the DELETE policy here.
--
-- Fix: scope DELETE to files under the caller's own org prefix
-- ({organisation_id}/*). The first component of the object name is the org UUID.

DROP POLICY IF EXISTS "Admins can delete org logo" ON storage.objects;

CREATE POLICY "Admins can delete own org logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] = (
      SELECT organisation_id::text
      FROM   public.users
      WHERE  id   = auth.uid()
        AND  role = 'admin'
    )
  );
