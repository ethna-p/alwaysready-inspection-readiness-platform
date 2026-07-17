-- =============================================================
-- Add scan_status to kloe_evidence
-- =============================================================
-- Records the result of the Cloudmersive virus scan for each
-- uploaded file. Values: 'clean' | 'skipped' (scan not configured).
-- Existing rows default to 'clean'.
-- =============================================================

ALTER TABLE public.kloe_evidence
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'clean';
