-- =============================================================
-- Step 3: Compliance tracking tables + append-only audit trail
-- =============================================================
-- Pattern:
--   App INSERTs into compliance_record_history with the FULL new state.
--   An AFTER INSERT trigger (SECURITY DEFINER) UPSERTs compliance_records.
--   Nothing in the app layer ever directly UPDATEs compliance_records.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. compliance_records  (current state, one row per org/KLOE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.compliance_records (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  klo_item_id           uuid        NOT NULL REFERENCES public.klo_items(id),
  status                text        NOT NULL DEFAULT 'not_started'
                                    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  priority              int         NOT NULL DEFAULT 3
                                    CHECK (priority BETWEEN 1 AND 5),
  -- date_reviewed: the date the provider asserts the review took place (may not be today)
  date_reviewed         timestamptz,
  -- next_review_due: calculated at write time from date_reviewed + review_frequency_days
  -- never recalculated from "today" — only set when a new history row is inserted
  next_review_due       timestamptz,
  review_frequency_days int         NOT NULL DEFAULT 90,
  evidence_location     text,
  notes                 text,
  last_updated_by       uuid        REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, klo_item_id)
);

-- Indexes for the readiness dashboard (frequent query: all records for an org)
CREATE INDEX cr_organisation_id_idx ON public.compliance_records(organisation_id);
CREATE INDEX cr_org_status_due_idx  ON public.compliance_records(organisation_id, status, next_review_due);


-- ─────────────────────────────────────────────────────────────
-- 2. compliance_record_history  (append-only audit trail)
-- ─────────────────────────────────────────────────────────────
-- Each row is an immutable snapshot of the full state at the time of change.
-- The app passes the COMPLETE new state on each insert (not just the delta),
-- so history rows are self-contained and the trigger can safely replace the
-- current-state row with whatever is in the latest history row.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.compliance_record_history (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Denormalised for efficient RLS scoping and querying without joins
  organisation_id       uuid        NOT NULL REFERENCES public.organisations(id),
  klo_item_id           uuid        NOT NULL REFERENCES public.klo_items(id),
  -- Full state snapshot (nullable: a partial update must still carry forward
  -- unchanged fields from the previous state; see trigger notes)
  status                text        CHECK (status IN ('not_started', 'in_progress', 'completed')),
  priority              int         CHECK (priority BETWEEN 1 AND 5),
  date_reviewed         timestamptz,
  next_review_due       timestamptz,
  review_frequency_days int,
  evidence_location     text,
  notes                 text,
  -- Who made the change and when the system recorded it
  changed_by            uuid        NOT NULL REFERENCES auth.users(id),
  -- system_recorded_at is set by the DB, never by the client
  system_recorded_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crh_organisation_id_idx ON public.compliance_record_history(organisation_id);
CREATE INDEX crh_org_klo_item_idx    ON public.compliance_record_history(organisation_id, klo_item_id);
-- For the audit trail timeline (Step 7), latest-first ordering per KLOE:
CREATE INDEX crh_org_klo_time_idx    ON public.compliance_record_history(organisation_id, klo_item_id, system_recorded_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 3. review_frequency_history  (tracks changes to review cadence)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.review_frequency_history (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id    uuid        NOT NULL REFERENCES public.organisations(id),
  klo_item_id        uuid        NOT NULL REFERENCES public.klo_items(id),
  old_frequency_days int,          -- NULL for the first recorded change (from the default)
  new_frequency_days int         NOT NULL,
  changed_by         uuid        NOT NULL REFERENCES auth.users(id),
  changed_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rfh_org_klo_idx ON public.review_frequency_history(organisation_id, klo_item_id);


-- ─────────────────────────────────────────────────────────────
-- 4. priority_history  (tracks changes to priority rating)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.priority_history (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES public.organisations(id),
  klo_item_id     uuid        NOT NULL REFERENCES public.klo_items(id),
  old_priority    int         CHECK (old_priority BETWEEN 1 AND 5), -- NULL for first change from default
  new_priority    int         NOT NULL CHECK (new_priority BETWEEN 1 AND 5),
  changed_by      uuid        NOT NULL REFERENCES auth.users(id),
  changed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ph_org_klo_idx ON public.priority_history(organisation_id, klo_item_id);


-- ─────────────────────────────────────────────────────────────
-- 5. Trigger: INSERT on history → UPSERT on current state
-- ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS
-- on compliance_records so the trigger can upsert even though authenticated
-- users have no direct INSERT/UPDATE policy on that table.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_compliance_record_from_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.compliance_records (
    organisation_id,
    klo_item_id,
    status,
    priority,
    date_reviewed,
    next_review_due,
    review_frequency_days,
    evidence_location,
    notes,
    last_updated_by,
    updated_at
  )
  VALUES (
    NEW.organisation_id,
    NEW.klo_item_id,
    COALESCE(NEW.status, 'not_started'),
    COALESCE(NEW.priority, 3),
    NEW.date_reviewed,
    NEW.next_review_due,
    COALESCE(NEW.review_frequency_days, 90),
    NEW.evidence_location,
    NEW.notes,
    NEW.changed_by,
    NEW.system_recorded_at
  )
  ON CONFLICT (organisation_id, klo_item_id) DO UPDATE SET
    -- status/priority/review_frequency: fall back to existing value if not supplied
    -- (allows partial updates where caller only changes one field)
    status                = COALESCE(EXCLUDED.status,                compliance_records.status),
    priority              = COALESCE(EXCLUDED.priority,              compliance_records.priority),
    review_frequency_days = COALESCE(EXCLUDED.review_frequency_days, compliance_records.review_frequency_days),
    -- date_reviewed, next_review_due: always overwrite (NULL is a valid "not yet reviewed" state)
    date_reviewed         = EXCLUDED.date_reviewed,
    next_review_due       = EXCLUDED.next_review_due,
    -- evidence_location/notes: always overwrite (allows explicit clearing)
    evidence_location     = EXCLUDED.evidence_location,
    notes                 = EXCLUDED.notes,
    last_updated_by       = EXCLUDED.last_updated_by,
    updated_at            = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_compliance_record
  AFTER INSERT ON public.compliance_record_history
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_compliance_record_from_history();


-- ─────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.compliance_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_record_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_frequency_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_history          ENABLE ROW LEVEL SECURITY;

-- compliance_records: SELECT only for authenticated users (all writes go via trigger)
CREATE POLICY "Users can read their organisation's compliance records"
  ON public.compliance_records
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

-- compliance_record_history: SELECT + INSERT (INSERT fires the trigger)
CREATE POLICY "Users can read their organisation's compliance history"
  ON public.compliance_record_history
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

CREATE POLICY "Users can insert their organisation's compliance history"
  ON public.compliance_record_history
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND changed_by  = auth.uid()
  );

-- review_frequency_history
CREATE POLICY "Users can read their organisation's frequency history"
  ON public.review_frequency_history
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

CREATE POLICY "Users can insert their organisation's frequency history"
  ON public.review_frequency_history
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND changed_by  = auth.uid()
  );

-- priority_history
CREATE POLICY "Users can read their organisation's priority history"
  ON public.priority_history
  FOR SELECT TO authenticated
  USING (organisation_id = public.get_user_org_id());

CREATE POLICY "Users can insert their organisation's priority history"
  ON public.priority_history
  FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = public.get_user_org_id()
    AND changed_by  = auth.uid()
  );


-- ─────────────────────────────────────────────────────────────
-- 7. Explicit GRANTs (required by Supabase post-May 2026)
-- ─────────────────────────────────────────────────────────────
-- compliance_records: SELECT only — all writes are via the trigger (SECURITY DEFINER)
GRANT SELECT ON public.compliance_records        TO authenticated;
-- history tables: SELECT + INSERT (INSERT kicks off the trigger chain)
GRANT SELECT, INSERT ON public.compliance_record_history TO authenticated;
GRANT SELECT, INSERT ON public.review_frequency_history  TO authenticated;
GRANT SELECT, INSERT ON public.priority_history          TO authenticated;
