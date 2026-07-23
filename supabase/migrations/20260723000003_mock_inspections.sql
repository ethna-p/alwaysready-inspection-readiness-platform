-- Migration: Mock Inspection tables
--
-- Allows admin users to run self-assessment mock inspections scoped to either
-- all KLOEs (full) or a single key question (partial).
--
-- Three tables:
--   mock_inspections                  — session record
--   mock_inspection_findings          — per-KLOE rating + notes
--   mock_inspection_checklist_responses — per-I-statement response
--
-- Disclaimer: mock inspections are guidance only and do not represent
-- the view of CQC or any regulatory body.

-- ─────────────────────────────────────────────────────────
-- Table: mock_inspections
-- ─────────────────────────────────────────────────────────

CREATE TABLE public.mock_inspections (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  type              text        NOT NULL CHECK (type IN ('full', 'partial')),
  key_question_id   uuid        REFERENCES public.key_questions(id),  -- NULL for full inspections
  status            text        NOT NULL DEFAULT 'in_progress'
                                CHECK (status IN ('in_progress', 'completed')),
  conducted_by      uuid        REFERENCES auth.users(id),
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- Partial inspections must specify a key question
  CONSTRAINT partial_requires_key_question
    CHECK (type = 'full' OR key_question_id IS NOT NULL)
);

ALTER TABLE public.mock_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own mock inspections"
  ON public.mock_inspections FOR SELECT
  TO authenticated
  USING (organisation_id = get_user_org_id());

CREATE POLICY "Admins can insert mock inspections"
  ON public.mock_inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );

CREATE POLICY "Admins can update own mock inspections"
  ON public.mock_inspections FOR UPDATE
  TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );

GRANT SELECT, INSERT, UPDATE ON public.mock_inspections TO authenticated;

-- ─────────────────────────────────────────────────────────
-- Table: mock_inspection_findings  (one row per KLOE)
-- ─────────────────────────────────────────────────────────

CREATE TABLE public.mock_inspection_findings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_inspection_id    uuid        NOT NULL REFERENCES public.mock_inspections(id) ON DELETE CASCADE,
  klo_item_id           uuid        NOT NULL REFERENCES public.klo_items(id),
  rating                text        NOT NULL CHECK (rating IN ('outstanding', 'good', 'requires_improvement', 'inadequate')),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (mock_inspection_id, klo_item_id)
);

ALTER TABLE public.mock_inspection_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own findings"
  ON public.mock_inspection_findings FOR SELECT
  TO authenticated
  USING (
    mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can insert findings"
  ON public.mock_inspection_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can update findings"
  ON public.mock_inspection_findings FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.mock_inspection_findings TO authenticated;

-- ─────────────────────────────────────────────────────────
-- Table: mock_inspection_checklist_responses  (one row per I statement)
-- ─────────────────────────────────────────────────────────

CREATE TABLE public.mock_inspection_checklist_responses (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_inspection_id    uuid        NOT NULL REFERENCES public.mock_inspections(id) ON DELETE CASCADE,
  checklist_item_id     uuid        NOT NULL REFERENCES public.klo_checklist_items(id),
  response              text        NOT NULL CHECK (response IN ('met', 'partial', 'not_met')),
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (mock_inspection_id, checklist_item_id)
);

ALTER TABLE public.mock_inspection_checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own checklist responses"
  ON public.mock_inspection_checklist_responses FOR SELECT
  TO authenticated
  USING (
    mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can insert checklist responses"
  ON public.mock_inspection_checklist_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can update checklist responses"
  ON public.mock_inspection_checklist_responses FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND mock_inspection_id IN (
      SELECT id FROM public.mock_inspections
      WHERE organisation_id = get_user_org_id()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.mock_inspection_checklist_responses TO authenticated;
