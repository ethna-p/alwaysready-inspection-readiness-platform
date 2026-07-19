-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: ARBD Specialist Care Home checklist items
-- 86 items derived from the Residential Care Home baseline, adapted for the
-- ARBD/Korsakoff specialist context using the Serenita CQC inspection report
-- (Good, October 2018) as the primary source document.
--
-- Key ARBD-specific additions vs the Residential baseline:
--   • Substance-related incidents and absconding tracked in safety reviews
--   • Absconding / community access risk assessment (SAF-MR-03)
--   • Behaviour support plans for challenging behaviour (SAF-MR-04)
--   • ARBD / Korsakoff awareness in staff training (SAF-SS-01)
--   • Thiamine supplementation documented (EFF-EB-03)
--   • Support plans include psychiatric history and relapse risk factors (EFF-AN-01)
--   • Fluctuating capacity explicitly addressed in MCA assessments (EFF-CT-02)
--   • Community mental health team included in MDT (SAF-SP-03, RES-CC-01)
--   • Key worker relationship and rehabilitation goals (RES-CC-02)
--   • Enablement/step-down programme documented (SAF-SP-04, RES-CC-03)
--   • Dry house / abstinence policy (WEL-GM-06)
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════
-- SAFE
-- ══════════════════════════════════════════════════════════════════

-- ── Safety culture (5) ────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-01$$, NULL,
  $$Accident, incident and near-miss log maintained and reviewed for trends at least monthly$$,
  $$Reg 12$$,
  $$Incident log; monthly trend review minutes; action log$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-02$$, NULL,
  $$Duty of Candour policy is in place, staff understand it and it is applied openly and honestly whenever something goes wrong$$,
  $$Reg 20$$,
  $$Duty of Candour policy; staff awareness evidence; records of open disclosure$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-03$$, NULL,
  $$Substance-related incidents, absconding episodes and incidents involving challenging behaviour are reviewed monthly alongside standard incident categories, with documented learning$$,
  $$Reg 12$$,
  $$Incident log; monthly review minutes showing ARBD-specific categories; evidence of changed practice$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-04$$, NULL,
  $$Staff feel able to raise safety concerns without fear of reprisal; whistleblowing policy is in place and known to all staff$$,
  $$Reg 13$$,
  $$Whistleblowing policy; staff awareness records$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-05$$, NULL,
  $$Lessons learned from incidents are shared with staff and resulting changes to practice are documented$$,
  $$Reg 12$$,
  $$Staff meeting minutes; handover records; evidence of practice change following incident review$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Managing risks during care and treatment (5) ─────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$Falls risk assessments completed on admission and reviewed regularly; ataxia and gait disturbance associated with ARBD are identified and managed; post-fall review documented$$,
  $$Reg 12$$,
  $$Falls risk assessments; post-fall review records; evidence of ataxia-specific management$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$Moving and handling risk assessments and care plans are in place; equipment is identified and maintained$$,
  $$Reg 12$$,
  $$Moving and handling risk assessments; equipment service records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$Absconding and community access risk assessment is completed for each resident; the management plan balances safety with the promotion of independence$$,
  $$Reg 12$$,
  $$Community access / absconding risk assessment per resident; management plan; review records$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Behaviour support plans are in place for residents who present with challenging behaviour associated with ARBD or Korsakoff's syndrome$$,
  $$Reg 12$$,
  $$Behaviour support plans; evidence of staff training in challenging behaviour; review records$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-05$$, NULL,
  $$Bed rails and window restrictors are risk-assessed and checked for safe use$$,
  $$Reg 12$$,
  $$Bed rail risk assessments; window restrictor checks; MCA documentation where relevant$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Safe systems, pathways and transitions (4) ───────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SP-01$$, NULL,
  $$Pre-admission assessment is completed before or on admission and includes: ARBD history, psychiatric background, substance misuse history, relapse risk factors and current capacity status$$,
  $$Reg 9$$,
  $$Pre-admission assessment document; completed ARBD/psychiatric history; capacity status at admission$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SP-02$$, NULL,
  $$Hospital transfer documentation (clinical and medication summary, care needs) accompanies residents on transfer$$,
  $$Reg 12$$,
  $$Hospital transfer records; evidence of documentation sent with resident$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SP-03$$, NULL,
  $$GP, community mental health team and other multi-disciplinary input is documented and acted upon; referral pathways are clear and used appropriately$$,
  $$Reg 12$$,
  $$MDT referral letters; CMHT correspondence; GP visit records; evidence of recommendations acted upon$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SP-04$$, NULL,
  $$Community step-down and reintegration transitions are planned with the resident and relevant agencies; the enablement programme stage is documented and reviewed$$,
  $$Reg 9$$,
  $$Transition plans; enablement programme records; step-down reviews; agency correspondence$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Safeguarding (3) ─────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$Safeguarding Adults policy is current, accessible and all staff are aware of it and know how to make a referral$$,
  $$Reg 13$$,
  $$Safeguarding policy; staff training records; referral pathway documentation$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$All staff have completed safeguarding adults training at the appropriate level, with refresher training at agreed intervals$$,
  $$Reg 13$$,
  $$Safeguarding training matrix; refresher completion records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$Safeguarding referrals are made correctly and promptly to the Local Authority; records of referrals, outcomes and any resulting actions are maintained$$,
  $$Reg 13$$,
  $$Safeguarding referral log; outcome records; action plans$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Safe environments and infection prevention and control (5) ───

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-EI-01$$, NULL,
  $$Fire risk assessment is current and Personal Emergency Evacuation Plans (PEEPs) are in place for all residents$$,
  $$Reg 12$$,
  $$Current fire risk assessment; PEEPs for each resident; fire drill records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-EI-02$$, NULL,
  $$Gas, electrical and water safety certificates, including legionella testing, are current$$,
  $$Reg 12$$,
  $$Gas safety certificate; electrical installation condition report; legionella risk assessment and water testing records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-EI-03$$, NULL,
  $$Infection prevention and control policy is in place and the outbreak management procedure is known to staff; PPE is available and used correctly$$,
  $$Reg 12$$,
  $$IPC policy; PPE availability records; staff training records; outbreak management procedure$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-EI-04$$, NULL,
  $$Nurse call / call bell system is tested regularly and response times are monitored$$,
  $$Reg 12$$,
  $$Call bell test records; response time monitoring logs$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-EI-05$$, NULL,
  $$Equipment (hoists, profiling beds, wheelchairs) is serviced and maintained to manufacturer requirements$$,
  $$Reg 12$$,
  $$Equipment service records; maintenance logs; LOLER certificates where applicable$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Safe staffing (4) ────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SS-01$$, NULL,
  $$Staffing rota reflects ARBD specialist care needs; sufficient staff with ARBD and Korsakoff syndrome awareness training are on duty on every shift$$,
  $$Reg 18$$,
  $$Staff rota; ARBD awareness training matrix; dependency assessment records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SS-02$$, NULL,
  $$DBS and reference checks are completed for all staff before they start unsupervised work at the service$$,
  $$Reg 19$$,
  $$DBS check records; employment reference records; pre-employment check log$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SS-03$$, NULL,
  $$Night-time staffing levels are reviewed and justified against resident dependency and risk levels$$,
  $$Reg 18$$,
  $$Night rota; dependency assessment; justification records$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SS-04$$, NULL,
  $$Supervision and appraisal are completed for all staff at agreed intervals$$,
  $$Reg 18$$,
  $$Supervision records; appraisal records; training needs identified and acted upon$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ── Safe medicines and treatments (4) ───────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-01$$, NULL,
  $$MAR charts or electronic medicine administration records (EMAR) are audited monthly for accuracy and gaps; staff competency in medicine administration is checked annually$$,
  $$Reg 12$$,
  $$MAR / EMAR audit records; monthly stock check; annual competency check records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-02$$, NULL,
  $$Controlled drugs register is reconciled and checked by two staff$$,
  $$Reg 12$$,
  $$Controlled drugs register; dual-signature records; reconciliation log$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-03$$, NULL,
  $$Medicines storage, including fridge temperatures, is checked and logged daily; prescribed supplements including thiamine (vitamin B1) are stored and administered safely$$,
  $$Reg 12$$,
  $$Daily temperature logs; medicine storage audit; prescribed supplement administration records$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-04$$, NULL,
  $$PRN medicine protocols are in place, person-specific and reviewed regularly$$,
  $$Reg 12$$,
  $$PRN protocols per resident; review records; evidence of appropriate and consistent use$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$ ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- EFFECTIVE
-- ══════════════════════════════════════════════════════════════════

-- ── Assessing needs (3) ──────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-AN-01$$, NULL,
  $$Support plans are completed before or on admission and include: psychiatric history, relapse risk factors, substance misuse background, self-care capacity and current physical and mental health needs$$,
  $$Reg 9$$,
  $$Admission support plan; psychiatric history documentation; substance misuse history; relapse risk assessment$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-AN-02$$, NULL,
  $$Support plans are reviewed at least monthly or after any significant change in the person's needs or capacity$$,
  $$Reg 9$$,
  $$Monthly review records; evidence of plan updates following changes; review sign-off$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-AN-03$$, NULL,
  $$Communication and cognitive needs are assessed; confabulation, memory difficulties and their impact on care planning and capacity assessment are documented and communicated to staff$$,
  $$Reg 9$$,
  $$Communication needs assessment; cognitive assessment records; staff briefing notes on confabulation and memory impairment$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

-- ── Evidence-based care and equitable outcomes (4) ───────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-EB-01$$, NULL,
  $$Nutrition and hydration screening is completed and reviewed monthly; any concerns are escalated to the GP or dietitian; specialist dietary needs (e.g. diabetes) are provided for$$,
  $$Reg 14$$,
  $$MUST or equivalent screening tool; monthly nutritional assessment records; dietitian referrals; diabetic diet records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-EB-02$$, NULL,
  $$Weight is monitored and unplanned weight loss is escalated to the GP or dietitian promptly$$,
  $$Reg 14$$,
  $$Weight monitoring records; GP referral letters for weight loss; dietitian input$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-EB-03$$, NULL,
  $$Prescribed thiamine (vitamin B1) supplementation is documented, administered correctly and its effectiveness is monitored$$,
  $$Reg 12$$,
  $$Prescription records for thiamine; MAR / EMAR administration records; clinical review notes$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-EB-04$$, NULL,
  $$Resident outcomes, including rehabilitation progress and wellbeing, are monitored and reviewed against each person's individual enablement goals$$,
  $$Reg 9$$,
  $$Enablement programme records; outcome reviews; progress notes; goal-setting documentation$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

-- ── Supporting people to live healthier lives (3) ────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$Residents are supported to access GP, dentist, optician, podiatry, community mental health team and substance misuse services as needed; appointments are arranged and attended$$,
  $$Reg 9$$,
  $$Appointment records; GP correspondence; CMHT correspondence; substance misuse service referrals$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$Health action plans are in place for residents with long-term conditions associated with ARBD, such as diabetes, liver disease or hypertension$$,
  $$Reg 9$$,
  $$Health action plans; long-term condition management records; GP / specialist correspondence$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$Activity programme promotes cognitive stimulation, physical wellbeing and rehabilitation goals; access to the community and social events is supported$$,
  $$Reg 9$$,
  $$Activity programme; individual activity plans; cognitive stimulation records; community access log$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

-- ── Consent to care and treatment (3) ───────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Consent is obtained and recorded before care and treatment is provided$$,
  $$Reg 11$$,
  $$Signed consent records; verbal consent records; consent to share information forms$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$Mental Capacity Act assessments are completed where capacity is in doubt; in ARBD and Korsakoff's syndrome capacity may fluctuate and assessments are reviewed regularly; DoLS applications are made where appropriate$$,
  $$Reg 11$$,
  $$MCA assessment records; best interest decisions; DoLS applications and authorisations; capacity review dates$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-CT-03$$, NULL,
  $$Advocacy access is offered and recorded where needed; residents are informed of their right to independent advocacy$$,
  $$Reg 9$$,
  $$Advocacy referrals; information provided to residents; records of advocacy involvement$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$ ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- CARING
-- ══════════════════════════════════════════════════════════════════

-- ── Kindness, compassion and dignity (3) ─────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-KD-01$$, NULL,
  $$Dignity audits are completed and used to improve practice$$,
  $$Reg 10$$,
  $$Dignity audit records; evidence of improvements made; audit schedule$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-KD-02$$, NULL,
  $$Confidentiality of resident information, including substance misuse history and psychiatric background, is maintained and understood by all staff$$,
  $$Reg 10$$,
  $$Confidentiality policy; staff training records; evidence of discreet information handling (e.g. private handovers)$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-KD-03$$, NULL,
  $$Staff respond promptly and kindly to residents expressing distress or discomfort$$,
  $$Reg 10$$,
  $$Observation records; resident feedback; staff training in person-centred approaches$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

-- ── Person-centred care (2) ──────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-PC-01$$, NULL,
  $$Support plans are individualised and include the person's life history, personal goals, rehabilitation aspirations and preferences for daily living$$,
  $$Reg 9$$,
  $$Individualised support plans; life history records; goal-setting documentation; evidence of resident involvement in planning$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-PC-02$$, NULL,
  $$Cultural, religious and spiritual needs are identified and met$$,
  $$Reg 9$$,
  $$Support plans showing cultural and spiritual needs; records of needs being met$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

-- ── Independence, choice and control (5) ────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Meaningful activities and cognitive stimulation programme is in place, tailored to individual abilities and rehabilitation stage; access to community activities and events is supported$$,
  $$Reg 9$$,
  $$Activity programme; individual activity plans; community access records; cognitive stimulation records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$Visiting policy supports open access for family and friends$$,
  $$Reg 9$$,
  $$Visiting policy; evidence of family and friend visits; any restrictions documented with rationale$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-03$$, NULL,
  $$DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to staff$$,
  $$Reg 9$$,
  $$DNACPR / ReSPECT forms; evidence of GP involvement; review dates$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-04$$, NULL,
  $$End of life and palliative care plans are in place, reflecting each resident's wishes$$,
  $$Reg 9$$,
  $$End of life care plans; evidence of resident preferences recorded; palliative care referrals$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-05$$, NULL,
  $$Advance care planning discussions are offered and documented; particular care is taken where residents have fluctuating capacity$$,
  $$Reg 9$$,
  $$Advance care planning records; evidence of discussions held; capacity review linked to ACP$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$ ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- RESPONSIVE
-- ══════════════════════════════════════════════════════════════════

-- ── Care provision, integration and continuity (3) ───────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-CC-01$$, NULL,
  $$Multi-disciplinary team input, including community mental health team, substance misuse services and GP, is sought and recorded for residents with complex needs$$,
  $$Reg 9$$,
  $$MDT meeting records; CMHT and substance misuse correspondence; GP referral records; evidence of recommendations acted upon$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-CC-02$$, NULL,
  $$Key worker system is in place: each resident has a named key worker who maintains the keywork relationship, monitors rehabilitation progress and advocates for their needs$$,
  $$Reg 9$$,
  $$Named key worker records; keywork session notes; rehabilitation progress reviews$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-CC-03$$, NULL,
  $$Community step-down and reintegration transitions are planned with the resident, their family and relevant agencies; the enablement programme stage is documented and reviewed$$,
  $$Reg 9$$,
  $$Transition plans; enablement stage records; agency correspondence; discharge planning minutes$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

-- ── Listening to and responding to feedback (3) ──────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-LF-01$$, NULL,
  $$Complaints policy is in place, accessible and complaints are responded to within the timescale specified in the policy$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log; evidence of responses within timescale; outcomes and learning$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-LF-02$$, NULL,
  $$Resident meetings are held regularly; engagement approaches take into account cognitive and memory difficulties; outcomes are acted upon$$,
  $$Reg 9$$,
  $$Resident meeting minutes; evidence of accessible format or adapted engagement; evidence of actions taken$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-LF-03$$, NULL,
  $$Resident satisfaction is sought at least annually and results are used to improve the service$$,
  $$Reg 17$$,
  $$Satisfaction survey or equivalent; analysis of results; evidence of improvements made$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

-- ── Timely and equitable access (3) ─────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-TA-01$$, NULL,
  $$Admission process is clear, timely and non-discriminatory; includes an ARBD-specific pre-admission assessment$$,
  $$Reg 9$$,
  $$Admission policy; pre-admission assessment tool; equality monitoring at admission$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-TA-02$$, NULL,
  $$Premises are accessible, including step-free access, adapted bathrooms and clear signage$$,
  $$Reg 15$$,
  $$Premises accessibility audit; adapted bathroom records; signage review$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-TA-03$$, NULL,
  $$Information is available in accessible formats for residents with cognitive impairment or communication difficulties; posters and written materials use simple, clear language$$,
  $$Reg 9$$,
  $$Accessible information policy; examples of adapted materials; evidence of communication support provided$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

-- ── Equity in experiences (3) ────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-EE-01$$, NULL,
  $$Equality monitoring data is collected and used to identify and address gaps in equitable care$$,
  $$Reg 9$$,
  $$Equality monitoring records; analysis of outcomes by protected characteristic; evidence of action taken$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-EE-02$$, NULL,
  $$Interpreting and translation services are available for residents and families who need them$$,
  $$Reg 9$$,
  $$Interpreting and translation provision records; evidence of use where needed$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-EE-03$$, NULL,
  $$Staff receive training on equality, diversity and the specific needs and vulnerabilities of the ARBD population$$,
  $$Reg 18$$,
  $$Equality and diversity training records; ARBD-specific training matrix; evidence of training applied in practice$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$ ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- WELL-LED
-- ══════════════════════════════════════════════════════════════════

-- ── Strategic direction (3) ──────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-SD-01$$, NULL,
  $$Service has a clear, documented vision and values that reflect the specialist ARBD enablement and rehabilitation focus, and these are understood by staff$$,
  $$Reg 17$$,
  $$Statement of purpose; vision and values document; evidence of staff awareness$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-SD-02$$, NULL,
  $$Staff feedback is collected and used to shape strategic priorities$$,
  $$Reg 17$$,
  $$Staff survey results; staff meeting minutes; evidence of feedback acted upon$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-SD-03$$, NULL,
  $$Registered manager succession and business sustainability plan is in place$$,
  $$Reg 17$$,
  $$Succession plan; interim management arrangements; business continuity evidence$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

-- ── Workforce equity and culture (3) ────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-WE-01$$, NULL,
  $$Equality, diversity and inclusion policy is in place and applied to recruitment, retention and management$$,
  $$Reg 17$$,
  $$EDI policy; recruitment records; evidence of EDI in HR practices$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-WE-02$$, NULL,
  $$Speak-up / whistleblowing arrangements are in place and staff are confident to use them$$,
  $$Reg 17$$,
  $$Whistleblowing policy; speak-up guardian arrangements; evidence of staff awareness$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-WE-03$$, NULL,
  $$Staff wellbeing support (e.g. occupational health, EAP, flexible working) is available and signposted$$,
  $$Reg 17$$,
  $$Wellbeing policy; EAP details; evidence of staff awareness of available support$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

-- ── Capable and compassionate leaders (3) ───────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-CL-01$$, NULL,
  $$Registered manager is in post, or robust interim cover arrangements are in place and notified to CQC$$,
  $$Reg 17$$,
  $$CQC registration certificate; interim management notification records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-CL-02$$, NULL,
  $$Fit and Proper Person Requirement checks are completed for the registered manager and any directors or responsible individuals$$,
  $$Reg 5$$,
  $$FPPR records; DBS checks for managers; reference and identity checks$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-CL-03$$, NULL,
  $$Leadership development and support (e.g. mentoring, training) is available to managers$$,
  $$Reg 17$$,
  $$Manager training records; mentoring arrangements; evidence of ongoing leadership development$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

-- ── Governance and management (6) ───────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$Statement of purpose is current and accurately reflects the specialist ARBD service provided, including the enablement model$$,
  $$Reg 17$$,
  $$Current statement of purpose; CQC registration details; evidence of last review date$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Quality assurance audit schedule covers: care plans, medicines, ARBD-specific risk assessments, environment, health and safety and staffing$$,
  $$Reg 17$$,
  $$Audit schedule; completed audit records; action plans arising from audits; area manager oversight records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are in place$$,
  $$Reg 17$$,
  $$DSPT submission evidence; cyber security policy; staff data security training records$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-04$$, NULL,
  $$Business continuity plan is in place for emergencies (fire, flood, power failure, key staff absence)$$,
  $$Reg 17$$,
  $$Business continuity plan; evidence of testing or review; contact lists$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-05$$, NULL,
  $$Notifications and statutory data are submitted to CQC and other bodies as required and on time$$,
  $$Reg 17$$,
  $$CQC notification log; evidence of timely submissions; statutory returns records$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-06$$, NULL,
  $$Dry house / alcohol abstinence policy is in place, documented, communicated to all residents on admission and understood by all staff$$,
  $$Reg 17$$,
  $$Alcohol abstinence policy; evidence of policy communicated to residents (e.g. in welcome pack); staff awareness records$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

-- ── Partnerships and communities (3) ────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-PC-01$$, NULL,
  $$Service engages with the local community to support social inclusion and community reintegration for residents$$,
  $$Reg 17$$,
  $$Community engagement records; community trip logs; partnerships with local groups or clubs$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-PC-02$$, NULL,
  $$Partnership working with local health, social care, community mental health and substance misuse services is evidenced$$,
  $$Reg 17$$,
  $$Partnership agreements or protocols; correspondence with local authority, CMHT and substance misuse services; joint working records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-PC-03$$, NULL,
  $$Good practice and learning are shared with other providers or sector networks$$,
  $$Reg 17$$,
  $$Evidence of participation in networks; shared learning records; peer review activity$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

-- ── Improvement, innovation and learning (3) ─────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-IL-01$$, NULL,
  $$Service has identified at least one active quality improvement project with measurable outcomes$$,
  $$Reg 17$$,
  $$QI project documentation; baseline and progress data; outcomes measured$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-IL-02$$, NULL,
  $$Staff are supported and encouraged to contribute ideas for improvement$$,
  $$Reg 17$$,
  $$Staff meeting minutes; idea-sharing mechanisms; evidence of staff suggestions acted upon$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-IL-03$$, NULL,
  $$Service engages with ARBD specialist networks, research or sector innovation where available$$,
  $$Reg 17$$,
  $$Evidence of engagement with ARBD networks or clinical specialists; research or pilot participation records$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$ ON CONFLICT DO NOTHING;
