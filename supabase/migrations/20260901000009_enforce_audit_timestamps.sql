-- M13: Prevent authenticated users from forging audit timestamps.
--
-- compliance_record_history.system_recorded_at, review_frequency_history.changed_at,
-- and priority_history.changed_at all default to now() but the column values are
-- not enforced — an INSERT that supplies an explicit value would bypass the default
-- and allow backdating or postdating of the audit trail.
--
-- Fix: BEFORE INSERT triggers on all three tables unconditionally set the
-- timestamp to now(), so any client-supplied value is silently overwritten.
-- The triggers run as SECURITY DEFINER so they fire even if the row is
-- inserted via a SECURITY DEFINER function.

-- ── compliance_record_history.system_recorded_at ──────────────────────────────
CREATE OR REPLACE FUNCTION public.force_system_recorded_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.system_recorded_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_force_system_recorded_at
  BEFORE INSERT ON public.compliance_record_history
  FOR EACH ROW
  EXECUTE FUNCTION public.force_system_recorded_at();


-- ── review_frequency_history.changed_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.force_rfh_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.changed_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_force_rfh_changed_at
  BEFORE INSERT ON public.review_frequency_history
  FOR EACH ROW
  EXECUTE FUNCTION public.force_rfh_changed_at();


-- ── priority_history.changed_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.force_ph_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.changed_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_force_ph_changed_at
  BEFORE INSERT ON public.priority_history
  FOR EACH ROW
  EXECUTE FUNCTION public.force_ph_changed_at();
