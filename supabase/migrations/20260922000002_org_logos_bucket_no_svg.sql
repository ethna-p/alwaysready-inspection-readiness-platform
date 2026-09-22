-- Drift fix, found by a preview-vs-production comparison: the org-logos storage bucket's
-- allowed_mime_types still included image/svg+xml on preview. Production had already had SVG
-- removed at some point (matching the deliberate exclusion in app/api/org-logo/route.ts --
-- "SVG files can contain embedded scripts (XSS risk when served with Content-Type:
-- image/svg+xml)"), but with no migration file, so preview never received the same change.
--
-- The app's own upload validation already rejects SVG regardless of what the bucket permits, so
-- this closes a redundant, unused permission rather than changing any real behaviour. Safe to
-- run on both projects immediately: nothing in the app reads or depends on this bucket setting
-- at runtime.

UPDATE storage.buckets
SET allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
WHERE id = 'org-logos';
