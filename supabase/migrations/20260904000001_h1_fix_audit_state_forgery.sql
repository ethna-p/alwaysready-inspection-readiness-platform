-- Migration: H1 — enforce safe initial states on audit workflow tables
--
-- SECURITY FIX (H1): INSERT policies on governance_meetings, incidents,
-- action_items, and i_statement_actions did not constrain workflow state,
-- actor, or closure fields. A staff member could INSERT a record already
-- in a signed-off, closed, or completed state by supplying those values
-- directly via the Supabase API.
--
-- Additionally, staff UPDATE paths on incidents, action_items, and
-- i_statement_actions had no WITH CHECK on workflow fields, allowing
-- staff to set status=closed/completed and populate closure actor columns.
--
-- Fix:
--   INSERT policies — require safe initial state and NULL actor/closure fields
--   Staff UPDATE policies — block status escalation and closure field writes
--
-- Note: governance_meetings UPDATE was already fixed in migration
--   20260901000006_fix_governance_meeting_state_forgery.sql

-- ── governance_meetings ───────────────────────────────────────────────────────
-- INSERT must begin as draft with no sign-off fields set.

DROP POLICY IF EXISTS "governance_meetings_insert" ON public.governance_meetings;

CREATE POLICY "governance_meetings_insert" ON public.governance_meetings
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
    AND status = 'draft'
    AND signed_off_by IS NULL
    AND signed_off_at IS NULL
  );

-- ── incidents ────────────────────────────────────────────────────────────────
-- INSERT must begin as open with no closure fields set.
-- Staff UPDATE must not escalate to closed or set closure fields.

DROP POLICY IF EXISTS "incidents_insert" ON public.incidents;

CREATE POLICY "incidents_insert" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
    AND status = 'open'
    AND closed_by IS NULL
    AND closed_at IS NULL
    AND learning_outcome IS NULL
  );

DROP POLICY IF EXISTS "incidents_update" ON public.incidents;

CREATE POLICY "incidents_update" ON public.incidents
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND reported_by = auth.uid() AND status != 'closed')
    )
  )
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND (
      -- Admins may set any valid status and closure fields
      get_user_role() = 'admin'
      -- Staff may only update non-closure fields; cannot escalate to closed
      OR (
        get_user_role() = 'user'
        AND status != 'closed'
        AND closed_by IS NULL
        AND closed_at IS NULL
        AND learning_outcome IS NULL
      )
    )
  );

-- ── action_items ─────────────────────────────────────────────────────────────
-- INSERT must begin as open with no completion fields set.
-- Staff UPDATE must not set status=completed or completion actor fields.

DROP POLICY IF EXISTS "Admin and user can create action items" ON public.action_items;

CREATE POLICY "Admin and user can create action items"
  ON public.action_items
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND created_by  = auth.uid()
    AND public.get_user_role() IN ('admin', 'user')
    AND status = 'open'
    AND completed_at IS NULL
    AND completed_by IS NULL
    AND completion_notes IS NULL
  );

DROP POLICY IF EXISTS "User can update their assigned action items" ON public.action_items;

CREATE POLICY "User can update their assigned action items"
  ON public.action_items
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND assigned_to = auth.uid()
    AND public.get_user_role() = 'user'
  )
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'user'
    -- Staff may update open/in_progress items but cannot mark completed
    AND status != 'completed'
    AND completed_at IS NULL
    AND completed_by IS NULL
  );

-- ── i_statement_actions ───────────────────────────────────────────────────────
-- Same pattern as action_items.

DROP POLICY IF EXISTS "Admin and user can create i_statement_actions" ON public.i_statement_actions;

CREATE POLICY "Admin and user can create i_statement_actions"
  ON public.i_statement_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND created_by  = auth.uid()
    AND public.get_user_role() IN ('admin', 'user')
    AND status = 'open'
    AND completed_at IS NULL
    AND completed_by IS NULL
    AND completion_notes IS NULL
  );

DROP POLICY IF EXISTS "User can update their assigned i_statement_actions" ON public.i_statement_actions;

CREATE POLICY "User can update their assigned i_statement_actions"
  ON public.i_statement_actions
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND assigned_to = auth.uid()
    AND public.get_user_role() = 'user'
  )
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'user'
    AND status != 'completed'
    AND completed_at IS NULL
    AND completed_by IS NULL
  );
