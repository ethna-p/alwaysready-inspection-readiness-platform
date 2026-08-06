-- ── Incidents ────────────────────────────────────────────────────────────────
--
-- Records safety incidents, safeguarding concerns, near misses, and other
-- notifiable events. All staff can log incidents; admins can review and close
-- them with a learning outcome.
--
-- incident_type values:
--   safety        — accident, injury, or safety concern
--   safeguarding  — safeguarding concern or allegation
--   near_miss     — near miss or prevented incident
--   complaint     — formal complaint received
--   other         — any other notifiable event
--
-- status values:
--   open          — newly logged, awaiting review
--   under_review  — being investigated or actioned
--   closed        — resolved; learning_outcome recorded

CREATE TABLE IF NOT EXISTS public.incidents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,

  title               text NOT NULL,
  incident_type       text NOT NULL CHECK (incident_type IN ('safety','safeguarding','near_miss','complaint','other')),
  date_of_incident    date NOT NULL,
  description         text NOT NULL,
  immediate_action    text,                     -- what was done immediately
  people_involved     text,                     -- free-text: who was involved (no PII enforcement at DB level)
  reported_externally boolean NOT NULL DEFAULT false,  -- CQC / local authority notified?
  external_ref        text,                     -- reference number if reported externally

  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','under_review','closed')),
  learning_outcome    text,                     -- populated when closed

  reported_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at           timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX incidents_org_idx       ON public.incidents (organisation_id);
CREATE INDEX incidents_status_idx    ON public.incidents (organisation_id, status);
CREATE INDEX incidents_date_idx      ON public.incidents (organisation_id, date_of_incident DESC);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_incidents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_incidents_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- All authenticated users in the same org can read incidents
CREATE POLICY "incidents_select" ON public.incidents
  FOR SELECT TO authenticated
  USING (organisation_id = get_user_org_id());

-- Admin and user roles can log new incidents
CREATE POLICY "incidents_insert" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

-- Admins can update any incident; staff can update their own (while open/under_review)
CREATE POLICY "incidents_update" ON public.incidents
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND reported_by = auth.uid() AND status != 'closed')
    )
  )
  WITH CHECK (organisation_id = get_user_org_id());

-- Only admins can delete incidents
CREATE POLICY "incidents_delete" ON public.incidents
  FOR DELETE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
