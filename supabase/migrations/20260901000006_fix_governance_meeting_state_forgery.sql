-- Migration: prevent staff from forging governance meeting workflow state
--
-- SECURITY FIX (M2): The governance_meetings UPDATE policy allowed staff
-- (role = 'user') to update their own draft meetings, but the WITH CHECK
-- only verified organisation_id — it did not prevent staff from changing
-- status from 'draft' to 'signed_off'.
--
-- A staff member could therefore self-sign-off a governance meeting by
-- including status='signed_off' in their UPDATE payload, bypassing the
-- admin sign-off requirement.
--
-- Fix: the WITH CHECK now additionally enforces that staff updates must
-- keep status = 'draft'. Only admins can set status = 'signed_off'.
--
-- The USING clause already limits staff to rows they created and that are
-- currently 'draft'. The tightened WITH CHECK closes the escalation path.

DROP POLICY IF EXISTS "governance_meetings_update" ON public.governance_meetings;

CREATE POLICY "governance_meetings_update"
  ON public.governance_meetings
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND created_by = auth.uid() AND status = 'draft')
    )
  )
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND (
      -- Admins may set any valid status
      get_user_role() = 'admin'
      -- Staff may only save back to draft (cannot self-sign-off)
      OR (get_user_role() = 'user' AND status = 'draft')
    )
  );
