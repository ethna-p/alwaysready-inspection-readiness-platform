-- =============================================================
-- Step 10: Demo session infrastructure
-- =============================================================
-- Creates two SECURITY DEFINER functions:
--
--   create_demo_session(p_user_id UUID) → UUID
--     Called once per demo visitor. Creates a private shadow
--     organisation, links the visitor's auth user to it, and seeds
--     realistic compliance data so the demo is immediately compelling.
--     Returns the new org id.
--
--   cleanup_expired_demo_orgs() → void
--     Deletes all demo orgs whose demo_expires_at has passed, along
--     with all their related data (history, records, users).
--     Run this on a schedule (e.g. pg_cron daily at 02:00 UTC).
--
-- Note: organisations.is_demo and organisations.demo_expires_at were
-- already included in migration 20260714000002_organisations.sql.
-- No schema changes are needed here.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Seed data helper: insert a compliance history row
--    with an explicit backdated system_recorded_at.
--    Firing the trigger on each insert keeps compliance_records
--    in sync automatically — no direct writes to that table.
-- ─────────────────────────────────────────────────────────────

-- (Helper is inlined in the main function below — no separate
--  function needed as the logic is simple enough to inline.)


-- ─────────────────────────────────────────────────────────────
-- 2. create_demo_session
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

  -- ── User row ──────────────────────────────────────────────
  INSERT INTO users (id, organisation_id, email, role)
  SELECT p_user_id, v_org_id, au.email, 'rcm'
  FROM auth.users au
  WHERE au.id = p_user_id;

  -- ─────────────────────────────────────────────────────────
  -- Seed compliance history
  --
  -- Story: Sunrise Care Home has been using AlwaysReady for
  -- 10 weeks.  Readiness improved from ~29 % to ~75 %, with
  -- a mid-period dip when two KLOEs became overdue, showing
  -- the platform catching what needs attention.
  --
  -- KLOE groups (ordered by klo_items.display_order):
  --
  --  #  1-5  — Group A  completed 70 days ago, 180-day freq → GREEN, all snapshots ✓
  --  #  6-7  — Group F  completed 84 days ago, 60-day freq  → RED  (overdue 24 days)
  --  #  8-12 — Group B  completed 42 days ago, 90-day freq  → GREEN ✓
  --  # 13-17 — Group C  completed 28 days ago, 90-day freq  → GREEN ✓
  --  # 18-20 — Group D  completed 14 days ago, 30-day freq  → GREEN (due in 16 days) ✓
  --  # 21-22 — Group G  in_progress,  7 days ago            → AMBER
  --  # 23-24 — Group H  never touched                       → GREY  (no inserts)
  --
  -- Readiness trend across the 8 weekly snapshots:
  --   Wk-7  Wk-6  Wk-5  Wk-4  Wk-3  Wk-2  Wk-1  Now
  --   29%   50%   50%   71%   63%   75%   75%   75%
  -- ─────────────────────────────────────────────────────────

  -- ── Group A: KLOEs 1-5 — completed 70 days ago, 180-day freq ──
  -- Add in_progress entries for KLOEs 1-2 first (makes audit trail richer)
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     review_frequency_days, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'in_progress',
    CASE k.rn WHEN 1 THEN 1 ELSE 2 END,
    180,
    'Evidence gathering started.',
    p_user_id,
    NOW() - INTERVAL '75 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 1 AND 2;

  -- Completed entries for all 5 KLOEs in Group A
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'completed',
    CASE k.rn
      WHEN 1 THEN 1
      WHEN 2 THEN 2
      WHEN 3 THEN 1
      WHEN 4 THEN 3
      WHEN 5 THEN 2
    END,
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
    p_user_id,
    NOW() - INTERVAL '70 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 1 AND 5;

  -- ── Group F: KLOEs 6-7 — OVERDUE (completed 84 days ago, 60-day freq) ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'completed',
    1,
    NOW() - INTERVAL '84 days',
    NOW() - INTERVAL '84 days' + INTERVAL '60 days',
    60,
    'SharePoint > Policies > Legacy folder — location needs updating',
    'Review completed at previous cycle. Now overdue for re-review.',
    p_user_id,
    NOW() - INTERVAL '84 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 6 AND 7;

  -- ── Group B: KLOEs 8-12 — completed 42 days ago, 90-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'completed',
    CASE
      WHEN k.rn IN (8, 11) THEN 2
      WHEN k.rn IN (9, 12) THEN 3
      ELSE 2
    END,
    NOW() - INTERVAL '42 days',
    NOW() - INTERVAL '42 days' + INTERVAL '90 days',
    90,
    'SharePoint > Evidence > KLOE Tracker > ' || k.rn::text || ' > Q3 2026',
    'Quarterly review completed.',
    p_user_id,
    NOW() - INTERVAL '42 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 8 AND 12;

  -- ── Group C: KLOEs 13-17 — completed 28 days ago, 90-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'completed',
    CASE
      WHEN k.rn IN (13, 16) THEN 1
      WHEN k.rn IN (14, 17) THEN 2
      ELSE 3
    END,
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days' + INTERVAL '90 days',
    90,
    'SharePoint > Evidence > KLOE Tracker > ' || k.rn::text || ' > July 2026',
    'Review completed following supervision session.',
    p_user_id,
    NOW() - INTERVAL '28 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 13 AND 17;

  -- ── Group D: KLOEs 18-20 — completed 14 days ago, 30-day freq ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     date_reviewed, next_review_due, review_frequency_days,
     evidence_location, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'completed',
    CASE k.rn WHEN 18 THEN 2 WHEN 19 THEN 3 ELSE 2 END,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '30 days',
    30,
    'Physical: Green lever arch file, staff room shelf',
    'Monthly review completed.',
    p_user_id,
    NOW() - INTERVAL '14 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 18 AND 20;

  -- ── Group G: KLOEs 21-22 — in_progress, started 7 days ago ──
  INSERT INTO compliance_record_history
    (organisation_id, klo_item_id, status, priority,
     review_frequency_days, notes,
     changed_by, system_recorded_at)
  SELECT
    v_org_id, k.id,
    'in_progress',
    CASE k.rn WHEN 21 THEN 2 ELSE 3 END,
    90,
    'Evidence gathering in progress. Deputy Manager to complete.',
    p_user_id,
    NOW() - INTERVAL '7 days'
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM klo_items
  ) k
  WHERE k.rn BETWEEN 21 AND 22;

  -- ── Group H: KLOEs 23-24 — no inserts (grey / unassessed) ──
  -- These KLOEs get no history row, so they appear as
  -- "Unassessed" (grey) in the dashboard — intentionally left
  -- to show the platform surfacing gaps, not hiding them.

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_demo_session(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 3. cleanup_expired_demo_orgs
--    Delete demo orgs (and all their data) once demo_expires_at
--    has passed. Run via pg_cron or a scheduled Edge Function.
--
--    Deletes in FK-safe order:
--      compliance_record_history }
--      review_frequency_history  } cascade-safe manual deletes
--      priority_history          }
--      users (public schema)     }
--      organisations             ← triggers cascade to compliance_records
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_demo_orgs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_ids UUID[];
BEGIN
  -- Collect expired demo org IDs
  SELECT ARRAY_AGG(id) INTO v_expired_ids
  FROM organisations
  WHERE is_demo = TRUE AND demo_expires_at < NOW();

  IF v_expired_ids IS NULL OR ARRAY_LENGTH(v_expired_ids, 1) = 0 THEN
    RETURN;  -- nothing to clean up
  END IF;

  -- Delete history tables first (no CASCADE from organisations on these)
  DELETE FROM compliance_record_history WHERE organisation_id = ANY(v_expired_ids);
  DELETE FROM review_frequency_history  WHERE organisation_id = ANY(v_expired_ids);
  DELETE FROM priority_history          WHERE organisation_id = ANY(v_expired_ids);

  -- Delete public.users (orphaned auth.users are harmless — they have no
  -- organisation, so get_user_org_id() returns NULL and all RLS denies access)
  DELETE FROM users WHERE organisation_id = ANY(v_expired_ids);

  -- Delete organisations — cascades to compliance_records automatically
  DELETE FROM organisations WHERE id = ANY(v_expired_ids);
END;
$$;

-- Only the service role (backend) should call cleanup directly.
-- Uncomment below once pg_cron is enabled on this Supabase project:
-- SELECT cron.schedule(
--   'cleanup-demo-orgs',
--   '0 2 * * *',     -- 02:00 UTC daily
--   'SELECT public.cleanup_expired_demo_orgs()'
-- );
