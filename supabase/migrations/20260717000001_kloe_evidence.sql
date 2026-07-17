-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: kloe_evidence table + Supabase Storage bucket + RLS
-- Evidence files uploaded against individual KLOEs.
-- Files are stored at: evidence/{organisation_id}/{klo_item_id}/{filename}
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Create the evidence storage bucket ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  10485760, -- 10 MB per file
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage RLS policies ───────────────────────────────────────────────────
-- Files live at evidence/{org_id}/{klo_id}/{filename}
-- The first folder segment is the org_id — use this to scope access.

-- Read: any authenticated user in the same org
CREATE POLICY "org members can read evidence files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = (
    SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Upload: admin and user roles (not viewer)
CREATE POLICY "org members can upload evidence files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = (
    SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
  ) AND
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'user')
);

-- Delete: admins only
CREATE POLICY "admins can delete evidence files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = (
    SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
  ) AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ── 3. kloe_evidence metadata table ──────────────────────────────────────────
CREATE TABLE public.kloe_evidence (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  klo_item_id      UUID NOT NULL REFERENCES public.klo_items(id) ON DELETE CASCADE,
  uploaded_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,  -- full path within the bucket
  file_size        BIGINT,         -- bytes
  mime_type        TEXT,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the most common query (all files for a KLOE)
CREATE INDEX ON public.kloe_evidence (organisation_id, klo_item_id);

-- ── 4. RLS on kloe_evidence ───────────────────────────────────────────────────
ALTER TABLE public.kloe_evidence ENABLE ROW LEVEL SECURITY;

-- Read: all org members can see evidence metadata
CREATE POLICY "org members can read kloe_evidence"
ON public.kloe_evidence FOR SELECT
TO authenticated
USING (organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid()));

-- Insert: admin and user roles
CREATE POLICY "org members can insert kloe_evidence"
ON public.kloe_evidence FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid()) AND
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'user')
);

-- Delete: admins only
CREATE POLICY "admins can delete kloe_evidence"
ON public.kloe_evidence FOR DELETE
TO authenticated
USING (
  organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid()) AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ── 5. Grant API access ───────────────────────────────────────────────────────
GRANT SELECT, INSERT, DELETE ON public.kloe_evidence TO authenticated;
