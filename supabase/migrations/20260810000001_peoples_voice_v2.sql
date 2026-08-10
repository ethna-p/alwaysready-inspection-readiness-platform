-- =============================================================
-- People's Voice v2
--
-- 1. Add date_reviewed and next_review_due to i_statement_evidence
--    so RAG status can be auto-calculated from review schedule,
--    consistent with the KLOE workflow.
--
-- 2. Create i_statement_actions table, mirroring action_items
--    but linked to i_statement_id instead of klo_item_id.
-- =============================================================

-- ── 1. Add review date columns to i_statement_evidence ───────────────────────

ALTER TABLE public.i_statement_evidence
  ADD COLUMN IF NOT EXISTS date_reviewed    date,
  ADD COLUMN IF NOT EXISTS next_review_due  date;

-- ── 2. i_statement_actions ───────────────────────────────────────────────────

CREATE TABLE public.i_statement_actions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  i_statement_id    uuid        NOT NULL REFERENCES public.i_statements(id)  ON DELETE CASCADE,

  -- Content
  title             text        NOT NULL,
  description       text,
  due_date          date,
  priority          text        NOT NULL DEFAULT 'medium'
                                CHECK (priority IN ('high', 'medium', 'low')),

  -- Workflow
  status            text        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'in_progress', 'completed')),
  assigned_to       uuid        REFERENCES public.users(id) ON DELETE SET NULL,

  -- Sign-off
  completion_notes  text,
  completed_at      timestamptz,
  completed_by      uuid        REFERENCES public.users(id) ON DELETE SET NULL,

  -- Provenance
  created_by        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX isa_organisation_id_idx ON public.i_statement_actions(organisation_id);
CREATE INDEX isa_org_statement_idx   ON public.i_statement_actions(organisation_id, i_statement_id);
CREATE INDEX isa_org_status_idx      ON public.i_statement_actions(organisation_id, status);
CREATE INDEX isa_assigned_to_idx     ON public.i_statement_actions(assigned_to);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_i_statement_actions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER i_statement_actions_updated_at
  BEFORE UPDATE ON public.i_statement_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_i_statement_actions_updated_at();

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.i_statement_actions ENABLE ROW LEVEL SECURITY;

-- SELECT: all roles can read their org's action items
CREATE POLICY "Users can view their organisation's i_statement_actions"
  ON public.i_statement_actions
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

-- INSERT: admin and user (not viewer)
CREATE POLICY "Admin and user can create i_statement_actions"
  ON public.i_statement_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND created_by  = auth.uid()
    AND public.get_user_role() IN ('admin', 'user')
  );

-- UPDATE: admin can update any; user can only update items assigned to them
CREATE POLICY "Admin can update any i_statement_action"
  ON public.i_statement_actions
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "User can update their assigned i_statement_actions"
  ON public.i_statement_actions
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND assigned_to = auth.uid()
    AND public.get_user_role() = 'user'
  );

-- DELETE: admin only
CREATE POLICY "Admin can delete i_statement_actions"
  ON public.i_statement_actions
  FOR DELETE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i_statement_actions TO authenticated;
