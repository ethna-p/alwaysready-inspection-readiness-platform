-- Link action items to the mock inspection finding that prompted them (optional).
-- Existing action items are unaffected (column is nullable).

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS mock_inspection_finding_id uuid
    REFERENCES mock_inspection_findings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS action_items_finding_id_idx
  ON action_items(mock_inspection_finding_id)
  WHERE mock_inspection_finding_id IS NOT NULL;
