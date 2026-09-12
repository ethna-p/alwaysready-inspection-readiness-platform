-- Migration: let the real (service-role) caller of seed_default_training_types through
--
-- BUG: 20260901000010_scope_seed_training_types.sql (L3) added an ownership
-- check — `auth.uid()` must belong to `p_organisation_id` — to stop an
-- authenticated end-user calling this SECURITY DEFINER function directly
-- with someone else's org_id (it's GRANTed to `authenticated`, so that path
-- is real). Correct threat model, but the check as written also rejects the
-- ONLY actual call site in the whole codebase:
-- app/dashboard/hr/page.tsx calls it via createAdminClient() (service-role),
-- server-side, with an org_id that already comes from the caller's own
-- verified profile.organisation_id — never user-supplied. A service-role
-- call has no end-user JWT at all, so auth.uid() is NULL there, which can
-- never match any row in public.users, so the check always raises and the
-- INSERT never runs. Confirmed directly: calling the RPC as service-role
-- against preview raised exactly this exception, and hr_training_types
-- stayed empty regardless of how many times /dashboard/hr was visited.
--
-- Net effect: no organisation on this platform has ever gotten its default
-- training types seeded since this check went in — the entire HR training/
-- certificate module has been silently unusable (nothing to log training
-- against, nothing to upload a certificate for) because the one path meant
-- to populate it always fails, and the caller doesn't check the RPC's error
-- either. Found via the Playwright walkthrough's HR record test (item 13).
--
-- Fix: only enforce the ownership check when there IS an end-user identity
-- to check. A service-role call (auth.uid() IS NULL) is already fully
-- trusted — it bypasses RLS on every table regardless, so it could insert
-- these rows directly without this function at all — so skipping the check
-- for it doesn't weaken anything. An authenticated-role call (auth.uid() IS
-- NOT NULL, whether from a legitimate future call site or the exact direct
-- API call L3 was defending against) still gets the original check,
-- unchanged.

CREATE OR REPLACE FUNCTION public.seed_default_training_types(p_organisation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND organisation_id = p_organisation_id
  ) THEN
    RAISE EXCEPTION 'Unauthorised: caller does not belong to the target organisation';
  END IF;

  INSERT INTO public.hr_training_types
    (organisation_id, name, is_mandatory, default_frequency_days, display_order)
  VALUES
    (p_organisation_id, 'Manual Handling',                true,  365,  1),
    (p_organisation_id, 'Fire Safety',                    true,  365,  2),
    (p_organisation_id, 'Safeguarding Adults',            true,  365,  3),
    (p_organisation_id, 'Safeguarding Children',          true,  365,  4),
    (p_organisation_id, 'Infection Prevention & Control', true,  365,  5),
    (p_organisation_id, 'Food Hygiene',                   true,  365,  6),
    (p_organisation_id, 'First Aid',                      true,  1095, 7),
    (p_organisation_id, 'Health & Safety',                true,  365,  8),
    (p_organisation_id, 'Dementia Awareness',             true,  365,  9),
    (p_organisation_id, 'Mental Capacity Act',            true,  365,  10),
    (p_organisation_id, 'Medication Administration',      false, 365,  11),
    (p_organisation_id, 'Lone Working',                   false, 365,  12),
    (p_organisation_id, 'Equality & Diversity',           true,  365,  13),
    (p_organisation_id, 'Data Protection (GDPR)',         true,  365,  14)
  ON CONFLICT (organisation_id, name) DO NOTHING;
END;
$$;
