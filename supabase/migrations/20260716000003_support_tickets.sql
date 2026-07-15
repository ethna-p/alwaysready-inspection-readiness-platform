-- Migration: Support ticket system
--
-- support_tickets       — one row per ticket, org-scoped
-- support_ticket_replies — threaded replies (user + staff)
--
-- RLS: users see only their org's tickets.
-- Superadmin operations use the service-role client (bypasses RLS).

-- ─────────────────────────────────────────────
-- Reference number sequence  (AR-001, AR-002 …)
-- ─────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.support_ticket_ref_seq START 1;

-- ─────────────────────────────────────────────
-- support_tickets
-- ─────────────────────────────────────────────

CREATE TABLE public.support_tickets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES public.organisations(id),
  submitted_by    uuid        NOT NULL REFERENCES auth.users(id),
  reference       text        NOT NULL UNIQUE
                              DEFAULT 'AR-' || LPAD(nextval('public.support_ticket_ref_seq')::text, 4, '0'),
  subject         text        NOT NULL,
  message         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own org tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (organisation_id = get_user_org_id());

CREATE POLICY "Users can submit tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT USAGE ON SEQUENCE public.support_ticket_ref_seq TO authenticated;

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION public.set_support_ticket_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_ticket_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_support_ticket_updated_at();

-- ─────────────────────────────────────────────
-- support_ticket_replies
-- ─────────────────────────────────────────────

CREATE TABLE public.support_ticket_replies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid        NOT NULL REFERENCES public.support_tickets(id),
  sent_by         uuid        REFERENCES auth.users(id), -- NULL = staff reply from superadmin tool
  message         text        NOT NULL,
  is_staff_reply  boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users can read replies to their org's tickets
CREATE POLICY "Users can read replies for own org tickets"
  ON public.support_ticket_replies FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE organisation_id = get_user_org_id()
    )
  );

-- Users can add replies to their own tickets
CREATE POLICY "Users can reply to own org tickets"
  ON public.support_ticket_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE organisation_id = get_user_org_id()
    )
    AND get_user_role() IN ('admin', 'user')
    AND is_staff_reply = false
  );

GRANT SELECT, INSERT ON public.support_ticket_replies TO authenticated;
