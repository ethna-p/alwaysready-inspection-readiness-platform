-- ── Post-inspection module ────────────────────────────────────────────────────
--
-- Two tables:
--
--   post_inspection_reviews  — records a completed CQC inspection with ratings
--                              and the date the draft report was received (which
--                              starts the 10-day Factual Accuracy Challenge clock)
--
--   fac_items                — individual points raised in a Factual Accuracy
--                              Challenge, linked to a post_inspection_review
--
-- overall_rating / per-KQ rating values:
--   outstanding | good | requires_improvement | inadequate | not_rated
--
-- fac_items.dispute_type values:
--   factual_error       — objectively wrong (e.g. wrong staff ratio)
--   subjective_judgment — inspector interpretation we disagree with
--
-- fac_items.status values:
--   pending   — identified, not yet submitted to CQC
--   submitted — sent as part of our FAC response
--   upheld    — CQC accepted our challenge
--   rejected  — CQC rejected our challenge
--
-- post_inspection_reviews.status values:
--   draft_received    — draft report in hand, FAC window open
--   fac_submitted     — our FAC response sent
--   final_report      — final report received, FAC complete
--   action_plan_active — improvement plan in progress
--   closed            — all actions resolved

-- ── post_inspection_reviews ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_inspection_reviews (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id      uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,

  inspection_date      date        NOT NULL,
  draft_received_date  date,                       -- FAC 10-day clock starts here
  final_report_date    date,

  overall_rating       text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (overall_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),
  safe_rating          text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (safe_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),
  effective_rating     text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (effective_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),
  caring_rating        text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (caring_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),
  responsive_rating    text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (responsive_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),
  well_led_rating      text        NOT NULL DEFAULT 'not_rated'
                                   CHECK (well_led_rating IN ('outstanding','good','requires_improvement','inadequate','not_rated')),

  inspector_name       text,
  key_findings         text,        -- narrative summary of inspector's main points
  staff_briefing       text,        -- manager's internal briefing notes for staff

  status               text        NOT NULL DEFAULT 'draft_received'
                                   CHECK (status IN ('draft_received','fac_submitted','final_report','action_plan_active','closed')),

  created_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX post_inspection_reviews_org_idx
  ON public.post_inspection_reviews (organisation_id, inspection_date DESC);

CREATE OR REPLACE FUNCTION public.set_post_inspection_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER post_inspection_reviews_updated_at
  BEFORE UPDATE ON public.post_inspection_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_post_inspection_reviews_updated_at();

ALTER TABLE public.post_inspection_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pir_select" ON public.post_inspection_reviews
  FOR SELECT TO authenticated USING (organisation_id = get_user_org_id());

CREATE POLICY "pir_insert" ON public.post_inspection_reviews
  FOR INSERT TO authenticated
  WITH CHECK (organisation_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "pir_update" ON public.post_inspection_reviews
  FOR UPDATE TO authenticated
  USING (organisation_id = get_user_org_id() AND get_user_role() = 'admin')
  WITH CHECK (organisation_id = get_user_org_id());

CREATE POLICY "pir_delete" ON public.post_inspection_reviews
  FOR DELETE TO authenticated
  USING (organisation_id = get_user_org_id() AND get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_inspection_reviews TO authenticated;

-- ── fac_items ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fac_items (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id      uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  review_id            uuid        NOT NULL REFERENCES public.post_inspection_reviews(id) ON DELETE CASCADE,

  key_question         text        NOT NULL
                                   CHECK (key_question IN ('Safe','Effective','Caring','Responsive','Well-led')),
  inspector_finding    text        NOT NULL,   -- what the inspector wrote
  dispute_type         text        NOT NULL
                                   CHECK (dispute_type IN ('factual_error','subjective_judgment')),
  our_position         text        NOT NULL,   -- our counter-argument
  evidence_reference   text,                   -- where to find supporting evidence

  status               text        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','submitted','upheld','rejected')),

  created_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fac_items_review_idx
  ON public.fac_items (review_id, key_question);
CREATE INDEX fac_items_org_idx
  ON public.fac_items (organisation_id);

CREATE OR REPLACE FUNCTION public.set_fac_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER fac_items_updated_at
  BEFORE UPDATE ON public.fac_items
  FOR EACH ROW EXECUTE FUNCTION public.set_fac_items_updated_at();

ALTER TABLE public.fac_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fac_select" ON public.fac_items
  FOR SELECT TO authenticated USING (organisation_id = get_user_org_id());

CREATE POLICY "fac_insert" ON public.fac_items
  FOR INSERT TO authenticated
  WITH CHECK (organisation_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "fac_update" ON public.fac_items
  FOR UPDATE TO authenticated
  USING (organisation_id = get_user_org_id() AND get_user_role() = 'admin')
  WITH CHECK (organisation_id = get_user_org_id());

CREATE POLICY "fac_delete" ON public.fac_items
  FOR DELETE TO authenticated
  USING (organisation_id = get_user_org_id() AND get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fac_items TO authenticated;
