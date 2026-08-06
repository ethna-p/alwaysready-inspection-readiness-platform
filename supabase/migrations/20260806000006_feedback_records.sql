-- ── Feedback records ──────────────────────────────────────────────────────────
--
-- Records complaints, compliments, suggestions, and concerns received from
-- people using the service, families, carers, and professionals.
-- Provides evidence for the Caring and Responsive key questions.
--
-- feedback_type values:
--   complaint   — formal or informal complaint
--   compliment  — positive feedback received
--   suggestion  — improvement idea from any source
--   concern     — informal concern raised (not a formal complaint)
--
-- source values:
--   person_using_service — feedback from a resident / service user
--   family_or_carer      — from a family member or unpaid carer
--   professional         — from a healthcare or social care professional
--   anonymous            — received anonymously
--   other                — any other source
--
-- status values:
--   open      — received, not yet actioned
--   actioned  — response or action taken; may still be monitored
--   closed    — fully resolved; outcome recorded

CREATE TABLE IF NOT EXISTS public.feedback_records (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id      uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,

  feedback_type        text        NOT NULL
                                   CHECK (feedback_type IN ('complaint','compliment','suggestion','concern')),
  received_date        date        NOT NULL,
  source               text        NOT NULL
                                   CHECK (source IN ('person_using_service','family_or_carer','professional','anonymous','other')),
  source_detail        text,                        -- optional context, no PII
  summary              text        NOT NULL,        -- what the feedback said
  action_taken         text,                        -- how the service responded
  outcome              text,                        -- result / resolution

  status               text        NOT NULL DEFAULT 'open'
                                   CHECK (status IN ('open','actioned','closed')),

  related_key_question text,                        -- e.g. 'Caring', 'Responsive'
  reported_to_cqc      boolean     NOT NULL DEFAULT false,

  created_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX feedback_records_org_idx
  ON public.feedback_records (organisation_id, received_date DESC);
CREATE INDEX feedback_records_type_status_idx
  ON public.feedback_records (organisation_id, feedback_type, status);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_feedback_records_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER feedback_records_updated_at
  BEFORE UPDATE ON public.feedback_records
  FOR EACH ROW EXECUTE FUNCTION public.set_feedback_records_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.feedback_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_records_select" ON public.feedback_records
  FOR SELECT TO authenticated
  USING (organisation_id = get_user_org_id());

CREATE POLICY "feedback_records_insert" ON public.feedback_records
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

-- Admins update any; staff update their own while still open
CREATE POLICY "feedback_records_update" ON public.feedback_records
  FOR UPDATE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND (
      get_user_role() = 'admin'
      OR (get_user_role() = 'user' AND created_by = auth.uid() AND status = 'open')
    )
  )
  WITH CHECK (organisation_id = get_user_org_id());

CREATE POLICY "feedback_records_delete" ON public.feedback_records
  FOR DELETE TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_records TO authenticated;
