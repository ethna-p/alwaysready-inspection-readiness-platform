-- Migration: block direct writes to Storage buckets
--
-- SECURITY FIX (H6): Authenticated users could upload files directly to the
-- `evidence` and `org-logos` Storage buckets via the Supabase Storage API,
-- bypassing the server-side upload routes that perform:
--   - Malware/virus scanning   (/api/upload-evidence, /api/upload-i-statement-evidence)
--   - Magic-byte MIME validation (/api/org-logo)
--
-- Fix: drop the INSERT policies on both buckets.
-- All writes now MUST go through the API routes, which:
--   1. Validate the file (scan / MIME check)
--   2. Use createAdminClient() — which bypasses RLS — to perform the Storage upload
--
-- Reads and deletes are unaffected.

-- ── evidence bucket ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org members can upload evidence files" ON storage.objects;

-- ── org-logos bucket ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can upload org logo" ON storage.objects;
