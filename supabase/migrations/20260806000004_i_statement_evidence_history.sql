-- ── People's Voice evidence history ──────────────────────────────────────────
--
-- Captures a snapshot every time an i_statement_evidence row is created or
-- updated, giving a full audit trail of how confidence in each "I" statement
-- has changed over time.
--
-- Pattern mirrors compliance_record_history. The trigger fires AFTER INSERT
-- and AFTER UPDATE so that the snapshot reflects the committed state.

CREATE TABLE IF NOT EXISTS public.i_statement_evidence_history (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  i_statement_id   uuid        NOT NULL REFERENCES public.i_statements(id)  ON DELETE CASCADE,

  confidence       text        NOT NULL,   -- snapshot of confidence at this point
  evidence_summary text,                   -- snapshot of evidence summary
  action_needed    text,                   -- snapshot of action needed

  recorded_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX i_stmt_ev_history_org_stmt_idx
  ON public.i_statement_evidence_history (organisation_id, i_statement_id, recorded_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.i_statement_evidence_history ENABLE ROW LEVEL SECURITY;

-- All authenticated org members can read their own history
CREATE POLICY "i_stmt_ev_history_select" ON public.i_statement_evidence_history
  FOR SELECT TO authenticated
  USING (organisation_id = get_user_org_id());

-- Only the trigger (running as the session user) inserts history rows;
-- no direct INSERT/UPDATE/DELETE from application code is needed.
GRANT SELECT ON public.i_statement_evidence_history TO authenticated;

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_i_statement_evidence_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.i_statement_evidence_history (
    organisation_id,
    i_statement_id,
    confidence,
    evidence_summary,
    action_needed,
    recorded_by,
    recorded_at
  ) VALUES (
    NEW.organisation_id,
    NEW.i_statement_id,
    NEW.confidence,
    NEW.evidence_summary,
    NEW.action_needed,
    NEW.updated_by,
    now()
  );
  RETURN NEW;
END;
$$;

-- ── Attach trigger ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS i_statement_evidence_history_trigger ON public.i_statement_evidence;

CREATE TRIGGER i_statement_evidence_history_trigger
  AFTER INSERT OR UPDATE ON public.i_statement_evidence
  FOR EACH ROW EXECUTE FUNCTION public.record_i_statement_evidence_history();
