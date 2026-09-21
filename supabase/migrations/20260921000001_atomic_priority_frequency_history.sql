-- M19: write priority_history and review_frequency_history inside the database,
-- in the same transaction as the compliance_record_history insert that causes them.
--
-- Problem found by the 2026-09-21 audit: app/dashboard/kloes/actions.ts saved a KLOE
-- review with three separate requests. The compliance_record_history insert (whose
-- trigger updates compliance_records) was checked, but the follow-up inserts into
-- priority_history and review_frequency_history ignored their result. If one of
-- those failed, the current record changed while its audit entry was silently lost,
-- which breaks the append-only audit trail this product promises. Because they were
-- separate requests, a partial save was also possible.
--
-- Fix: an AFTER INSERT trigger on compliance_record_history records the two history
-- rows itself, so all of it commits or rolls back together and no caller can forget.
--
-- Behaviour matches what the app did, so the KLOE timeline is unchanged:
--   * only when the saving user is an admin (users cannot change priority or frequency,
--     and service-role writes have no user, so they record no history), and
--   * only when the new value differs from the value currently held in
--     compliance_records; a first-ever save records old value NULL.
--
-- ORDERING DEPENDENCE: this trigger must read compliance_records BEFORE
-- trg_sync_compliance_record updates it. Postgres fires AFTER triggers on the same event
-- in alphabetical name order, and "trg_record_..." sorts before "trg_sync_...". Do not
-- rename either trigger without re-checking this. An integration test asserts the old
-- values are captured correctly, so a mistake here would fail CI.
--
-- SECURITY DEFINER so the history rows are written even though the caller's own
-- insert policies on the two history tables are not the point here; search_path is
-- pinned. Trigger functions are not callable directly, so no EXECUTE grant is needed.

CREATE OR REPLACE FUNCTION public.record_priority_frequency_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_priority  integer;
  old_frequency integer;
BEGIN
  IF public.get_user_role() IS DISTINCT FROM 'admin' THEN
    RETURN NEW;
  END IF;

  SELECT cr.priority, cr.review_frequency_days
    INTO old_priority, old_frequency
    FROM public.compliance_records cr
   WHERE cr.organisation_id = NEW.organisation_id
     AND cr.klo_item_id     = NEW.klo_item_id;

  IF NEW.priority IS NOT NULL AND NEW.priority IS DISTINCT FROM old_priority THEN
    INSERT INTO public.priority_history
      (organisation_id, klo_item_id, old_priority, new_priority, changed_by)
    VALUES
      (NEW.organisation_id, NEW.klo_item_id, old_priority, NEW.priority, NEW.changed_by);
  END IF;

  IF NEW.review_frequency_days IS NOT NULL AND NEW.review_frequency_days IS DISTINCT FROM old_frequency THEN
    INSERT INTO public.review_frequency_history
      (organisation_id, klo_item_id, old_frequency_days, new_frequency_days, changed_by)
    VALUES
      (NEW.organisation_id, NEW.klo_item_id, old_frequency, NEW.review_frequency_days, NEW.changed_by);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_priority_frequency_history
  AFTER INSERT ON public.compliance_record_history
  FOR EACH ROW
  EXECUTE FUNCTION public.record_priority_frequency_history();
