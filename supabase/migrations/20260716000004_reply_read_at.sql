-- Migration: Add read_at to support_ticket_replies
--
-- Allows the app to track whether a user has seen a staff reply.
-- NULL = unread. Timestamped when the ticket thread is opened.

ALTER TABLE public.support_ticket_replies
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Users can mark staff replies on their org's tickets as read
CREATE POLICY "Users can mark staff replies as read"
  ON public.support_ticket_replies FOR UPDATE
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE organisation_id = get_user_org_id()
    )
    AND is_staff_reply = true
    AND read_at IS NULL
  )
  WITH CHECK (read_at IS NOT NULL);

-- Only the read_at column may be updated by users
GRANT UPDATE (read_at) ON public.support_ticket_replies TO authenticated;
