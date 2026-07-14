-- ─────────────────────────────────────────────────────────────────────────────
-- TEST DATA SETUP
-- Run this AFTER run_all_migrations.sql and AFTER creating the auth user.
--
-- Step 1: Create the test organisation
-- Step 2: Link your auth user to it
--
-- Replace <YOUR-AUTH-USER-UUID> with the UUID shown in
-- Authentication → Users in the Supabase dashboard after you add the user.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create test organisation (Residential Care Home — the demo service type)
INSERT INTO public.organisations (name, service_type_id, subscription_tier)
SELECT
  'Sunrise Care Home',
  id,
  'trial'
FROM public.service_types
WHERE name = 'Residential Care Home'
RETURNING id, name;

-- 2. Link auth user to the organisation
-- Replace <YOUR-AUTH-USER-UUID> below
INSERT INTO public.users (id, organisation_id, email, role)
SELECT
  '<YOUR-AUTH-USER-UUID>',
  o.id,
  '<YOUR-EMAIL>',
  'rcm'
FROM public.organisations o
WHERE o.name = 'Sunrise Care Home';
