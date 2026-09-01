-- Migration: scope seed_default_training_types to caller's own org (L3)
--
-- The original function was SECURITY DEFINER + GRANT TO authenticated with no
-- ownership check, meaning any authenticated user could supply an arbitrary
-- organisation_id and seed training types into a different tenant's HR section.
--
-- Fix: add an explicit membership check before the INSERT so the function
-- rejects calls where auth.uid() does not belong to the target org.

CREATE OR REPLACE FUNCTION public.seed_default_training_types(p_organisation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the calling user belongs to the target organisation.
  -- Without this, any authenticated user could seed into any org.
  IF NOT EXISTS (
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
