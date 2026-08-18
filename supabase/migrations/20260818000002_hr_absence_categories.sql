-- ─────────────────────────────────────────────────────────────────────────────
-- HR Absence Categories
--
-- Allows care managers to define custom absence reason categories per org,
-- in addition to the 6 built-in defaults (which remain in code).
--
-- We also drop the CHECK constraint on hr_absence_records.reason_category so
-- custom category names can be stored in that column.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Remove the hard-coded CHECK constraint so custom category names can be saved
ALTER TABLE public.hr_absence_records
  DROP CONSTRAINT IF EXISTS hr_absence_records_reason_category_check;

-- 2. Custom categories table (org-scoped, unique by name within org)
CREATE TABLE public.hr_absence_categories (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, name)
);

ALTER TABLE public.hr_absence_categories ENABLE ROW LEVEL SECURITY;

-- Admins can manage their org's custom categories
CREATE POLICY "hr_absence_categories_admin_all"
  ON public.hr_absence_categories
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

GRANT SELECT, INSERT, DELETE ON public.hr_absence_categories TO authenticated;
