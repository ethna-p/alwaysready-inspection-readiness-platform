-- =============================================================
-- Action Items
--
-- Allows users to create, assign, and sign off action items
-- against individual KLOEs as part of the inspection and
-- governance cycle.
--
-- Each action item is scoped to an organisation and linked to
-- a klo_item. Completed items are retained permanently for the
-- audit trail.
-- =============================================================

CREATE TABLE public.action_items (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  klo_item_id       uuid        NOT NULL REFERENCES public.klo_items(id),

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
CREATE INDEX ai_organisation_id_idx  ON public.action_items(organisation_id);
CREATE INDEX ai_org_klo_idx          ON public.action_items(organisation_id, klo_item_id);
CREATE INDEX ai_org_status_idx       ON public.action_items(organisation_id, status);
CREATE INDEX ai_assigned_to_idx      ON public.action_items(assigned_to);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_action_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.set_action_items_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- SELECT: all roles can read their org's action items
CREATE POLICY "Users can view their organisation's action items"
  ON public.action_items
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

-- INSERT: admin and user (not viewer)
CREATE POLICY "Admin and user can create action items"
  ON public.action_items
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND created_by  = auth.uid()
    AND public.get_user_role() IN ('admin', 'user')
  );

-- UPDATE: admin can update any; user can only update items assigned to them
CREATE POLICY "Admin can update any action item"
  ON public.action_items
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "User can update their assigned action items"
  ON public.action_items
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND assigned_to = auth.uid()
    AND public.get_user_role() = 'user'
  );

-- DELETE: admin only
CREATE POLICY "Admin can delete action items"
  ON public.action_items
  FOR DELETE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items TO authenticated;
