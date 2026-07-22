-- Migration: newsletter_generations table
-- Tracks AI newsletter draft usage per organisation (limit: 10/month)

CREATE TABLE newsletter_generations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  generated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX newsletter_generations_org_month_idx
  ON newsletter_generations (organisation_id, generated_at);

ALTER TABLE newsletter_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org newsletter generations"
  ON newsletter_generations FOR SELECT
  TO authenticated
  USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org newsletter generations"
  ON newsletter_generations FOR INSERT
  TO authenticated
  WITH CHECK (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

GRANT SELECT, INSERT ON newsletter_generations TO authenticated;
