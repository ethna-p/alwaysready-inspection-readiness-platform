-- Migration: prevent staff from forging feedback_records status
--
-- SECURITY FIX: feedback_records' UPDATE policy allowed staff (role =
-- 'user') to update their own open feedback record, but the WITH CHECK
-- only verified organisation_id -- it did not prevent staff from changing
-- status away from 'open'.
--
-- FeedbackClient.tsx's own FeedbackForm only renders the status field for
-- admins (`{isAdmin && defaults?.status && (...)}`, with the comment
-- "Status — only admins can change status") -- confirming the intended
-- design already matches governance_meetings' admin-only sign-off model.
-- But unlike governance_meetings (fixed in
-- 20260901000006_fix_governance_meeting_state_forgery.sql, "M2"),
-- feedback_records never got the equivalent RLS fix: a staff member could
-- bypass the UI (a forged form submission, or a direct authenticated
-- request) and set status to 'actioned' or 'closed' on their own record,
-- silently removing it from open-item tracking without any admin
-- involvement -- defeating the oversight this table exists to provide for
-- complaints and concerns.
--
-- Fix: the WITH CHECK now additionally enforces that staff updates must
-- keep status = 'open'. Only admins can move a record to 'actioned' or
-- 'closed'. Same shape as the governance_meetings M2 fix.

DROP POLICY IF EXISTS "feedback_records_update" ON public.feedback_records;

CREATE POLICY "feedback_records_update"
  ON public.feedback_records
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND created_by = auth.uid() AND status = 'open')
    )
  )
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND (
      -- Admins may set any valid status
      get_user_role() = 'admin'
      -- Staff may only save back to open (cannot self-action/self-close)
      OR (get_user_role() = 'user' AND status = 'open')
    )
  );
