-- ─────────────────────────────────────────────────────────────────────────────
-- HR Absence Records
--
-- Records sick leave and other absence episodes per staff member.
-- Each row is one absence episode (start to end). Absence days default to
-- calendar days (end_date - start_date + 1) but are manually editable.
--
-- Return-to-work (RTW) interview fields are included: CQC inspects RTW
-- processes under Safe and Well-led.
--
-- Access: admin role only. RLS enforced at the database layer.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.hr_absence_records (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id           uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id                   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Absence episode
  absence_type              text        NOT NULL DEFAULT 'sick'
                                        CHECK (absence_type IN ('sick', 'other')),
  start_date                date        NOT NULL,
  end_date                  date,                              -- NULL = ongoing
  absence_days              numeric(6,2),                     -- calendar days by default; manually editable

  -- Reason
  reason_category           text        CHECK (reason_category IN (
                                          'Musculoskeletal',
                                          'Respiratory / Cold / Flu',
                                          'Mental health / Stress / Anxiety',
                                          'Gastrointestinal',
                                          'Injury',
                                          'Other'
                                        )),
  notes                     text,

  -- Return to work
  rtw_interview_completed   boolean     NOT NULL DEFAULT false,
  rtw_interview_date        date,
  rtw_notes                 text,

  recorded_by               uuid        REFERENCES public.users(id) ON DELETE SET NULL,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_absence_records ENABLE ROW LEVEL SECURITY;

-- Admin-only: full access within their org
CREATE POLICY "hr_absence_records_admin_all"
  ON public.hr_absence_records
  FOR ALL
  TO authenticated
  USING (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_absence_records TO authenticated;
