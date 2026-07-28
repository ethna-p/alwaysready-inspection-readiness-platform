-- Add AI-generated draft reply column to support_tickets.
-- Populated automatically when an inbound email creates or updates a ticket.
-- NULL until the first draft is generated; staff can regenerate on demand.

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS draft_reply TEXT;
