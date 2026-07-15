-- Migration: Compliance sub-checklist
-- Two new tables:
--   klo_checklist_items        — seeded reference items (Core + Dementia Care)
--   klo_checklist_completions  — per-org completion state (append-friendly upsert)
--
-- Design decisions:
--   • service_type_id = NULL → universal (Dementia Care items shown to all orgs)
--   • sub_service → 'Residential' | 'Nursing' | 'Joint' — for Dual-Registered breakdown
--   • RAG is NOT driven by checklist completion (unchanged from existing logic)
--   • Completions are org-scoped via RLS (get_user_org_id())

-- ─────────────────────────────────────────────
-- Table: klo_checklist_items  (read-only reference)
-- ─────────────────────────────────────────────

CREATE TABLE public.klo_checklist_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  klo_item_id     uuid        NOT NULL REFERENCES public.klo_items(id),
  service_type_id uuid        REFERENCES public.service_types(id),   -- NULL = universal
  item_type       text        NOT NULL CHECK (item_type IN ('Core', 'Dementia Care')),
  ref             text        NOT NULL,
  sub_service     text        CHECK (sub_service IN ('Residential', 'Nursing', 'Joint')),
  checklist_item  text        NOT NULL,
  regulation      text,
  evidence_notes  text,
  display_order   int         NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.klo_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read klo_checklist_items"
  ON public.klo_checklist_items FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.klo_checklist_items TO authenticated;

-- ─────────────────────────────────────────────
-- Table: klo_checklist_completions  (per-org mutable state)
-- ─────────────────────────────────────────────

CREATE TABLE public.klo_checklist_completions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid        NOT NULL REFERENCES public.organisations(id),
  checklist_item_id   uuid        NOT NULL REFERENCES public.klo_checklist_items(id),
  is_complete         boolean     NOT NULL DEFAULT false,
  evidence_location   text,
  notes               text,
  completed_by        uuid        REFERENCES auth.users(id),
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, checklist_item_id)
);

ALTER TABLE public.klo_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Orgs can only see their own completions
CREATE POLICY "Org members can read own completions"
  ON public.klo_checklist_completions FOR SELECT
  TO authenticated
  USING (organisation_id = get_user_org_id());

-- Admins and users can insert/upsert
CREATE POLICY "Admins and users can upsert completions"
  ON public.klo_checklist_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

CREATE POLICY "Admins and users can update completions"
  ON public.klo_checklist_completions FOR UPDATE
  TO authenticated
  USING (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  )
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

GRANT SELECT, INSERT, UPDATE ON public.klo_checklist_completions TO authenticated;

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION public.set_checklist_completion_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER checklist_completion_updated_at
  BEFORE UPDATE ON public.klo_checklist_completions
  FOR EACH ROW EXECUTE FUNCTION public.set_checklist_completion_updated_at();

-- ─────────────────────────────────────────────
-- Seed: klo_checklist_items
-- 84 Nursing Home Core
-- 84 Residential Core
-- 10 Universal Dementia Care (service_type_id = NULL)
-- 178 Dual-Registered Core (Residential + Nursing sub-items)
--  1  Dual-Registered Joint Dementia (CAR-PC-04)
-- ─────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-01$$,
  NULL,
  $$Clinical incident log (medication errors, falls, pressure injuries) reviewed monthly with trend analysis$$,
  $$Reg 12$$,
  $$Incident log; monthly trend review minutes; action log$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-02$$,
  NULL,
  $$Duty of Candour policy is understood and applied by nursing and care staff whenever something goes wrong$$,
  $$Reg 20$$,
  $$Duty of Candour policy; staff awareness evidence; records of open disclosure$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-03$$,
  NULL,
  $$Clinical governance meeting (medicines, pressure ulcers, falls) held monthly with documented actions$$,
  $$Reg 12$$,
  $$Governance meeting minutes; clinical KPI review; evidence of practice change$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-04$$,
  NULL,
  $$Whistleblowing and raising concerns policy is known to nursing and care staff$$,
  $$Reg 13$$,
  $$Whistleblowing policy; staff awareness records$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-05$$,
  NULL,
  $$Learning from clinical incidents is shared at nursing handover and staff meetings$$,
  $$Reg 12$$,
  $$Handover records; staff meeting minutes; evidence of changed practice$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-01$$,
  NULL,
  $$Pressure ulcer risk assessment (e.g. Waterlow) completed on admission and reviewed regularly$$,
  $$Reg 12$$,
  $$Validated risk assessment tool; review records; tissue viability referrals$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-02$$,
  NULL,
  $$Moving and handling risk assessments completed for all residents with mobility or handling equipment needs$$,
  $$Reg 12$$,
  $$Moving and handling risk assessments; equipment service records$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-03$$,
  NULL,
  $$Falls risk assessed and reviewed; post-fall clinical review (including neurological observations where indicated) completed$$,
  $$Reg 12$$,
  $$Falls risk assessment; post-fall clinical review records$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-04$$,
  NULL,
  $$Choking and dysphagia risk identified with SALT input; texture-modified diets followed and documented$$,
  $$Reg 12$$,
  $$Dysphagia screening; SALT referral letters; kitchen records of texture-modified meals$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SP-01$$,
  NULL,
  $$Pre-admission clinical assessment is completed by a registered nurse before admission$$,
  $$Reg 9$$,
  $$Pre-admission clinical assessment; admission agreement$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SP-02$$,
  NULL,
  $$Hospital transfer documentation (clinical summary, medicines, care needs) accompanies residents on transfer$$,
  $$Reg 12$$,
  $$Transfer documentation; hospital passport$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SP-03$$,
  NULL,
  $$GP, tissue viability nurse, dietitian and other clinical specialist input is documented and acted on$$,
  $$Reg 12$$,
  $$MDT communication log; specialist referral records; evidence of actions taken$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SP-04$$,
  NULL,
  $$Clinical handover between shifts is structured, documented and covers all residents with changing needs$$,
  $$Reg 12$$,
  $$Handover records/checklist; spot-check of handover quality$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-01$$,
  NULL,
  $$Safeguarding Adults policy is current, accessible and all staff are aware of it$$,
  $$Reg 13$$,
  $$Safeguarding policy; sign-off record; staff awareness evidence$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-02$$,
  NULL,
  $$All nursing and care staff have completed safeguarding adults training at the appropriate level$$,
  $$Reg 13$$,
  $$Training matrix; certificates; refresher due dates$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-03$$,
  NULL,
  $$Safeguarding referrals are made correctly and promptly; referral log maintained$$,
  $$Reg 13$$,
  $$Safeguarding referral log; Local Authority acknowledgement$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-01$$,
  NULL,
  $$Fire risk assessment is current; PEEPs are in place reflecting clinical and mobility needs$$,
  $$Reg 15$$,
  $$Fire risk assessment; individual PEEPs; fire drill records$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-02$$,
  NULL,
  $$Gas, electrical and water safety certificates, including legionella testing, are current$$,
  $$Reg 15$$,
  $$Gas safety certificate; EICR; legionella risk assessment$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-03$$,
  NULL,
  $$Infection prevention and control policy is in place and the outbreak management plan has been tested, including for higher-acuity clinical procedures$$,
  $$Reg 12$$,
  $$IPC policy; outbreak management plan; evidence of testing for wound care/catheter care procedures$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-04$$,
  NULL,
  $$Clinical equipment (hoists, profiling beds, pressure-relieving mattresses) is serviced and maintained$$,
  $$Reg 15$$,
  $$Equipment service records; LOLER inspection certificates$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-05$$,
  NULL,
  $$Sharps and clinical waste disposal arrangements meet current guidance$$,
  $$Reg 12$$,
  $$Clinical waste contract; sharps disposal audit records$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-01$$,
  NULL,
  $$Registered nurse coverage is maintained on every shift, with a contingency plan for short-notice absence$$,
  $$Reg 18$$,
  $$Nurse rota; contingency/escalation plan; agency usage log$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-02$$,
  NULL,
  $$NMC registration is verified and revalidation dates are tracked for all registered nurses$$,
  $$Reg 18$$,
  $$NMC registration checks; revalidation tracker$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-03$$,
  NULL,
  $$DBS and reference checks are completed for all staff before they start unsupervised work$$,
  $$Reg 19$$,
  $$DBS certificates; reference checks; pre-employment checklist$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-04$$,
  NULL,
  $$Clinical supervision and appraisal are completed for all nursing staff at agreed intervals$$,
  $$Reg 18$$,
  $$Supervision records; appraisal records; schedule of due dates$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-01$$,
  NULL,
  $$MAR charts are audited monthly for accuracy and gaps, including controlled drugs$$,
  $$Reg 12$$,
  $$MAR chart audit records; action log for identified gaps$$,
  26
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-02$$,
  NULL,
  $$Controlled drugs register is reconciled and checked by two staff$$,
  $$Reg 12$$,
  $$Controlled drugs register; reconciliation records; dual sign-off$$,
  27
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-03$$,
  NULL,
  $$Syringe driver and IV medicines administration is undertaken only by nurses with current competency sign-off$$,
  $$Reg 12$$,
  $$Competency sign-off records; syringe driver audit; training certificates$$,
  28
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-04$$,
  NULL,
  $$Medicines storage, including fridge temperatures and clinical room security, is checked daily and logged$$,
  $$Reg 12$$,
  $$Fridge temperature log; clinical room security checks$$,
  29
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-AN-01$$,
  NULL,
  $$Pre-admission and ongoing clinical needs assessments are completed by a registered nurse, covering physical, mental and clinical needs$$,
  $$Reg 9$$,
  $$Needs assessment documentation; care plan cross-reference$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-AN-02$$,
  NULL,
  $$Nursing care plans are reviewed at least monthly or after any significant clinical change$$,
  $$Reg 9$$,
  $$Care plan review records; evidence of timely updates$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-AN-03$$,
  NULL,
  $$Communication needs are assessed and met in line with the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Communication needs assessment; accessible information records$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-EB-01$$,
  NULL,
  $$Nutrition and hydration screening (e.g. MUST) is completed and reviewed regularly, with dietitian input where indicated$$,
  $$Reg 14$$,
  $$MUST screening records; dietitian referrals$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-EB-02$$,
  NULL,
  $$Weight and clinical markers (e.g. wound healing, pressure ulcer grading) are monitored and escalated appropriately$$,
  $$Reg 14$$,
  $$Weight monitoring records; wound assessment charts; escalation log$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-EB-03$$,
  NULL,
  $$Service participates in a recognised clinical quality benchmarking scheme (e.g. tissue viability benchmarking)$$,
  $$Reg 17$$,
  $$Benchmarking participation evidence; reports$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-EB-04$$,
  NULL,
  $$Clinical outcomes (e.g. pressure ulcer incidence, falls rate) are monitored and reviewed over time$$,
  $$Reg 17$$,
  $$Outcome tracking records; trend reports$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-HL-01$$,
  NULL,
  $$Residents are supported to access GP, dentist, optician, podiatry and specialist clinical appointments$$,
  $$Reg 9$$,
  $$Appointment records; follow-up evidence$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-HL-02$$,
  NULL,
  $$Health action plans are in place for residents with long-term conditions, reviewed by nursing staff$$,
  $$Reg 9$$,
  $$Health action plans; condition-specific monitoring records$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-HL-03$$,
  NULL,
  $$Activity and rehabilitation programme supports healthier outcomes where clinically appropriate$$,
  $$Reg 9$$,
  $$Activity/rehab programme; participation records$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-CT-01$$,
  NULL,
  $$Consent is obtained and recorded before clinical care and treatment is provided$$,
  $$Reg 11$$,
  $$Consent records; care plan sign-off$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-CT-02$$,
  NULL,
  $$Mental Capacity Act assessments are completed where capacity is in doubt, including for clinical decisions$$,
  $$Reg 11$$,
  $$MCA assessment records; decision-specific assessments$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-CT-03$$,
  NULL,
  $$Advocacy access is offered and recorded where needed$$,
  $$Reg 11$$,
  $$Advocacy referral records$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-KD-01$$,
  NULL,
  $$Dignity audits are completed, including during clinical procedures, and used to improve practice$$,
  $$Reg 10$$,
  $$Dignity audit records; action plan$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-KD-02$$,
  NULL,
  $$Confidentiality of clinical and personal information is maintained and understood by staff$$,
  $$Reg 10$$,
  $$Confidentiality policy; staff training records$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-KD-03$$,
  NULL,
  $$Staff respond promptly and kindly to residents expressing distress, pain or discomfort$$,
  $$Reg 10$$,
  $$Care plan notes; observed practice records$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-PC-01$$,
  NULL,
  $$Nursing care plans are individualised, not generic, and reflect resident preferences alongside clinical needs$$,
  $$Reg 9$$,
  $$Sample of individualised care plans$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-PC-02$$,
  NULL,
  $$Cultural, religious and spiritual needs are identified and met$$,
  $$Reg 9$$,
  $$Care plan section on cultural/religious needs$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-01$$,
  NULL,
  $$Meaningful activities programme is in place, adapted for residents with clinical or mobility limitations$$,
  $$Reg 9$$,
  $$Activity programme; participation records$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-02$$,
  NULL,
  $$Visiting policy supports open access for family and friends$$,
  $$Reg 9$$,
  $$Visiting policy; visitor log$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-03$$,
  NULL,
  $$DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to clinical staff$$,
  $$Reg 9$$,
  $$DNACPR/ReSPECT forms; review dates$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-04$$,
  NULL,
  $$End of life and palliative nursing care plans are in place, reflecting resident wishes and clinical needs$$,
  $$Reg 9$$,
  $$End of life care plans; clinical review records$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-05$$,
  NULL,
  $$Advance care planning discussions, including clinical treatment preferences, are offered and documented$$,
  $$Reg 9$$,
  $$Advance care planning records$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-CC-01$$,
  NULL,
  $$Multi-disciplinary team input (GP, tissue viability, dietitian, physiotherapy) is sought and recorded for residents with complex clinical needs$$,
  $$Reg 12$$,
  $$MDT meeting records; referral letters$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-CC-02$$,
  NULL,
  $$Key worker / named nurse system is in place so residents have a consistent clinical point of contact$$,
  $$Reg 9$$,
  $$Key worker allocation list$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-CC-03$$,
  NULL,
  $$Transitions between levels of care within the home (e.g. residential to nursing bed) are planned with the resident and family$$,
  $$Reg 9$$,
  $$Internal transition plan; resident/family involvement records$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-LF-01$$,
  NULL,
  $$Complaints policy is in place, accessible, and complaints are responded to within set timescales$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log with response dates$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-LF-02$$,
  NULL,
  $$Resident and relative meetings are held regularly and feedback is acted on$$,
  $$Reg 16$$,
  $$Meeting minutes; action log$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-LF-03$$,
  NULL,
  $$Resident or relative satisfaction survey is conducted at least annually with results published$$,
  $$Reg 16$$,
  $$Survey results; published summary$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-TA-01$$,
  NULL,
  $$Admission process, including clinical pre-assessment, is clear, timely and non-discriminatory$$,
  $$Reg 9$$,
  $$Admission policy; pre-admission checklist$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-TA-02$$,
  NULL,
  $$Premises are accessible, including step-free access and adapted clinical/bathing facilities$$,
  $$Reg 15$$,
  $$Accessibility audit; adaptation records$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-TA-03$$,
  NULL,
  $$Information is available in accessible formats for residents with sensory or communication needs$$,
  $$Reg 9$$,
  $$Accessible format examples; Accessible Information Standard compliance$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-EE-01$$,
  NULL,
  $$Equality monitoring data is collected and used to identify and address gaps in experience$$,
  $$Reg 9$$,
  $$Equality monitoring data; action plan$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-EE-02$$,
  NULL,
  $$Interpreting and translation services are available for residents and families who need them$$,
  $$Reg 9$$,
  $$Interpreting service arrangement$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-EE-03$$,
  NULL,
  $$Staff receive training on equality, diversity and the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Training matrix; certificates$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-SD-01$$,
  NULL,
  $$Service has a clear, documented vision and values, understood by nursing and care staff$$,
  $$Reg 17$$,
  $$Vision and values statement; staff awareness evidence$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-SD-02$$,
  NULL,
  $$Staff feedback (e.g. surveys) is collected and used to shape strategic priorities$$,
  $$Reg 17$$,
  $$Staff survey results; evidence feedback influenced decisions$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-SD-03$$,
  NULL,
  $$Registered manager and clinical lead succession / sustainability plan is in place$$,
  $$Reg 17$$,
  $$Succession plan; business continuity documentation$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-WE-01$$,
  NULL,
  $$Equality, diversity and inclusion policy is in place and applied to recruitment, training and promotion$$,
  $$Reg 18$$,
  $$EDI policy; recruitment and promotion data$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-WE-02$$,
  NULL,
  $$Speak-up / whistleblowing arrangements are in place and staff are confident to use them$$,
  $$Reg 17$$,
  $$Whistleblowing policy; Freedom to Speak Up arrangements$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-WE-03$$,
  NULL,
  $$Staff wellbeing support is available, including for nursing staff managing clinical and emotional demands$$,
  $$Reg 18$$,
  $$Wellbeing support documentation; uptake records$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-CL-01$$,
  NULL,
  $$Registered manager is in post, with clinical lead / senior nurse support structure$$,
  $$Reg 17$$,
  $$Registered manager registration; clinical lead structure$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-CL-02$$,
  NULL,
  $$Fit and Proper Person Requirement checks are completed for the registered manager and directors$$,
  $$Reg 19$$,
  $$FPPR checks; DBS; references$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-CL-03$$,
  NULL,
  $$Leadership development and support is available to managers and senior nurses$$,
  $$Reg 17$$,
  $$Leadership development plan; training records$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-01$$,
  NULL,
  $$Statement of purpose is current and accurately reflects nursing provision$$,
  $$Reg 17$$,
  $$Statement of purpose; date of last review$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-02$$,
  NULL,
  $$Quality assurance audit schedule covers care plans, medicines, clinical procedures, environment and infection control$$,
  $$Reg 17$$,
  $$Audit schedule; completed audits; action plans$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-03$$,
  NULL,
  $$Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are reviewed$$,
  $$Reg 17$$,
  $$DSPT submission confirmation; cyber security policy$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-04$$,
  NULL,
  $$Business continuity plan is in place for emergencies, including clinical continuity (e.g. medicines supply, nurse staffing)$$,
  $$Reg 17$$,
  $$Business continuity plan; staff awareness evidence$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-05$$,
  NULL,
  $$Notifications and statutory data are submitted to CQC and other bodies as required$$,
  $$Reg 17$$,
  $$Notification log; submission confirmations$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-PC-01$$,
  NULL,
  $$Service engages with the local community$$,
  $$Reg 17$$,
  $$Community engagement records$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-PC-02$$,
  NULL,
  $$Partnership working with local health and clinical services (community nursing, hospital, palliative care teams) is evidenced$$,
  $$Reg 17$$,
  $$Partnership agreements; joint working records$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-PC-03$$,
  NULL,
  $$Good practice and clinical learning are shared with other providers or sector networks$$,
  $$Reg 17$$,
  $$Evidence of shared learning; network membership$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-IL-01$$,
  NULL,
  $$Service has identified at least one active clinical quality improvement project with measurable outcomes$$,
  $$Reg 17$$,
  $$QI project documentation; baseline and outcome data$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-IL-02$$,
  NULL,
  $$Staff are supported and encouraged to contribute ideas for improvement$$,
  $$Reg 17$$,
  $$Suggestion scheme records$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-IL-03$$,
  NULL,
  $$Service engages with clinical research, pilots or sector innovation where relevant$$,
  $$Reg 17$$,
  $$Evidence of research/pilot participation$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SC-01$$,
  NULL,
  $$Accident, incident and near-miss log maintained and reviewed for trends at least monthly$$,
  $$Reg 12$$,
  $$Incident log; monthly trend review minutes; action log$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SC-02$$,
  NULL,
  $$Duty of Candour policy is in place, staff understand it and it is applied openly and honestly whenever something goes wrong$$,
  $$Reg 20$$,
  $$Duty of Candour policy; staff awareness evidence; records of open disclosure to residents/families$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SC-03$$,
  NULL,
  $$Falls, pressure ulcer and medication incidents are reviewed at a monthly clinical/governance meeting with documented learning$$,
  $$Reg 12$$,
  $$Governance meeting minutes; themed incident analysis; evidence of practice change$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SC-04$$,
  NULL,
  $$Staff feel able to raise safety concerns without fear of reprisal; whistleblowing policy in place and known to staff$$,
  $$Reg 13$$,
  $$Whistleblowing policy; staff awareness records; evidence concerns have been acted on$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SC-05$$,
  NULL,
  $$Lessons learned from incidents are shared with staff and resulting changes to practice are evidenced$$,
  $$Reg 12$$,
  $$Staff meeting minutes; updated procedures; training records reflecting learning$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MR-01$$,
  NULL,
  $$Falls risk assessments completed on admission and reviewed regularly; post-fall protocol followed$$,
  $$Reg 12$$,
  $$Falls risk assessment tool on file; post-fall review records; referral to falls clinic where indicated$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MR-02$$,
  NULL,
  $$Moving and handling risk assessments and care plans in place; equipment identified and serviced$$,
  $$Reg 12$$,
  $$TILE/TILEO risk assessments; moving and handling care plans; equipment service records$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MR-03$$,
  NULL,
  $$Choking and swallowing risk (dysphagia) identified, SALT referrals made and texture-modified diets followed$$,
  $$Reg 12$$,
  $$Dysphagia screening records; SALT referral letters; kitchen records of texture-modified meals$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MR-04$$,
  NULL,
  $$Bed rails and window restrictors are risk-assessed and checked for safe use$$,
  $$Reg 12$$,
  $$Bed rail risk assessments; window restrictor inspection log; equipment safety checks$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$SAF-MR-05$$,
  NULL,
  $$Wandering or exit-seeking behaviour is risk-assessed; door sensors, wandering alarms or secure garden access are in place where needed$$,
  $$Reg 12$$,
  $$Individual risk assessment; door sensor/alarm test log; secure garden access records$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SP-01$$,
  NULL,
  $$Pre-admission assessment and trial visit completed before permanent admission where possible$$,
  $$Reg 9$$,
  $$Pre-admission assessment records; trial visit notes; admission agreement$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SP-02$$,
  NULL,
  $$Hospital transfer documentation (e.g. a 'Red Bag' or equivalent scheme) accompanies residents on admission to and discharge from hospital$$,
  $$Reg 12$$,
  $$Transfer documentation; hospital passport; evidence of scheme use$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SP-03$$,
  NULL,
  $$GP, district nursing and other multi-disciplinary input is documented and acted on$$,
  $$Reg 12$$,
  $$MDT communication log; GP visit records; evidence of actions taken on professional advice$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SP-04$$,
  NULL,
  $$Discharge-to-home or step-down transitions are planned and communicated with the receiving service$$,
  $$Reg 12$$,
  $$Discharge planning records; transfer of care summary; receiving-service confirmation$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SG-01$$,
  NULL,
  $$Safeguarding Adults policy is current, accessible and all staff are aware of it$$,
  $$Reg 13$$,
  $$Safeguarding policy reviewed within 12 months; sign-off record; staff awareness evidence$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SG-02$$,
  NULL,
  $$All staff have completed safeguarding adults training at the appropriate level$$,
  $$Reg 13$$,
  $$Training matrix showing completion dates and levels; certificates; refresher due dates$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SG-03$$,
  NULL,
  $$Safeguarding referrals are made correctly and promptly to the Local Authority; referral log maintained$$,
  $$Reg 13$$,
  $$Safeguarding referral log; evidence of timely reporting; Local Authority acknowledgement$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$SAF-SG-04$$,
  NULL,
  $$Best-interest decision-making records are completed and reviewed for residents who lack capacity, involving family or an IMCA as appropriate$$,
  $$Reg 11$$,
  $$Best-interest decision records; MCA assessment; IMCA referral where applicable$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-EI-01$$,
  NULL,
  $$Fire risk assessment is current and Personal Emergency Evacuation Plans (PEEPs) are in place for all residents$$,
  $$Reg 15$$,
  $$Fire risk assessment; individual PEEPs; fire drill records$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-EI-02$$,
  NULL,
  $$Gas, electrical and water safety certificates, including legionella testing, are current$$,
  $$Reg 15$$,
  $$Gas safety certificate; electrical (EICR) certificate; legionella risk assessment and test records$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-EI-03$$,
  NULL,
  $$Infection prevention and control policy is in place and the outbreak management plan has been tested$$,
  $$Reg 12$$,
  $$IPC policy; outbreak management plan; evidence of testing or drill$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-EI-04$$,
  NULL,
  $$Nurse call / call bell system is tested regularly and response times are monitored$$,
  $$Reg 12$$,
  $$Call bell test log; response time monitoring records; maintenance records$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-EI-05$$,
  NULL,
  $$Equipment (hoists, profiling beds, wheelchairs) is serviced and maintained to manufacturer schedule$$,
  $$Reg 15$$,
  $$Equipment service records; LOLER inspection certificates; maintenance log$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$SAF-EI-06$$,
  NULL,
  $$The environment has been audited for dementia-friendly design, including signage, contrast and way-finding$$,
  $$Reg 9$$,
  $$Environmental audit; signage photographs; action plan for identified improvements$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SS-01$$,
  NULL,
  $$Staffing rota reflects a dependency-based tool, not just a fixed staff-to-resident ratio$$,
  $$Reg 18$$,
  $$Dependency assessment tool; rota cross-referenced to dependency levels; review records$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SS-02$$,
  NULL,
  $$DBS and reference checks are completed for all staff before they start unsupervised work$$,
  $$Reg 19$$,
  $$DBS certificates; reference checks; pre-employment checklist$$,
  26
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SS-03$$,
  NULL,
  $$Night-time staffing levels are reviewed and justified against resident dependency$$,
  $$Reg 18$$,
  $$Night staffing review; dependency data; rationale documented$$,
  27
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-SS-04$$,
  NULL,
  $$Supervision and appraisal are completed for all staff at agreed intervals$$,
  $$Reg 18$$,
  $$Supervision records; appraisal records; schedule of due dates$$,
  28
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$SAF-SS-05$$,
  NULL,
  $$All staff have completed dementia care training appropriate to their role$$,
  $$Reg 18$$,
  $$Dementia training matrix; certificates; refresher schedule$$,
  29
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MT-01$$,
  NULL,
  $$MAR charts are audited monthly for accuracy and gaps$$,
  $$Reg 12$$,
  $$MAR chart audit records; action log for identified gaps$$,
  30
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MT-02$$,
  NULL,
  $$Controlled drugs register is reconciled and checked by two staff$$,
  $$Reg 12$$,
  $$Controlled drugs register; reconciliation records; dual sign-off$$,
  31
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MT-03$$,
  NULL,
  $$Medicines storage, including fridge temperatures, is checked and logged daily$$,
  $$Reg 12$$,
  $$Fridge temperature log; medicines storage checks; escalation record for out-of-range readings$$,
  32
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$SAF-MT-04$$,
  NULL,
  $$PRN medicine protocols are in place, person-specific and reviewed$$,
  $$Reg 12$$,
  $$PRN protocols; care plan cross-reference; review dates$$,
  33
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$SAF-MT-05$$,
  NULL,
  $$Covert administration of medicines, where used, is supported by an MCA best-interest decision and pharmacist input$$,
  $$Reg 11$$,
  $$Best-interest decision record; pharmacist advice; covert medicines protocol$$,
  34
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-AN-01$$,
  NULL,
  $$Pre-admission and ongoing needs assessments cover physical, mental, social and communication needs$$,
  $$Reg 9$$,
  $$Needs assessment documentation; care plan cross-reference; review schedule$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-AN-02$$,
  NULL,
  $$Care plans are reviewed at least monthly or after any significant change$$,
  $$Reg 9$$,
  $$Care plan review records; evidence of timely updates following changes in need$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-AN-03$$,
  NULL,
  $$Communication needs are assessed and met in line with the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Communication needs assessment; accessible information records; specialist referrals$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$EFF-AN-04$$,
  NULL,
  $$A 'this is me' or life story document is completed and used to inform daily care$$,
  $$Reg 9$$,
  $$Completed life story document; evidence it informs care plan and daily practice$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-EB-01$$,
  NULL,
  $$Nutrition and hydration screening (e.g. MUST) is completed and reviewed regularly$$,
  $$Reg 14$$,
  $$MUST screening records; referrals to dietitian where indicated; monitoring documentation$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-EB-02$$,
  NULL,
  $$Weight is monitored and unplanned weight loss is escalated to the GP or dietitian$$,
  $$Reg 14$$,
  $$Weight monitoring records; escalation log; dietitian referral letters$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-EB-03$$,
  NULL,
  $$Service participates in a recognised quality accreditation or benchmarking scheme$$,
  $$Reg 17$$,
  $$Accreditation certificate; benchmarking reports; action plans from review$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-EB-04$$,
  NULL,
  $$Resident outcomes (e.g. wellbeing, mobility, independence) are monitored and reviewed over time$$,
  $$Reg 17$$,
  $$Outcome tracking records; trend reports; evidence of action where outcomes decline$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-HL-01$$,
  NULL,
  $$Residents are supported to access GP, dentist, optician, podiatry and other health appointments$$,
  $$Reg 9$$,
  $$Appointment records; health appointment log; evidence of follow-up$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-HL-02$$,
  NULL,
  $$Health action plans are in place for residents with long-term conditions$$,
  $$Reg 9$$,
  $$Health action plans; condition-specific monitoring records$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-HL-03$$,
  NULL,
  $$Activity and physical wellbeing programme supports healthier lifestyles$$,
  $$Reg 9$$,
  $$Activity programme; participation records; evidence of tailoring to individual ability$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-CT-01$$,
  NULL,
  $$Consent is obtained and recorded before care and treatment is provided$$,
  $$Reg 11$$,
  $$Consent records; care plan sign-off; evidence of ongoing consent discussions$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-CT-02$$,
  NULL,
  $$Mental Capacity Act assessments are completed where capacity is in doubt$$,
  $$Reg 11$$,
  $$MCA assessment records; decision-specific assessments; staff training evidence$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$EFF-CT-03$$,
  NULL,
  $$Advocacy access is offered and recorded where needed$$,
  $$Reg 11$$,
  $$Advocacy referral records; resident/family awareness of advocacy rights$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$EFF-CT-04$$,
  NULL,
  $$DoLS / Liberty Protection Safeguards applications are tracked, current and renewed before expiry$$,
  $$Reg 11$$,
  $$DoLS tracker; application and authorisation dates; renewal monitoring$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-KD-01$$,
  NULL,
  $$Dignity audits are completed and used to improve practice$$,
  $$Reg 10$$,
  $$Dignity audit records; action plan; evidence of improvements made$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-KD-02$$,
  NULL,
  $$Confidentiality of resident information is maintained and understood by staff$$,
  $$Reg 10$$,
  $$Confidentiality policy; staff training records; data handling spot checks$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-KD-03$$,
  NULL,
  $$Staff respond promptly and kindly to residents expressing distress or discomfort$$,
  $$Reg 10$$,
  $$Care plan notes; observed practice records; family/resident feedback$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$CAR-KD-04$$,
  NULL,
  $$Staff are trained in person-centred approaches to distressed behaviour, avoiding unnecessary restriction$$,
  $$Reg 10$$,
  $$Training records; behaviour support plans; evidence of least-restrictive approach$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-PC-01$$,
  NULL,
  $$Care plans are individualised, not generic, and reflect resident preferences$$,
  $$Reg 9$$,
  $$Sample of individualised care plans; evidence of personal preference detail$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-PC-02$$,
  NULL,
  $$Cultural, religious and spiritual needs are identified and met$$,
  $$Reg 9$$,
  $$Care plan section on cultural/religious needs; evidence of needs being met$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$CAR-PC-03$$,
  NULL,
  $$Life story information is actively used to personalise daily routines and interactions$$,
  $$Reg 9$$,
  $$Life story document cross-referenced to care plan and daily activity records$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-IC-01$$,
  NULL,
  $$Meaningful activities programme is in place and tailored to individual interests$$,
  $$Reg 9$$,
  $$Activity programme; individual participation records; resident feedback$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-IC-02$$,
  NULL,
  $$Visiting policy supports open access for family and friends$$,
  $$Reg 9$$,
  $$Visiting policy; visitor log; evidence restrictions (where any) are proportionate and reviewed$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-IC-03$$,
  NULL,
  $$DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to staff$$,
  $$Reg 9$$,
  $$DNACPR/ReSPECT forms; review dates; staff awareness of location and content$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-IC-04$$,
  NULL,
  $$End of life and palliative care plans are in place, reflecting resident wishes$$,
  $$Reg 9$$,
  $$End of life care plans; evidence of resident/family involvement; review records$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$CAR-IC-05$$,
  NULL,
  $$Advance care planning discussions are offered and documented$$,
  $$Reg 9$$,
  $$Advance care planning records; evidence discussions were offered, even if declined$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  NULL,
  $$Dementia Care$$,
  $$CAR-IC-06$$,
  NULL,
  $$Reminiscence and meaningful occupation activities are tailored for residents living with dementia$$,
  $$Reg 9$$,
  $$Dementia-specific activity records; reminiscence resources; participation evidence$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-CC-01$$,
  NULL,
  $$Multi-disciplinary team input is sought and recorded for residents with complex needs$$,
  $$Reg 12$$,
  $$MDT meeting records; referral letters; evidence of input into care planning$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-CC-02$$,
  NULL,
  $$Key worker system is in place so residents have a consistent named point of contact$$,
  $$Reg 9$$,
  $$Key worker allocation list; evidence of key worker involvement in care reviews$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-CC-03$$,
  NULL,
  $$Transitions between levels of care within the home (e.g. to a dementia unit) are planned with the resident and family$$,
  $$Reg 9$$,
  $$Internal transition plan; resident/family involvement records; review of outcome$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-LF-01$$,
  NULL,
  $$Complaints policy is in place, accessible, and complaints are responded to within set timescales$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log with response dates; evidence of timescales met$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-LF-02$$,
  NULL,
  $$Resident and relative meetings are held regularly and feedback is acted on$$,
  $$Reg 16$$,
  $$Meeting minutes; action log arising from feedback$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-LF-03$$,
  NULL,
  $$Resident or relative satisfaction survey is conducted at least annually with results published$$,
  $$Reg 16$$,
  $$Survey results; published summary; action plan from findings$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-TA-01$$,
  NULL,
  $$Admission process is clear, timely and non-discriminatory$$,
  $$Reg 9$$,
  $$Admission policy; pre-admission checklist; evidence of equitable assessment$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-TA-02$$,
  NULL,
  $$Premises are accessible, including step-free access, adapted bathrooms and clear signage$$,
  $$Reg 15$$,
  $$Accessibility audit; adaptation records; signage photographs$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-TA-03$$,
  NULL,
  $$Information is available in accessible formats for residents with sensory or communication needs$$,
  $$Reg 9$$,
  $$Accessible format examples (large print, easy read, pictorial); Accessible Information Standard compliance$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-EE-01$$,
  NULL,
  $$Equality monitoring data is collected and used to identify and address gaps in experience$$,
  $$Reg 9$$,
  $$Equality monitoring data; analysis of gaps; action plan$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-EE-02$$,
  NULL,
  $$Interpreting and translation services are available for residents and families who need them$$,
  $$Reg 9$$,
  $$Interpreting service contract or arrangement; evidence of use where needed$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$RES-EE-03$$,
  NULL,
  $$Staff receive training on equality, diversity and the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Training matrix; certificates; refresher schedule$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-SD-01$$,
  NULL,
  $$Service has a clear, documented vision and values, understood by staff$$,
  $$Reg 17$$,
  $$Vision and values statement; staff awareness evidence (induction, appraisal)$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-SD-02$$,
  NULL,
  $$Staff feedback (e.g. surveys) is collected and used to shape strategic priorities$$,
  $$Reg 17$$,
  $$Staff survey results; evidence feedback influenced decisions$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-SD-03$$,
  NULL,
  $$Registered manager succession and business sustainability plan is in place$$,
  $$Reg 17$$,
  $$Succession plan; business continuity/sustainability documentation$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-WE-01$$,
  NULL,
  $$Equality, diversity and inclusion policy is in place and applied to recruitment, training and promotion$$,
  $$Reg 18$$,
  $$EDI policy; recruitment and promotion data; training records$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-WE-02$$,
  NULL,
  $$Speak-up / whistleblowing arrangements are in place and staff are confident to use them$$,
  $$Reg 17$$,
  $$Whistleblowing policy; Freedom to Speak Up arrangements; staff survey results$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-WE-03$$,
  NULL,
  $$Staff wellbeing support (e.g. occupational health, EAP, flexible working) is available$$,
  $$Reg 18$$,
  $$Wellbeing support documentation; uptake records; staff feedback$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-CL-01$$,
  NULL,
  $$Registered manager is in post, or robust interim cover arrangements are in place$$,
  $$Reg 17$$,
  $$Registered manager registration; interim cover plan where applicable$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-CL-02$$,
  NULL,
  $$Fit and Proper Person Requirement checks are completed for the registered manager and directors$$,
  $$Reg 19$$,
  $$FPPR checks; DBS; references; ongoing monitoring records$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-CL-03$$,
  NULL,
  $$Leadership development and support (e.g. mentoring, training) is available to managers$$,
  $$Reg 17$$,
  $$Leadership development plan; training records; mentoring arrangements$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-GM-01$$,
  NULL,
  $$Statement of purpose is current and accurately reflects the service provided$$,
  $$Reg 17$$,
  $$Statement of purpose; date of last review; evidence it matches actual service provision$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-GM-02$$,
  NULL,
  $$Quality assurance audit schedule is in place covering care plans, medicines, environment and infection control$$,
  $$Reg 17$$,
  $$Audit schedule; completed audits; action plans arising from findings$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-GM-03$$,
  NULL,
  $$Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are reviewed$$,
  $$Reg 17$$,
  $$DSPT submission confirmation; cyber security policy; review records$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-GM-04$$,
  NULL,
  $$Business continuity plan is in place for emergencies (fire, flood, power failure, pandemic) and staff know how to use it$$,
  $$Reg 17$$,
  $$Business continuity plan; staff awareness evidence; drill or test records$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-GM-05$$,
  NULL,
  $$Notifications and statutory data are submitted to CQC and other bodies as required$$,
  $$Reg 17$$,
  $$Notification log; submission confirmations; evidence of timeliness$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-PC-01$$,
  NULL,
  $$Service engages with the local community (e.g. schools, faith groups, volunteers)$$,
  $$Reg 17$$,
  $$Community engagement records; volunteer agreements; event records$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-PC-02$$,
  NULL,
  $$Partnership working with local health and social care services is evidenced$$,
  $$Reg 17$$,
  $$Partnership agreements; joint working records; meeting minutes$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-PC-03$$,
  NULL,
  $$Good practice and learning are shared with other providers or sector networks$$,
  $$Reg 17$$,
  $$Evidence of shared learning; network membership; case study or presentation records$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-IL-01$$,
  NULL,
  $$Service has identified at least one active quality improvement project with measurable outcomes$$,
  $$Reg 17$$,
  $$QI project documentation; baseline and outcome data$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-IL-02$$,
  NULL,
  $$Staff are supported and encouraged to contribute ideas for improvement$$,
  $$Reg 17$$,
  $$Suggestion scheme records; evidence ideas have been implemented$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$,
  $$WEL-IL-03$$,
  NULL,
  $$Service engages with research, pilots or sector innovation where relevant$$,
  $$Reg 17$$,
  $$Evidence of research/pilot participation; outcomes or learning shared$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-01$$,
  $$Residential$$,
  $$Accident, incident and near-miss log maintained and reviewed for trends at least monthly$$,
  $$Reg 12$$,
  $$Incident log; monthly trend review minutes; action log$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-02$$,
  $$Residential$$,
  $$Duty of Candour policy is in place, staff understand it and it is applied openly and honestly whenever something goes wrong$$,
  $$Reg 20$$,
  $$Duty of Candour policy; staff awareness evidence; records of open disclosure to residents/families$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-03$$,
  $$Residential$$,
  $$Falls, pressure ulcer and medication incidents are reviewed at a monthly clinical/governance meeting with documented learning$$,
  $$Reg 12$$,
  $$Governance meeting minutes; themed incident analysis; evidence of practice change$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-04$$,
  $$Residential$$,
  $$Staff feel able to raise safety concerns without fear of reprisal; whistleblowing policy in place and known to staff$$,
  $$Reg 13$$,
  $$Whistleblowing policy; staff awareness records; evidence concerns have been acted on$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-05$$,
  $$Residential$$,
  $$Lessons learned from incidents are shared with staff and resulting changes to practice are evidenced$$,
  $$Reg 12$$,
  $$Staff meeting minutes; updated procedures; training records reflecting learning$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-01$$,
  $$Nursing$$,
  $$Clinical incident log (medication errors, falls, pressure injuries) reviewed monthly with trend analysis$$,
  $$Reg 12$$,
  $$Incident log; monthly trend review minutes; action log$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-02$$,
  $$Nursing$$,
  $$Duty of Candour policy is understood and applied by nursing and care staff whenever something goes wrong$$,
  $$Reg 20$$,
  $$Duty of Candour policy; staff awareness evidence; records of open disclosure$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-03$$,
  $$Nursing$$,
  $$Clinical governance meeting (medicines, pressure ulcers, falls) held monthly with documented actions$$,
  $$Reg 12$$,
  $$Governance meeting minutes; clinical KPI review; evidence of practice change$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-04$$,
  $$Nursing$$,
  $$Whistleblowing and raising concerns policy is known to nursing and care staff$$,
  $$Reg 13$$,
  $$Whistleblowing policy; staff awareness records$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SC-05$$,
  $$Nursing$$,
  $$Learning from clinical incidents is shared at nursing handover and staff meetings$$,
  $$Reg 12$$,
  $$Handover records; staff meeting minutes; evidence of changed practice$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-01$$,
  $$Residential$$,
  $$Falls risk assessments completed on admission and reviewed regularly; post-fall protocol followed$$,
  $$Reg 12$$,
  $$Falls risk assessment tool on file; post-fall review records; referral to falls clinic where indicated$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-02$$,
  $$Residential$$,
  $$Moving and handling risk assessments and care plans in place; equipment identified and serviced$$,
  $$Reg 12$$,
  $$TILE/TILEO risk assessments; moving and handling care plans; equipment service records$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-03$$,
  $$Residential$$,
  $$Choking and swallowing risk (dysphagia) identified, SALT referrals made and texture-modified diets followed$$,
  $$Reg 12$$,
  $$Dysphagia screening records; SALT referral letters; kitchen records of texture-modified meals$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-04$$,
  $$Residential$$,
  $$Bed rails and window restrictors are risk-assessed and checked for safe use$$,
  $$Reg 12$$,
  $$Bed rail risk assessments; window restrictor inspection log; equipment safety checks$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-01$$,
  $$Nursing$$,
  $$Pressure ulcer risk assessment (e.g. Waterlow) completed on admission and reviewed regularly$$,
  $$Reg 12$$,
  $$Validated risk assessment tool; review records; tissue viability referrals$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-02$$,
  $$Nursing$$,
  $$Moving and handling risk assessments completed for all residents with mobility or handling equipment needs$$,
  $$Reg 12$$,
  $$Moving and handling risk assessments; equipment service records$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-03$$,
  $$Nursing$$,
  $$Falls risk assessed and reviewed; post-fall clinical review (including neurological observations where indicated) completed$$,
  $$Reg 12$$,
  $$Falls risk assessment; post-fall clinical review records$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MR-04$$,
  $$Nursing$$,
  $$Choking and dysphagia risk identified with SALT input; texture-modified diets followed and documented$$,
  $$Reg 12$$,
  $$Dysphagia screening; SALT referral letters; kitchen records of texture-modified meals$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-01$$,
  $$Residential$$,
  $$Pre-admission assessment and trial visit completed before permanent admission where possible$$,
  $$Reg 9$$,
  $$Pre-admission assessment records; trial visit notes; admission agreement$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-02$$,
  $$Residential$$,
  $$Hospital transfer documentation (e.g. a 'Red Bag' or equivalent scheme) accompanies residents on admission to and discharge from hospital$$,
  $$Reg 12$$,
  $$Transfer documentation; hospital passport; evidence of scheme use$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-03$$,
  $$Residential$$,
  $$GP, district nursing and other multi-disciplinary input is documented and acted on$$,
  $$Reg 12$$,
  $$MDT communication log; GP visit records; evidence of actions taken on professional advice$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-04$$,
  $$Residential$$,
  $$Discharge-to-home or step-down transitions are planned and communicated with the receiving service$$,
  $$Reg 12$$,
  $$Discharge planning records; transfer of care summary; receiving-service confirmation$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-01$$,
  $$Nursing$$,
  $$Pre-admission clinical assessment is completed by a registered nurse before admission$$,
  $$Reg 9$$,
  $$Pre-admission clinical assessment; admission agreement$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-02$$,
  $$Nursing$$,
  $$Hospital transfer documentation (clinical summary, medicines, care needs) accompanies residents on transfer$$,
  $$Reg 12$$,
  $$Transfer documentation; hospital passport$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-03$$,
  $$Nursing$$,
  $$GP, tissue viability nurse, dietitian and other clinical specialist input is documented and acted on$$,
  $$Reg 12$$,
  $$MDT communication log; specialist referral records; evidence of actions taken$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-04$$,
  $$Nursing$$,
  $$Clinical handover between shifts is structured, documented and covers all residents with changing needs$$,
  $$Reg 12$$,
  $$Handover records/checklist; spot-check of handover quality$$,
  26
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-05$$,
  $$Joint$$,
  $$A clear, documented process exists for transferring a resident between the residential and nursing parts of the service, including whether a new pre-admission assessment is triggered$$,
  $$Reg 9$$,
  $$Internal transfer procedure; assessment records triggered by transfer; resident/family involvement records$$,
  27
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SP-06$$,
  $$Joint$$,
  $$Each resident's current regulated activity (residential or nursing) is clearly and unambiguously recorded, so the correct staffing competency and evidence standards apply to their care$$,
  $$Reg 17$$,
  $$Resident register cross-referenced to regulated activity; care plan header confirms current activity$$,
  28
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-01$$,
  $$Residential$$,
  $$Safeguarding Adults policy is current, accessible and all staff are aware of it$$,
  $$Reg 13$$,
  $$Safeguarding policy reviewed within 12 months; sign-off record; staff awareness evidence$$,
  29
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-02$$,
  $$Residential$$,
  $$All staff have completed safeguarding adults training at the appropriate level$$,
  $$Reg 13$$,
  $$Training matrix showing completion dates and levels; certificates; refresher due dates$$,
  30
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-03$$,
  $$Residential$$,
  $$Safeguarding referrals are made correctly and promptly to the Local Authority; referral log maintained$$,
  $$Reg 13$$,
  $$Safeguarding referral log; evidence of timely reporting; Local Authority acknowledgement$$,
  31
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-01$$,
  $$Nursing$$,
  $$Safeguarding Adults policy is current, accessible and all staff are aware of it$$,
  $$Reg 13$$,
  $$Safeguarding policy; sign-off record; staff awareness evidence$$,
  32
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-02$$,
  $$Nursing$$,
  $$All nursing and care staff have completed safeguarding adults training at the appropriate level$$,
  $$Reg 13$$,
  $$Training matrix; certificates; refresher due dates$$,
  33
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SG-03$$,
  $$Nursing$$,
  $$Safeguarding referrals are made correctly and promptly; referral log maintained$$,
  $$Reg 13$$,
  $$Safeguarding referral log; Local Authority acknowledgement$$,
  34
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-01$$,
  $$Residential$$,
  $$Fire risk assessment is current and Personal Emergency Evacuation Plans (PEEPs) are in place for all residents$$,
  $$Reg 15$$,
  $$Fire risk assessment; individual PEEPs; fire drill records$$,
  35
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-02$$,
  $$Residential$$,
  $$Gas, electrical and water safety certificates, including legionella testing, are current$$,
  $$Reg 15$$,
  $$Gas safety certificate; electrical (EICR) certificate; legionella risk assessment and test records$$,
  36
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-03$$,
  $$Residential$$,
  $$Infection prevention and control policy is in place and the outbreak management plan has been tested$$,
  $$Reg 12$$,
  $$IPC policy; outbreak management plan; evidence of testing or drill$$,
  37
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-04$$,
  $$Residential$$,
  $$Nurse call / call bell system is tested regularly and response times are monitored$$,
  $$Reg 12$$,
  $$Call bell test log; response time monitoring records; maintenance records$$,
  38
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-05$$,
  $$Residential$$,
  $$Equipment (hoists, profiling beds, wheelchairs) is serviced and maintained to manufacturer schedule$$,
  $$Reg 15$$,
  $$Equipment service records; LOLER inspection certificates; maintenance log$$,
  39
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-01$$,
  $$Nursing$$,
  $$Fire risk assessment is current; PEEPs are in place reflecting clinical and mobility needs$$,
  $$Reg 15$$,
  $$Fire risk assessment; individual PEEPs; fire drill records$$,
  40
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-02$$,
  $$Nursing$$,
  $$Gas, electrical and water safety certificates, including legionella testing, are current$$,
  $$Reg 15$$,
  $$Gas safety certificate; EICR; legionella risk assessment$$,
  41
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-03$$,
  $$Nursing$$,
  $$Infection prevention and control policy is in place and the outbreak management plan has been tested, including for higher-acuity clinical procedures$$,
  $$Reg 12$$,
  $$IPC policy; outbreak management plan; evidence of testing for wound care/catheter care procedures$$,
  42
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-04$$,
  $$Nursing$$,
  $$Clinical equipment (hoists, profiling beds, pressure-relieving mattresses) is serviced and maintained$$,
  $$Reg 15$$,
  $$Equipment service records; LOLER inspection certificates$$,
  43
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-05$$,
  $$Nursing$$,
  $$Sharps and clinical waste disposal arrangements meet current guidance$$,
  $$Reg 12$$,
  $$Clinical waste contract; sharps disposal audit records$$,
  44
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-EI-07$$,
  $$Joint$$,
  $$Fire risk assessment and evacuation plan explicitly account for mixed acuity and mobility across both the residential and nursing parts of the building$$,
  $$Reg 15$$,
  $$Fire risk assessment; evacuation plan; PEEPs covering both areas of the building$$,
  45
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-01$$,
  $$Residential$$,
  $$Staffing rota reflects a dependency-based tool, not just a fixed staff-to-resident ratio$$,
  $$Reg 18$$,
  $$Dependency assessment tool; rota cross-referenced to dependency levels; review records$$,
  46
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-02$$,
  $$Residential$$,
  $$DBS and reference checks are completed for all staff before they start unsupervised work$$,
  $$Reg 19$$,
  $$DBS certificates; reference checks; pre-employment checklist$$,
  47
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-03$$,
  $$Residential$$,
  $$Night-time staffing levels are reviewed and justified against resident dependency$$,
  $$Reg 18$$,
  $$Night staffing review; dependency data; rationale documented$$,
  48
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-04$$,
  $$Residential$$,
  $$Supervision and appraisal are completed for all staff at agreed intervals$$,
  $$Reg 18$$,
  $$Supervision records; appraisal records; schedule of due dates$$,
  49
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-01$$,
  $$Nursing$$,
  $$Registered nurse coverage is maintained on every shift, with a contingency plan for short-notice absence$$,
  $$Reg 18$$,
  $$Nurse rota; contingency/escalation plan; agency usage log$$,
  50
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-02$$,
  $$Nursing$$,
  $$NMC registration is verified and revalidation dates are tracked for all registered nurses$$,
  $$Reg 18$$,
  $$NMC registration checks; revalidation tracker$$,
  51
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-03$$,
  $$Nursing$$,
  $$DBS and reference checks are completed for all staff before they start unsupervised work$$,
  $$Reg 19$$,
  $$DBS certificates; reference checks; pre-employment checklist$$,
  52
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-04$$,
  $$Nursing$$,
  $$Clinical supervision and appraisal are completed for all nursing staff at agreed intervals$$,
  $$Reg 18$$,
  $$Supervision records; appraisal records; schedule of due dates$$,
  53
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-SS-06$$,
  $$Joint$$,
  $$Staff are not cross-deployed between residential and nursing duties beyond their competency, training and registration$$,
  $$Reg 18$$,
  $$Rota cross-referenced to staff competency/registration; deployment policy$$,
  54
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-01$$,
  $$Residential$$,
  $$MAR charts are audited monthly for accuracy and gaps$$,
  $$Reg 12$$,
  $$MAR chart audit records; action log for identified gaps$$,
  55
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-02$$,
  $$Residential$$,
  $$Controlled drugs register is reconciled and checked by two staff$$,
  $$Reg 12$$,
  $$Controlled drugs register; reconciliation records; dual sign-off$$,
  56
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-03$$,
  $$Residential$$,
  $$Medicines storage, including fridge temperatures, is checked and logged daily$$,
  $$Reg 12$$,
  $$Fridge temperature log; medicines storage checks; escalation record for out-of-range readings$$,
  57
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-04$$,
  $$Residential$$,
  $$PRN medicine protocols are in place, person-specific and reviewed$$,
  $$Reg 12$$,
  $$PRN protocols; care plan cross-reference; review dates$$,
  58
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-01$$,
  $$Nursing$$,
  $$MAR charts are audited monthly for accuracy and gaps, including controlled drugs$$,
  $$Reg 12$$,
  $$MAR chart audit records; action log for identified gaps$$,
  59
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-02$$,
  $$Nursing$$,
  $$Controlled drugs register is reconciled and checked by two staff$$,
  $$Reg 12$$,
  $$Controlled drugs register; reconciliation records; dual sign-off$$,
  60
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-03$$,
  $$Nursing$$,
  $$Syringe driver and IV medicines administration is undertaken only by nurses with current competency sign-off$$,
  $$Reg 12$$,
  $$Competency sign-off records; syringe driver audit; training certificates$$,
  61
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$SAF-MT-04$$,
  $$Nursing$$,
  $$Medicines storage, including fridge temperatures and clinical room security, is checked daily and logged$$,
  $$Reg 12$$,
  $$Fridge temperature log; clinical room security checks$$,
  62
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$
  AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-01$$,
  $$Residential$$,
  $$Pre-admission and ongoing needs assessments cover physical, mental, social and communication needs$$,
  $$Reg 9$$,
  $$Needs assessment documentation; care plan cross-reference; review schedule$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-02$$,
  $$Residential$$,
  $$Care plans are reviewed at least monthly or after any significant change$$,
  $$Reg 9$$,
  $$Care plan review records; evidence of timely updates following changes in need$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-03$$,
  $$Residential$$,
  $$Communication needs are assessed and met in line with the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Communication needs assessment; accessible information records; specialist referrals$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-01$$,
  $$Nursing$$,
  $$Pre-admission and ongoing clinical needs assessments are completed by a registered nurse, covering physical, mental and clinical needs$$,
  $$Reg 9$$,
  $$Needs assessment documentation; care plan cross-reference$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-02$$,
  $$Nursing$$,
  $$Nursing care plans are reviewed at least monthly or after any significant clinical change$$,
  $$Reg 9$$,
  $$Care plan review records; evidence of timely updates$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-AN-03$$,
  $$Nursing$$,
  $$Communication needs are assessed and met in line with the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Communication needs assessment; accessible information records$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-01$$,
  $$Residential$$,
  $$Nutrition and hydration screening (e.g. MUST) is completed and reviewed regularly$$,
  $$Reg 14$$,
  $$MUST screening records; referrals to dietitian where indicated; monitoring documentation$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-02$$,
  $$Residential$$,
  $$Weight is monitored and unplanned weight loss is escalated to the GP or dietitian$$,
  $$Reg 14$$,
  $$Weight monitoring records; escalation log; dietitian referral letters$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-03$$,
  $$Residential$$,
  $$Service participates in a recognised quality accreditation or benchmarking scheme$$,
  $$Reg 17$$,
  $$Accreditation certificate; benchmarking reports; action plans from review$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-04$$,
  $$Residential$$,
  $$Resident outcomes (e.g. wellbeing, mobility, independence) are monitored and reviewed over time$$,
  $$Reg 17$$,
  $$Outcome tracking records; trend reports; evidence of action where outcomes decline$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-01$$,
  $$Nursing$$,
  $$Nutrition and hydration screening (e.g. MUST) is completed and reviewed regularly, with dietitian input where indicated$$,
  $$Reg 14$$,
  $$MUST screening records; dietitian referrals$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-02$$,
  $$Nursing$$,
  $$Weight and clinical markers (e.g. wound healing, pressure ulcer grading) are monitored and escalated appropriately$$,
  $$Reg 14$$,
  $$Weight monitoring records; wound assessment charts; escalation log$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-03$$,
  $$Nursing$$,
  $$Service participates in a recognised clinical quality benchmarking scheme (e.g. tissue viability benchmarking)$$,
  $$Reg 17$$,
  $$Benchmarking participation evidence; reports$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-EB-04$$,
  $$Nursing$$,
  $$Clinical outcomes (e.g. pressure ulcer incidence, falls rate) are monitored and reviewed over time$$,
  $$Reg 17$$,
  $$Outcome tracking records; trend reports$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-01$$,
  $$Residential$$,
  $$Residents are supported to access GP, dentist, optician, podiatry and other health appointments$$,
  $$Reg 9$$,
  $$Appointment records; health appointment log; evidence of follow-up$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-02$$,
  $$Residential$$,
  $$Health action plans are in place for residents with long-term conditions$$,
  $$Reg 9$$,
  $$Health action plans; condition-specific monitoring records$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-03$$,
  $$Residential$$,
  $$Activity and physical wellbeing programme supports healthier lifestyles$$,
  $$Reg 9$$,
  $$Activity programme; participation records; evidence of tailoring to individual ability$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-01$$,
  $$Nursing$$,
  $$Residents are supported to access GP, dentist, optician, podiatry and specialist clinical appointments$$,
  $$Reg 9$$,
  $$Appointment records; follow-up evidence$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-02$$,
  $$Nursing$$,
  $$Health action plans are in place for residents with long-term conditions, reviewed by nursing staff$$,
  $$Reg 9$$,
  $$Health action plans; condition-specific monitoring records$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-HL-03$$,
  $$Nursing$$,
  $$Activity and rehabilitation programme supports healthier outcomes where clinically appropriate$$,
  $$Reg 9$$,
  $$Activity/rehab programme; participation records$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-01$$,
  $$Residential$$,
  $$Consent is obtained and recorded before care and treatment is provided$$,
  $$Reg 11$$,
  $$Consent records; care plan sign-off; evidence of ongoing consent discussions$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-02$$,
  $$Residential$$,
  $$Mental Capacity Act assessments are completed where capacity is in doubt$$,
  $$Reg 11$$,
  $$MCA assessment records; decision-specific assessments; staff training evidence$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-03$$,
  $$Residential$$,
  $$Advocacy access is offered and recorded where needed$$,
  $$Reg 11$$,
  $$Advocacy referral records; resident/family awareness of advocacy rights$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-01$$,
  $$Nursing$$,
  $$Consent is obtained and recorded before clinical care and treatment is provided$$,
  $$Reg 11$$,
  $$Consent records; care plan sign-off$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-02$$,
  $$Nursing$$,
  $$Mental Capacity Act assessments are completed where capacity is in doubt, including for clinical decisions$$,
  $$Reg 11$$,
  $$MCA assessment records; decision-specific assessments$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$EFF-CT-03$$,
  $$Nursing$$,
  $$Advocacy access is offered and recorded where needed$$,
  $$Reg 11$$,
  $$Advocacy referral records$$,
  26
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$
  AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-01$$,
  $$Residential$$,
  $$Dignity audits are completed and used to improve practice$$,
  $$Reg 10$$,
  $$Dignity audit records; action plan; evidence of improvements made$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-02$$,
  $$Residential$$,
  $$Confidentiality of resident information is maintained and understood by staff$$,
  $$Reg 10$$,
  $$Confidentiality policy; staff training records; data handling spot checks$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-03$$,
  $$Residential$$,
  $$Staff respond promptly and kindly to residents expressing distress or discomfort$$,
  $$Reg 10$$,
  $$Care plan notes; observed practice records; family/resident feedback$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-01$$,
  $$Nursing$$,
  $$Dignity audits are completed, including during clinical procedures, and used to improve practice$$,
  $$Reg 10$$,
  $$Dignity audit records; action plan$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-02$$,
  $$Nursing$$,
  $$Confidentiality of clinical and personal information is maintained and understood by staff$$,
  $$Reg 10$$,
  $$Confidentiality policy; staff training records$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-KD-03$$,
  $$Nursing$$,
  $$Staff respond promptly and kindly to residents expressing distress, pain or discomfort$$,
  $$Reg 10$$,
  $$Care plan notes; observed practice records$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-PC-01$$,
  $$Residential$$,
  $$Care plans are individualised, not generic, and reflect resident preferences$$,
  $$Reg 9$$,
  $$Sample of individualised care plans; evidence of personal preference detail$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-PC-02$$,
  $$Residential$$,
  $$Cultural, religious and spiritual needs are identified and met$$,
  $$Reg 9$$,
  $$Care plan section on cultural/religious needs; evidence of needs being met$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-PC-01$$,
  $$Nursing$$,
  $$Nursing care plans are individualised, not generic, and reflect resident preferences alongside clinical needs$$,
  $$Reg 9$$,
  $$Sample of individualised care plans$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-PC-02$$,
  $$Nursing$$,
  $$Cultural, religious and spiritual needs are identified and met$$,
  $$Reg 9$$,
  $$Care plan section on cultural/religious needs$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Dementia Care$$,
  $$CAR-PC-04$$,
  $$Joint$$,
  $$Where Dementia Care is provided on both the residential and nursing sides, staff transferring a resident between sides maintain continuity of dementia-specific care approaches (e.g. life story information)$$,
  $$Reg 9$$,
  $$Life story document follows resident across transfer; handover records$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-01$$,
  $$Residential$$,
  $$Meaningful activities programme is in place and tailored to individual interests$$,
  $$Reg 9$$,
  $$Activity programme; individual participation records; resident feedback$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-02$$,
  $$Residential$$,
  $$Visiting policy supports open access for family and friends$$,
  $$Reg 9$$,
  $$Visiting policy; visitor log; evidence restrictions (where any) are proportionate and reviewed$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-03$$,
  $$Residential$$,
  $$DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to staff$$,
  $$Reg 9$$,
  $$DNACPR/ReSPECT forms; review dates; staff awareness of location and content$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-04$$,
  $$Residential$$,
  $$End of life and palliative care plans are in place, reflecting resident wishes$$,
  $$Reg 9$$,
  $$End of life care plans; evidence of resident/family involvement; review records$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-05$$,
  $$Residential$$,
  $$Advance care planning discussions are offered and documented$$,
  $$Reg 9$$,
  $$Advance care planning records; evidence discussions were offered, even if declined$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-01$$,
  $$Nursing$$,
  $$Meaningful activities programme is in place, adapted for residents with clinical or mobility limitations$$,
  $$Reg 9$$,
  $$Activity programme; participation records$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-02$$,
  $$Nursing$$,
  $$Visiting policy supports open access for family and friends$$,
  $$Reg 9$$,
  $$Visiting policy; visitor log$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-03$$,
  $$Nursing$$,
  $$DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to clinical staff$$,
  $$Reg 9$$,
  $$DNACPR/ReSPECT forms; review dates$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-04$$,
  $$Nursing$$,
  $$End of life and palliative nursing care plans are in place, reflecting resident wishes and clinical needs$$,
  $$Reg 9$$,
  $$End of life care plans; clinical review records$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$CAR-IC-05$$,
  $$Nursing$$,
  $$Advance care planning discussions, including clinical treatment preferences, are offered and documented$$,
  $$Reg 9$$,
  $$Advance care planning records$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$
  AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-01$$,
  $$Residential$$,
  $$Multi-disciplinary team input is sought and recorded for residents with complex needs$$,
  $$Reg 12$$,
  $$MDT meeting records; referral letters; evidence of input into care planning$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-02$$,
  $$Residential$$,
  $$Key worker system is in place so residents have a consistent named point of contact$$,
  $$Reg 9$$,
  $$Key worker allocation list; evidence of key worker involvement in care reviews$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-03$$,
  $$Residential$$,
  $$Transitions between levels of care within the home (e.g. to a dementia unit) are planned with the resident and family$$,
  $$Reg 9$$,
  $$Internal transition plan; resident/family involvement records; review of outcome$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-01$$,
  $$Nursing$$,
  $$Multi-disciplinary team input (GP, tissue viability, dietitian, physiotherapy) is sought and recorded for residents with complex clinical needs$$,
  $$Reg 12$$,
  $$MDT meeting records; referral letters$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-02$$,
  $$Nursing$$,
  $$Key worker / named nurse system is in place so residents have a consistent clinical point of contact$$,
  $$Reg 9$$,
  $$Key worker allocation list$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-03$$,
  $$Nursing$$,
  $$Transitions between levels of care within the home (e.g. residential to nursing bed) are planned with the resident and family$$,
  $$Reg 9$$,
  $$Internal transition plan; resident/family involvement records$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-CC-04$$,
  $$Joint$$,
  $$Residents and families are given clear information about which regulated activity (residential or nursing) currently applies to their care, and what would change if this changes$$,
  $$Reg 9$$,
  $$Admission information pack; resident/family communication records$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-01$$,
  $$Residential$$,
  $$Complaints policy is in place, accessible, and complaints are responded to within set timescales$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log with response dates; evidence of timescales met$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-02$$,
  $$Residential$$,
  $$Resident and relative meetings are held regularly and feedback is acted on$$,
  $$Reg 16$$,
  $$Meeting minutes; action log arising from feedback$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-03$$,
  $$Residential$$,
  $$Resident or relative satisfaction survey is conducted at least annually with results published$$,
  $$Reg 16$$,
  $$Survey results; published summary; action plan from findings$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-01$$,
  $$Nursing$$,
  $$Complaints policy is in place, accessible, and complaints are responded to within set timescales$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log with response dates$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-02$$,
  $$Nursing$$,
  $$Resident and relative meetings are held regularly and feedback is acted on$$,
  $$Reg 16$$,
  $$Meeting minutes; action log$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-LF-03$$,
  $$Nursing$$,
  $$Resident or relative satisfaction survey is conducted at least annually with results published$$,
  $$Reg 16$$,
  $$Survey results; published summary$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-01$$,
  $$Residential$$,
  $$Admission process is clear, timely and non-discriminatory$$,
  $$Reg 9$$,
  $$Admission policy; pre-admission checklist; evidence of equitable assessment$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-02$$,
  $$Residential$$,
  $$Premises are accessible, including step-free access, adapted bathrooms and clear signage$$,
  $$Reg 15$$,
  $$Accessibility audit; adaptation records; signage photographs$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-03$$,
  $$Residential$$,
  $$Information is available in accessible formats for residents with sensory or communication needs$$,
  $$Reg 9$$,
  $$Accessible format examples (large print, easy read, pictorial); Accessible Information Standard compliance$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-01$$,
  $$Nursing$$,
  $$Admission process, including clinical pre-assessment, is clear, timely and non-discriminatory$$,
  $$Reg 9$$,
  $$Admission policy; pre-admission checklist$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-02$$,
  $$Nursing$$,
  $$Premises are accessible, including step-free access and adapted clinical/bathing facilities$$,
  $$Reg 15$$,
  $$Accessibility audit; adaptation records$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-TA-03$$,
  $$Nursing$$,
  $$Information is available in accessible formats for residents with sensory or communication needs$$,
  $$Reg 9$$,
  $$Accessible format examples; Accessible Information Standard compliance$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-01$$,
  $$Residential$$,
  $$Equality monitoring data is collected and used to identify and address gaps in experience$$,
  $$Reg 9$$,
  $$Equality monitoring data; analysis of gaps; action plan$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-02$$,
  $$Residential$$,
  $$Interpreting and translation services are available for residents and families who need them$$,
  $$Reg 9$$,
  $$Interpreting service contract or arrangement; evidence of use where needed$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-03$$,
  $$Residential$$,
  $$Staff receive training on equality, diversity and the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Training matrix; certificates; refresher schedule$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-01$$,
  $$Nursing$$,
  $$Equality monitoring data is collected and used to identify and address gaps in experience$$,
  $$Reg 9$$,
  $$Equality monitoring data; action plan$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-02$$,
  $$Nursing$$,
  $$Interpreting and translation services are available for residents and families who need them$$,
  $$Reg 9$$,
  $$Interpreting service arrangement$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$RES-EE-03$$,
  $$Nursing$$,
  $$Staff receive training on equality, diversity and the Accessible Information Standard$$,
  $$Reg 9$$,
  $$Training matrix; certificates$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$
  AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-01$$,
  $$Residential$$,
  $$Service has a clear, documented vision and values, understood by staff$$,
  $$Reg 17$$,
  $$Vision and values statement; staff awareness evidence (induction, appraisal)$$,
  1
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-02$$,
  $$Residential$$,
  $$Staff feedback (e.g. surveys) is collected and used to shape strategic priorities$$,
  $$Reg 17$$,
  $$Staff survey results; evidence feedback influenced decisions$$,
  2
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-03$$,
  $$Residential$$,
  $$Registered manager succession and business sustainability plan is in place$$,
  $$Reg 17$$,
  $$Succession plan; business continuity/sustainability documentation$$,
  3
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-01$$,
  $$Nursing$$,
  $$Service has a clear, documented vision and values, understood by nursing and care staff$$,
  $$Reg 17$$,
  $$Vision and values statement; staff awareness evidence$$,
  4
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-02$$,
  $$Nursing$$,
  $$Staff feedback (e.g. surveys) is collected and used to shape strategic priorities$$,
  $$Reg 17$$,
  $$Staff survey results; evidence feedback influenced decisions$$,
  5
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-SD-03$$,
  $$Nursing$$,
  $$Registered manager and clinical lead succession / sustainability plan is in place$$,
  $$Reg 17$$,
  $$Succession plan; business continuity documentation$$,
  6
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-01$$,
  $$Residential$$,
  $$Equality, diversity and inclusion policy is in place and applied to recruitment, training and promotion$$,
  $$Reg 18$$,
  $$EDI policy; recruitment and promotion data; training records$$,
  7
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-02$$,
  $$Residential$$,
  $$Speak-up / whistleblowing arrangements are in place and staff are confident to use them$$,
  $$Reg 17$$,
  $$Whistleblowing policy; Freedom to Speak Up arrangements; staff survey results$$,
  8
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-03$$,
  $$Residential$$,
  $$Staff wellbeing support (e.g. occupational health, EAP, flexible working) is available$$,
  $$Reg 18$$,
  $$Wellbeing support documentation; uptake records; staff feedback$$,
  9
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-01$$,
  $$Nursing$$,
  $$Equality, diversity and inclusion policy is in place and applied to recruitment, training and promotion$$,
  $$Reg 18$$,
  $$EDI policy; recruitment and promotion data$$,
  10
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-02$$,
  $$Nursing$$,
  $$Speak-up / whistleblowing arrangements are in place and staff are confident to use them$$,
  $$Reg 17$$,
  $$Whistleblowing policy; Freedom to Speak Up arrangements$$,
  11
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-WE-03$$,
  $$Nursing$$,
  $$Staff wellbeing support is available, including for nursing staff managing clinical and emotional demands$$,
  $$Reg 18$$,
  $$Wellbeing support documentation; uptake records$$,
  12
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-01$$,
  $$Residential$$,
  $$Registered manager is in post, or robust interim cover arrangements are in place$$,
  $$Reg 17$$,
  $$Registered manager registration; interim cover plan where applicable$$,
  13
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-02$$,
  $$Residential$$,
  $$Fit and Proper Person Requirement checks are completed for the registered manager and directors$$,
  $$Reg 19$$,
  $$FPPR checks; DBS; references; ongoing monitoring records$$,
  14
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-03$$,
  $$Residential$$,
  $$Leadership development and support (e.g. mentoring, training) is available to managers$$,
  $$Reg 17$$,
  $$Leadership development plan; training records; mentoring arrangements$$,
  15
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-01$$,
  $$Nursing$$,
  $$Registered manager is in post, with clinical lead / senior nurse support structure$$,
  $$Reg 17$$,
  $$Registered manager registration; clinical lead structure$$,
  16
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-02$$,
  $$Nursing$$,
  $$Fit and Proper Person Requirement checks are completed for the registered manager and directors$$,
  $$Reg 19$$,
  $$FPPR checks; DBS; references$$,
  17
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-03$$,
  $$Nursing$$,
  $$Leadership development and support is available to managers and senior nurses$$,
  $$Reg 17$$,
  $$Leadership development plan; training records$$,
  18
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-CL-04$$,
  $$Joint$$,
  $$The registered manager arrangement (a single manager covering both regulated activities, or separate managers per activity) is clearly defined, and competency is evidenced for whichever activities they are responsible for$$,
  $$Reg 17$$,
  $$Registered manager registration records; evidence of competency across responsible activities$$,
  19
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-01$$,
  $$Residential$$,
  $$Statement of purpose is current and accurately reflects the service provided$$,
  $$Reg 17$$,
  $$Statement of purpose; date of last review; evidence it matches actual service provision$$,
  20
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-02$$,
  $$Residential$$,
  $$Quality assurance audit schedule is in place covering care plans, medicines, environment and infection control$$,
  $$Reg 17$$,
  $$Audit schedule; completed audits; action plans arising from findings$$,
  21
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-03$$,
  $$Residential$$,
  $$Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are reviewed$$,
  $$Reg 17$$,
  $$DSPT submission confirmation; cyber security policy; review records$$,
  22
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-04$$,
  $$Residential$$,
  $$Business continuity plan is in place for emergencies (fire, flood, power failure, pandemic) and staff know how to use it$$,
  $$Reg 17$$,
  $$Business continuity plan; staff awareness evidence; drill or test records$$,
  23
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-05$$,
  $$Residential$$,
  $$Notifications and statutory data are submitted to CQC and other bodies as required$$,
  $$Reg 17$$,
  $$Notification log; submission confirmations; evidence of timeliness$$,
  24
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-01$$,
  $$Nursing$$,
  $$Statement of purpose is current and accurately reflects nursing provision$$,
  $$Reg 17$$,
  $$Statement of purpose; date of last review$$,
  25
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-02$$,
  $$Nursing$$,
  $$Quality assurance audit schedule covers care plans, medicines, clinical procedures, environment and infection control$$,
  $$Reg 17$$,
  $$Audit schedule; completed audits; action plans$$,
  26
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-03$$,
  $$Nursing$$,
  $$Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are reviewed$$,
  $$Reg 17$$,
  $$DSPT submission confirmation; cyber security policy$$,
  27
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-04$$,
  $$Nursing$$,
  $$Business continuity plan is in place for emergencies, including clinical continuity (e.g. medicines supply, nurse staffing)$$,
  $$Reg 17$$,
  $$Business continuity plan; staff awareness evidence$$,
  28
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-05$$,
  $$Nursing$$,
  $$Notifications and statutory data are submitted to CQC and other bodies as required$$,
  $$Reg 17$$,
  $$Notification log; submission confirmations$$,
  29
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-06$$,
  $$Joint$$,
  $$Statement of Purpose accurately describes both regulated activities provided at this location and how the boundary between them is managed$$,
  $$Reg 12$$,
  $$Statement of Purpose; date of last review; description of both activities$$,
  30
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-07$$,
  $$Joint$$,
  $$Compliance declarations and any CQC notifications correctly identify which regulated activity they relate to$$,
  $$Reg 17$$,
  $$Notification log; declarations of compliance per regulated activity$$,
  31
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-08$$,
  $$Joint$$,
  $$Governance and quality assurance oversight covers both regulated activities equally, with no evidence either service is monitored less rigorously than the other$$,
  $$Reg 17$$,
  $$Audit schedule covering both activities; governance meeting minutes$$,
  32
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-GM-09$$,
  $$Joint$$,
  $$CQC registration certificate and conditions correctly list both regulated activities and reflect the current scope of service$$,
  $$Reg 17$$,
  $$Registration certificate; conditions of registration$$,
  33
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-01$$,
  $$Residential$$,
  $$Service engages with the local community (e.g. schools, faith groups, volunteers)$$,
  $$Reg 17$$,
  $$Community engagement records; volunteer agreements; event records$$,
  34
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-02$$,
  $$Residential$$,
  $$Partnership working with local health and social care services is evidenced$$,
  $$Reg 17$$,
  $$Partnership agreements; joint working records; meeting minutes$$,
  35
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-03$$,
  $$Residential$$,
  $$Good practice and learning are shared with other providers or sector networks$$,
  $$Reg 17$$,
  $$Evidence of shared learning; network membership; case study or presentation records$$,
  36
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-01$$,
  $$Nursing$$,
  $$Service engages with the local community$$,
  $$Reg 17$$,
  $$Community engagement records$$,
  37
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-02$$,
  $$Nursing$$,
  $$Partnership working with local health and clinical services (community nursing, hospital, palliative care teams) is evidenced$$,
  $$Reg 17$$,
  $$Partnership agreements; joint working records$$,
  38
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-PC-03$$,
  $$Nursing$$,
  $$Good practice and clinical learning are shared with other providers or sector networks$$,
  $$Reg 17$$,
  $$Evidence of shared learning; network membership$$,
  39
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-01$$,
  $$Residential$$,
  $$Service has identified at least one active quality improvement project with measurable outcomes$$,
  $$Reg 17$$,
  $$QI project documentation; baseline and outcome data$$,
  40
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-02$$,
  $$Residential$$,
  $$Staff are supported and encouraged to contribute ideas for improvement$$,
  $$Reg 17$$,
  $$Suggestion scheme records; evidence ideas have been implemented$$,
  41
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-03$$,
  $$Residential$$,
  $$Service engages with research, pilots or sector innovation where relevant$$,
  $$Reg 17$$,
  $$Evidence of research/pilot participation; outcomes or learning shared$$,
  42
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-01$$,
  $$Nursing$$,
  $$Service has identified at least one active clinical quality improvement project with measurable outcomes$$,
  $$Reg 17$$,
  $$QI project documentation; baseline and outcome data$$,
  43
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-02$$,
  $$Nursing$$,
  $$Staff are supported and encouraged to contribute ideas for improvement$$,
  $$Reg 17$$,
  $$Suggestion scheme records$$,
  44
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$,
  $$WEL-IL-03$$,
  $$Nursing$$,
  $$Service engages with clinical research, pilots or sector innovation where relevant$$,
  $$Reg 17$$,
  $$Evidence of research/pilot participation$$,
  45
FROM public.klo_items ki
JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$
  AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;