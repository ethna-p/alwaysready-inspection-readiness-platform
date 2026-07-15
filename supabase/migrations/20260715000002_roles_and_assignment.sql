-- =============================================================
-- Step 11+12: Role enforcement and KLOE assignment
-- =============================================================
--
-- Changes:
--   1. get_user_role() SECURITY DEFINER helper
--   2. Migrate users.role from (admin|rcm) → (admin|user|viewer)
--      - All existing users become 'admin'
--      - Default for new users is 'user'
--   3. Add viewer_expires_at to users (for temporary inspector accounts)
--   4. Add assigned_to to compliance_records (which team member owns a KLOE)
--   5. RLS: admin UPDATE policy on compliance_records (for assignment)
--   6. RLS: role-aware INSERT policy on compliance_record_history
--      - admin  → can insert for any KLOE in their org
--      - user   → can only insert for KLOEs assigned to them
--      - viewer → blocked entirely
--   7. Update create_demo_session to insert role='admin'
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. get_user_role() helper
--    Same pattern as get_user_org_id() — SECURITY DEFINER so it
--    can be called safely inside RLS policies without recursion.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 2. Migrate role values + update CHECK constraint
-- ─────────────────────────────────────────────────────────────
-- All existing users (admin or rcm) become admin in the new model
UPDATE public.users
SET role = 'admin'
WHERE role IN ('admin', 'rcm');

-- Swap the constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'user', 'viewer'));

-- New users default to 'user' (admins promote explicitly)
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';


-- ─────────────────────────────────────────────────────────────
-- 3. viewer_expires_at — for temporary inspector/board accounts
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS viewer_expires_at TIMESTAMPTZ;


-- ─────────────────────────────────────────────────────────────
-- 4. assigned_to on compliance_records
--    Nullable FK — NULL means unassigned (admin can still edit).
--    The sync trigger does NOT touch this column, so an admin
--    assignment persists across compliance record updates.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.compliance_records
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS cr_assigned_to_idx
  ON public.compliance_records(assigned_to);


-- ─────────────────────────────────────────────────────────────
-- 5. Allow admins to UPDATE compliance_records (assignment only)
--    The append-only pattern for status/evidence is preserved —
--    only assigned_to is set via this UPDATE path. The trigger
--    still handles all status/evidence writes via history inserts.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "Admins can update KLOE assignments"
  ON public.compliance_records
  FOR UPDATE TO authenticated
  USING (
    organisation_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  )
  WITH CHECK (
    organisation_id = public.get_user_org_id()
  );


-- ─────────────────────────────────────────────────────────────
-- 6. Role-aware INSERT policy on compliance_record_history
--    Replaces the original blanket policy.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their organisation's compliance history"
  ON public.compliance_record_history;

CREATE POLICY "Users can insert their organisation's compliance history"
  ON public.compliance_record_history
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND changed_by  = auth.uid()
    AND (
      -- Admins: unrestricted within their org
      public.get_user_role() = 'admin'
      OR
      -- Users: only for KLOEs explicitly assigned to them
      (
        public.get_user_role() = 'user'
        AND EXISTS (
          SELECT 1 FROM public.compliance_records cr
          WHERE cr.klo_item_id    = compliance_record_history.klo_item_id
            AND cr.organisation_id = public.get_user_org_id()
            AND cr.assigned_to    = auth.uid()
        )
      )
      -- Viewers: no condition matches → INSERT blocked
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 7. Update create_demo_session to use role='admin'
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_demo_session(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id          UUID;
  v_service_type_id UUID;
BEGIN

  -- ── Organisation ──────────────────────────────────────────
  SELECT id INTO v_service_type_id
  FROM service_types
  WHERE name = 'Residential Care Home'
  LIMIT 1;

  INSERT INTO organisations (name, service_type_id, is_demo, demo_expires_at)
  VALUES (
    'Sunrise Residential Care Home (Demo)',
    v_service_type_id,
    TRUE,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_org_id;

  -- ── User row (demo visitor is an admin) ───────────────────
  INSERT INTO users (id, organisation_id, email, role)
  SELECT p_user_id, v_org_id, au.email, 'admin'
  FROM auth.users au
  WHERE au.id = p_user_id;

  -- ── Group A: KLOEs 1-5 — completed 70 days ago, 180-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     review_frequency_days, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'in_progress',
    CASE k.rn WHEN 1 THEN 1 ELSE 2 END,
    180, 'Evidence gathering started.',
    p_user_id, NOW() - INTERVAL '75 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 1 AND 2;

  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'completed',
    CASE k.rn WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 1 WHEN 4 THEN 3 WHEN 5 THEN 2 END,
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '70 days' + INTERVAL '180 days',
    180,
    CASE k.rn
      WHEN 1 THEN 'SharePoint > Policies > Safe Staffing Policy v6 > 2026'
      WHEN 2 THEN 'SharePoint > Policies > Infection Control > IPC Policy v4'
      WHEN 3 THEN 'Physical: Blue folder, Registered Manager office, top shelf'
      WHEN 4 THEN 'SharePoint > Training Records > Mandatory Training Log 2026'
      WHEN 5 THEN 'SharePoint > Risk Assessments > Environment > 2026'
    END,
    'Review completed. Evidence verified and located.',
    p_user_id, NOW() - INTERVAL '70 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 1 AND 5;

  -- ── Group F: KLOEs 6-7 — OVERDUE (completed 84 days ago, 60-day freq) ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'completed', 1,
    NOW() - INTERVAL '84 days',
    NOW() - INTERVAL '84 days' + INTERVAL '60 days',
    60,
    'SharePoint > Policies > Legacy folder — location needs updating',
    'Review completed at previous cycle. Now overdue for re-review.',
    p_user_id, NOW() - INTERVAL '84 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 6 AND 7;

  -- ── Group B: KLOEs 8-12 — completed 42 days ago, 90-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'completed',
    CASE WHEN k.rn IN (8,11) THEN 2 WHEN k.rn IN (9,12) THEN 3 ELSE 2 END,
    NOW() - INTERVAL '42 days',
    NOW() - INTERVAL '42 days' + INTERVAL '90 days',
    90,
    'SharePoint > Evidence > KLOE Tracker > ' || k.rn::text || ' > Q3 2026',
    'Quarterly review completed.',
    p_user_id, NOW() - INTERVAL '42 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 8 AND 12;

  -- ── Group C: KLOEs 13-17 — completed 28 days ago, 90-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'completed',
    CASE WHEN k.rn IN (13,16) THEN 1 WHEN k.rn IN (14,17) THEN 2 ELSE 3 END,
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days' + INTERVAL '90 days',
    90,
    'SharePoint > Evidence > KLOE Tracker > ' || k.rn::text || ' > July 2026',
    'Review completed following supervision session.',
    p_user_id, NOW() - INTERVAL '28 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 13 AND 17;

  -- ── Group D: KLOEs 18-20 — completed 14 days ago, 30-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'completed',
    CASE k.rn WHEN 18 THEN 2 WHEN 19 THEN 3 ELSE 2 END,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '30 days',
    30,
    'Physical: Green lever arch file, staff room shelf',
    'Monthly review completed.',
    p_user_id, NOW() - INTERVAL '14 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 18 AND 20;

  -- ── Group G: KLOEs 21-22 — in_progress, started 7 days ago ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     review_frequency_days, notes, changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id, 'in_progress',
    CASE k.rn WHEN 21 THEN 2 ELSE 3 END,
    90,
    'Evidence gathering in progress. Deputy Manager to complete.',
    p_user_id, NOW() - INTERVAL '7 days'
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items) k
  WHERE k.rn BETWEEN 21 AND 22;

  -- Group H: KLOEs 23-24 — no inserts (grey / unassessed)

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_demo_session(UUID) TO authenticated;
