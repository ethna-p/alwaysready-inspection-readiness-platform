-- Migration: add integration_source to kloe_evidence and hr_training_records
--
-- integration_source marks where a record originated:
--   NULL  = manually entered by a platform user (default, all existing records)
--   'pcs'         = imported from Person Centred Software (mCare)
--   'nourish'     = imported from Nourish Care
--   'birdie'      = imported from Birdie
--   'log_my_care' = imported from Log My Care
--   'mods_import' = imported via a MODS-compliant bulk import
--   Any other DSCR slug as integrations are added
--
-- The column is intentionally uncontrained text (not an enum) so new DSCR
-- connectors can be added without a schema change.

ALTER TABLE kloe_evidence
  ADD COLUMN IF NOT EXISTS integration_source TEXT DEFAULT NULL;

COMMENT ON COLUMN kloe_evidence.integration_source IS
  'NULL = manually uploaded. Set to a DSCR slug (e.g. ''pcs'', ''nourish'') when the record was created by an external integration.';

ALTER TABLE hr_training_records
  ADD COLUMN IF NOT EXISTS integration_source TEXT DEFAULT NULL;

COMMENT ON COLUMN hr_training_records.integration_source IS
  'NULL = manually entered. Set to a DSCR slug (e.g. ''pcs'', ''nourish'') when the record was pushed by an external integration.';
