-- Migration: H4 — enforce field-level protection on hr_staff_profiles self-update
--
-- SECURITY FIX (H4): The hr_staff_profiles_self_update RLS policy checks row
-- ownership (user_id = auth.uid()) but does not restrict which columns a staff
-- member may write. A staff member can therefore PATCH employment, DBS,
-- right-to-work, appraisal, and other regulated fields on their own profile
-- via the direct Supabase API, bypassing the two-field Server Action.
--
-- Fix 1: Add a BEFORE UPDATE trigger that raises an exception if a non-admin
--   caller modifies any column other than next_of_kin_name / next_of_kin_phone.
--
-- Fix 2: Update the admin-only policy to use the expiry-aware RLS helpers
--   instead of direct public.users subqueries (aligns with H2/H3 fixes).
--
-- The saveOwnProfile Server Action already restricts to these two fields at the
-- application layer; the trigger provides the authoritative database-layer guard.

-- ── 1. Column-guard trigger ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_hr_staff_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Admins (and service-role writes, which bypass RLS) may update any column.
  -- get_user_role() returns NULL for non-authenticated callers, so service-role
  -- writes (which skip RLS entirely) also bypass this guard safely.
  IF public.get_user_role() = 'admin' OR public.get_user_role() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Staff self-service: only next_of_kin_name and next_of_kin_phone may change.
  -- Raise an error if any protected column is being written.
  IF
    NEW.organisation_id            IS DISTINCT FROM OLD.organisation_id OR
    NEW.user_id                    IS DISTINCT FROM OLD.user_id          OR
    NEW.ni_number                  IS DISTINCT FROM OLD.ni_number        OR
    NEW.job_title                  IS DISTINCT FROM OLD.job_title        OR
    NEW.department                 IS DISTINCT FROM OLD.department       OR
    NEW.employee_type              IS DISTINCT FROM OLD.employee_type    OR
    NEW.contracted_hours           IS DISTINCT FROM OLD.contracted_hours OR
    NEW.employment_start           IS DISTINCT FROM OLD.employment_start OR
    NEW.leaving_date               IS DISTINCT FROM OLD.leaving_date     OR
    NEW.employment_status          IS DISTINCT FROM OLD.employment_status OR
    NEW.date_of_birth              IS DISTINCT FROM OLD.date_of_birth    OR
    NEW.gender                     IS DISTINCT FROM OLD.gender           OR
    NEW.ethnic_origin              IS DISTINCT FROM OLD.ethnic_origin    OR
    NEW.disability                 IS DISTINCT FROM OLD.disability       OR
    NEW.marital_status             IS DISTINCT FROM OLD.marital_status   OR
    NEW.dbs_review_date            IS DISTINCT FROM OLD.dbs_review_date  OR
    NEW.dbs_next_review_due        IS DISTINCT FROM OLD.dbs_next_review_due OR
    NEW.dbs_frequency_days         IS DISTINCT FROM OLD.dbs_frequency_days OR
    NEW.right_to_work_verified     IS DISTINCT FROM OLD.right_to_work_verified OR
    NEW.references_obtained        IS DISTINCT FROM OLD.references_obtained   OR
    NEW.supervision_review_date    IS DISTINCT FROM OLD.supervision_review_date OR
    NEW.supervision_next_due       IS DISTINCT FROM OLD.supervision_next_due   OR
    NEW.supervision_frequency_days IS DISTINCT FROM OLD.supervision_frequency_days OR
    NEW.appraisal_review_date      IS DISTINCT FROM OLD.appraisal_review_date  OR
    NEW.appraisal_next_due         IS DISTINCT FROM OLD.appraisal_next_due     OR
    NEW.appraisal_frequency_days   IS DISTINCT FROM OLD.appraisal_frequency_days OR
    NEW.appraisal_notes            IS DISTINCT FROM OLD.appraisal_notes        OR
    NEW.mandatory_training_complete IS DISTINCT FROM OLD.mandatory_training_complete
  THEN
    RAISE EXCEPTION
      'Staff may only update emergency contact fields (next_of_kin_name, next_of_kin_phone) on their own profile.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER hr_staff_profile_column_guard
  BEFORE UPDATE ON public.hr_staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_hr_staff_profile_columns();

-- ── 2. Fix admin policy — replace direct public.users lookups with helpers ────
-- (Aligns with H2/H3: helpers now enforce both viewer expiry and AAL2.)

DROP POLICY IF EXISTS "hr_staff_profiles_admin_all" ON public.hr_staff_profiles;

CREATE POLICY "hr_staff_profiles_admin_all"
  ON public.hr_staff_profiles
  FOR ALL
  TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  )
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );
