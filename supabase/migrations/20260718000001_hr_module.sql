-- ─────────────────────────────────────────────────────────────────────────────
-- HR Module
--
-- Tables:
--   hr_staff_profiles       — one row per staff member per org (employment,
--                             personal, emergency contact, compliance fields)
--   hr_training_types       — org-defined training categories (seeded with
--                             care-sector defaults on first access)
--   hr_training_records     — one row per staff member per training type
--   hr_training_certificates — uploaded certificates linked to training records
--   hr_holiday_allowances   — entitlement + taken per staff member per leave year
--
-- organisations table:
--   + holiday_unit          — 'days' or 'hours' (org-level setting)
--
-- Special category data (DOB, gender, ethnicity, disability, marital status)
-- is included for equality monitoring under the Equality Act 2010 obligations
-- that CQC inspects under Well-led. Legal basis: Article 9(2)(b) UK GDPR —
-- processing necessary for employment and social security law obligations.
--
-- Access: admin role only. RLS enforced at the database layer.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── organisations: add holiday_unit ──────────────────────────────────────────

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS holiday_unit text NOT NULL DEFAULT 'days'
    CHECK (holiday_unit IN ('days', 'hours'));


-- ── hr_staff_profiles ────────────────────────────────────────────────────────

CREATE TABLE public.hr_staff_profiles (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id           uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id                   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Employment
  ni_number                 text,
  job_title                 text,
  department                text,
  employee_type             text        CHECK (employee_type IN (
                                          'full_time', 'part_time', 'zero_hours', 'bank', 'agency', 'volunteer'
                                        )),
  contracted_hours          numeric(6,2),
  employment_start          date,
  leaving_date              date,
  employment_status         text        NOT NULL DEFAULT 'active'
                                        CHECK (employment_status IN ('active', 'inactive', 'on_leave')),

  -- Personal (special category — Equality Act 2010 / Article 9(2)(b) UK GDPR)
  date_of_birth             date,
  gender                    text,
  ethnic_origin             text,
  disability                boolean,
  marital_status            text,

  -- Emergency contact
  next_of_kin_name          text,
  next_of_kin_phone         text,

  -- DBS
  dbs_review_date           date,
  dbs_next_review_due       date,
  dbs_frequency_days        integer,    -- e.g. 365 = annual, 1095 = every 3 years

  -- Right to Work / References
  right_to_work_verified    boolean     NOT NULL DEFAULT false,
  references_obtained       boolean     NOT NULL DEFAULT false,

  -- Supervision
  supervision_review_date   date,
  supervision_next_due      date,
  supervision_frequency_days integer,

  -- Appraisal
  appraisal_review_date     date,
  appraisal_next_due        date,
  appraisal_frequency_days  integer,
  appraisal_notes           text,

  -- Training summary flags (computed/set manually; detail lives in hr_training_records)
  mandatory_training_complete boolean NOT NULL DEFAULT false,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organisation_id, user_id)
);

ALTER TABLE public.hr_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Admin-only: full access within their org
CREATE POLICY "hr_staff_profiles_admin_all"
  ON public.hr_staff_profiles
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_staff_profiles TO authenticated;


-- ── hr_training_types ────────────────────────────────────────────────────────

CREATE TABLE public.hr_training_types (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  is_mandatory          boolean     NOT NULL DEFAULT false,
  default_frequency_days integer    NOT NULL DEFAULT 365,
  display_order         integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organisation_id, name)
);

ALTER TABLE public.hr_training_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_training_types_admin_all"
  ON public.hr_training_types
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_training_types TO authenticated;


-- ── hr_training_records ──────────────────────────────────────────────────────

CREATE TABLE public.hr_training_records (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  training_type_id      uuid        NOT NULL REFERENCES public.hr_training_types(id) ON DELETE CASCADE,

  date_completed        date,
  next_due              date,
  frequency_days        integer     NOT NULL DEFAULT 365,
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organisation_id, user_id, training_type_id)
);

ALTER TABLE public.hr_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_training_records_admin_all"
  ON public.hr_training_records
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_training_records TO authenticated;


-- ── hr_training_certificates ─────────────────────────────────────────────────

CREATE TABLE public.hr_training_certificates (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  training_record_id    uuid        NOT NULL REFERENCES public.hr_training_records(id) ON DELETE CASCADE,

  file_name             text        NOT NULL,
  file_path             text        NOT NULL,   -- Supabase Storage path
  file_size             integer,
  mime_type             text,
  scan_status           text        NOT NULL DEFAULT 'pending'
                                    CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  uploaded_by           uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_training_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_training_certificates_admin_all"
  ON public.hr_training_certificates
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_training_certificates TO authenticated;


-- ── hr_holiday_allowances ────────────────────────────────────────────────────

CREATE TABLE public.hr_holiday_allowances (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  leave_year_start      date        NOT NULL,   -- e.g. 2026-04-01 or 2026-01-01
  total_allowance       numeric(7,2) NOT NULL DEFAULT 28,  -- days or hours per org setting
  taken                 numeric(7,2) NOT NULL DEFAULT 0,
  carry_over            numeric(7,2) NOT NULL DEFAULT 0,   -- carried over from previous year

  -- remaining is computed: total_allowance + carry_over - taken (done in application layer)

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organisation_id, user_id, leave_year_start)
);

ALTER TABLE public.hr_holiday_allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_holiday_allowances_admin_all"
  ON public.hr_holiday_allowances
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_holiday_allowances TO authenticated;


-- ── Default training types seed function ──────────────────────────────────────
-- Called from application code when an org's HR section is first accessed
-- and no training types exist yet. Inserts care-sector standard types.

CREATE OR REPLACE FUNCTION public.seed_default_training_types(p_organisation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.hr_training_types
    (organisation_id, name, is_mandatory, default_frequency_days, display_order)
  VALUES
    (p_organisation_id, 'Manual Handling',              true,  365,  1),
    (p_organisation_id, 'Fire Safety',                  true,  365,  2),
    (p_organisation_id, 'Safeguarding Adults',          true,  365,  3),
    (p_organisation_id, 'Safeguarding Children',        true,  365,  4),
    (p_organisation_id, 'Infection Prevention & Control', true, 365, 5),
    (p_organisation_id, 'Food Hygiene',                 true,  365,  6),
    (p_organisation_id, 'First Aid',                    true,  1095, 7),
    (p_organisation_id, 'Health & Safety',              true,  365,  8),
    (p_organisation_id, 'Dementia Awareness',           true,  365,  9),
    (p_organisation_id, 'Mental Capacity Act',          true,  365,  10),
    (p_organisation_id, 'Medication Administration',    false, 365,  11),
    (p_organisation_id, 'Lone Working',                 false, 365,  12),
    (p_organisation_id, 'Equality & Diversity',         true,  365,  13),
    (p_organisation_id, 'Data Protection (GDPR)',       true,  365,  14)
  ON CONFLICT (organisation_id, name) DO NOTHING;
END;
$$;

-- Grant execute to authenticated so the app can call it server-side
GRANT EXECUTE ON FUNCTION public.seed_default_training_types(uuid) TO authenticated;
