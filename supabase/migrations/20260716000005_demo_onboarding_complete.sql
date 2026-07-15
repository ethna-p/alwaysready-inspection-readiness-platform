-- =============================================================
-- Fix: demo sessions should bypass the onboarding welcome screen
--
-- create_demo_session was inserting users without setting
-- onboarding_complete, so it defaulted to false and the proxy
-- redirected demo visitors to /dashboard/welcome instead of
-- the pre-populated dashboard.
--
-- This migration replaces the function to set onboarding_complete = true
-- for all demo-provisioned users.
-- =============================================================

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

  -- ── User row — onboarding_complete = true so demo visitors skip ──
  -- the welcome screen and land directly on the pre-populated dashboard.
  INSERT INTO users (id, organisation_id, email, role, onboarding_complete)
  SELECT p_user_id, v_org_id, au.email, 'admin', TRUE
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
