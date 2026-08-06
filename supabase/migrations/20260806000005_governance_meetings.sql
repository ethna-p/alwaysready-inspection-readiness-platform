-- ── Governance meetings ───────────────────────────────────────────────────────
--
-- Records quality assurance and governance meetings that CQC inspectors
-- routinely ask to see as evidence of effective Well-led oversight.
--
-- status values:
--   draft       — record in progress, not yet formally signed off
--   signed_off  — reviewed and signed off by an authorised person

CREATE TABLE IF NOT EXISTS public.governance_meetings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,

  title            text        NOT NULL,          -- e.g. "Monthly Quality Assurance Meeting"
  meeting_date     date        NOT NULL,
  attendees        text,                           -- free text: names and roles present
  agenda           text,                           -- items on the agenda
  key_decisions    text,                           -- decisions made / outcomes agreed
  actions_arising  text,                           -- follow-up actions (references action items)

  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'signed_off')),
  signed_off_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_off_at    timestamptz,

  created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX governance_meetings_org_idx
  ON public.governance_meetings (organisation_id, meeting_date DESC);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_governance_meetings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER governance_meetings_updated_at
  BEFORE UPDATE ON public.governance_meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_governance_meetings_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.governance_meetings ENABLE ROW LEVEL SECURITY;

-- All roles can view their org's meeting records
CREATE POLICY "governance_meetings_select" ON public.governance_meetings
  FOR SELECT TO authenticated
  USING (organisation_id = get_user_org_id());

-- Admins and staff can create meeting records
CREATE POLICY "governance_meetings_insert" ON public.governance_meetings
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

-- Admins can update any record; staff can update their own while still draft
CREATE POLICY "governance_meetings_update" ON public.governance_meetings
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND created_by = auth.uid() AND status = 'draft')
    )
  )
  WITH CHECK (organisation_id = get_user_org_id());

-- Only admins can delete
CREATE POLICY "governance_meetings_delete" ON public.governance_meetings
  FOR DELETE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_meetings TO authenticated;
