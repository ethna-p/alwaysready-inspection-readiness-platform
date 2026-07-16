-- =============================================================
-- Change demo session expiry from 7 days to next midnight (UTC)
--
-- Demo orgs now expire at midnight of the day they are created,
-- so the nightly cleanup cron wipes them each night at 2am UTC.
-- This protects proprietary seed data from persisting long-term.
-- =============================================================

CREATE OR REPLACE FUNCTION public.create_demo_session(p_email TEXT)
RETURNS TABLE (
  org_id   UUID,
  user_id  UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id          UUID;
  v_user_id         UUID;
  v_service_type_id UUID;
  v_midnight        TIMESTAMPTZ;
BEGIN
  -- Midnight at the end of today (UTC) — cron cleans up at 2am
  v_midnight := (NOW()::date + INTERVAL '1 day')::timestamptz;

  -- Pick any service type (use the first available)
  SELECT id INTO v_service_type_id FROM service_types LIMIT 1;

  -- Create the shadow organisation
  INSERT INTO organisations (name, service_type_id, is_demo, demo_expires_at)
  VALUES (
    'Demo – ' || LEFT(p_email, 30),
    v_service_type_id,
    TRUE,
    v_midnight
  )
  RETURNING id INTO v_org_id;

  -- Create the anonymous demo user
  INSERT INTO users (id, email, organisation_id, role, onboarding_complete)
  VALUES (
    gen_random_uuid(),
    p_email,
    v_org_id,
    'admin',
    TRUE
  )
  RETURNING id INTO v_user_id;

  -- Seed the org with demo KLOE data
  PERFORM public.seed_demo_org(v_org_id, v_user_id);

  RETURN QUERY SELECT v_org_id, v_user_id;
END;
$$;
