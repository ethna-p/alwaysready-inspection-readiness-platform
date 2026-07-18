-- Migration: Staff-initiated support tickets
--
-- Allows superadmin to open a support ticket on behalf of a customer.
-- Two changes to support_tickets:
--   1. submitted_by becomes nullable (NULL = opened by AlwaysReady staff)
--   2. staff_initiated flag so both views can render appropriately

ALTER TABLE public.support_tickets
  ALTER COLUMN submitted_by DROP NOT NULL;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS staff_initiated boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.support_tickets.submitted_by IS
  'The user who submitted the ticket. NULL when opened by AlwaysReady staff on behalf of the organisation.';

COMMENT ON COLUMN public.support_tickets.staff_initiated IS
  'True when the ticket was opened by AlwaysReady staff rather than the customer.';
