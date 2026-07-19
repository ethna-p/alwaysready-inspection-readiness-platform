-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Dementia sub-service items for Nursing Home and Dual-Registered
--
-- Nursing Home items are tailored for a clinical nursing context — covert
-- medicines are nurse-led (NMC accountability), SALT is clinically managed,
-- and dementia training sits alongside nursing competency frameworks.
--
-- Dual-Registered items use sub_service = 'Dementia' (the overlay value) and
-- apply Joint to both registered parts of the service. The Core items for
-- Dual-Registered use sub_service = 'Residential' | 'Nursing' | 'Joint' —
-- the checklist query handles these separately.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- NURSING HOME — Dementia sub-service items
-- ════════════════════════════════════════════════════════════════════════════

-- DEM-SAF-01: Wandering / absconding risk
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$Wandering and absconding risk assessment is in place for each resident living with dementia; the management plan balances safety with dignity and independence and is reviewed following any incident$$,
  $$Reg 12$$,
  $$Individual wandering / absconding risk assessments; management plans; door security records; nursing review notes following any incident$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$;

-- DEM-SAF-02: Covert medicines (nurse-led in a nursing home)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a resident lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the prescriber and reviewed regularly; registered nurses take accountability for covert administration decisions$$,
  $$Reg 12$$,
  $$Covert medicine protocols per resident; MCA best interest decision records; prescriber authorisation; NMC-accountable nursing records; MAR / EMAR showing covert administration$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$;

-- DEM-SAF-03: Dementia-specific staff training
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$All staff — including registered nurses — receive dementia-specific training covering types of dementia, communication approaches, behaviour support and person-centred care; training sits alongside nursing competency frameworks$$,
  $$Reg 18$$,
  $$Dementia training matrix; training certificates or records; evidence of dementia training integrated into nursing competency assessments; refresher records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$;

-- DEM-EFF-01: Cognitive baseline in care plans
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Nursing care plans document the type and date of dementia diagnosis, current cognitive baseline (e.g. MMSE or ACE-R score) and any changes in cognition; changes are acted upon and escalated by the nursing team$$,
  $$Reg 9$$,
  $$Nursing care plans with dementia diagnosis details; cognitive assessment records; evidence of nursing-led escalation when cognition deteriorates (e.g. GP referral, medication review)$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$;

-- DEM-EFF-02: SALT / swallowing (clinically managed)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$SALT assessment is arranged for residents living with dementia who present with dysphagia or swallowing difficulties; outcomes are documented in nursing care plans and implemented by nursing and kitchen staff$$,
  $$Reg 14$$,
  $$SALT referral records; SALT assessment outcomes; modified diet / texture guidance in nursing care plans; evidence of nursing oversight of SALT recommendations$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$;

-- DEM-EFF-03: MCA / DoLS
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$MCA assessments are completed for residents living with dementia where capacity is in doubt; capacity is assessed decision-specifically and reviewed when cognition changes; DoLS applications are submitted, tracked and renewed before expiry$$,
  $$Reg 11$$,
  $$MCA assessment records per decision; best interest meeting minutes; DoLS application and authorisation records; system for tracking DoLS expiry dates$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$;

-- DEM-EFF-04: Dementia-friendly environment
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$The environment supports residents living with dementia through evidence-based design features including contrasting colours, picture-format signage, sensory areas and room individualisation$$,
  $$Reg 15$$,
  $$Environmental audit against dementia-friendly design principles; photographs or walkthrough evidence; evidence of adaptations made in response to residents' needs$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$;

-- DEM-CAR-01: Life history / This Is Me
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each resident living with dementia and is accessible to all staff on shift including bank and agency nurses$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents; evidence accessible at the point of care (e.g. in room, on nursing care system); evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$;

-- DEM-CAR-02: Adapted activities
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Activities are adapted to the cognitive ability and stage of dementia of each resident; individual activity plans are reviewed regularly and include cognitive stimulation where appropriate$$,
  $$Reg 9$$,
  $$Individual activity plans; evidence of cognitive-ability-matched activities (e.g. reminiscence, sensory, music); activity review records; SOFI observations or equivalent$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$;

-- DEM-RES-01: Communication needs
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented in nursing care plans; all staff including agency nurses use adapted techniques including simple language, non-verbal cues and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in nursing care plans; evidence of adapted communication in nursing observation records; staff training records on dementia communication$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$;

-- DEM-WEL-01: Dementia lead / champion
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post; they support nursing and care staff development, promote best practice and monitor the quality of dementia care within the service$$,
  $$Reg 17$$,
  $$Named dementia lead / champion; evidence of their role in training, supervision or quality monitoring; any dementia audit or improvement records they have produced$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$;

-- DEM-WEL-02: Admiral Nurse / memory clinic links
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with specialist dementia services including memory clinic, Admiral Nurse or Dementia UK; these are accessed when residents' dementia-related needs escalate$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic / Admiral Nurse; correspondence or meeting records with specialist services; evidence of referrals made and outcomes followed up$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$;


-- ════════════════════════════════════════════════════════════════════════════
-- DUAL-REGISTERED CARE HOME — Dementia sub-service items
-- These apply jointly across both registered parts of the service.
-- sub_service = 'Dementia' (the overlay value, distinct from the
-- 'Residential' | 'Nursing' | 'Joint' split used for Core items).
-- ════════════════════════════════════════════════════════════════════════════

-- DEM-SAF-01: Wandering / absconding risk
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$Wandering and absconding risk assessment is in place for each resident living with dementia across both the residential and nursing parts of the service; management plans are consistent and reviewed following any incident$$,
  $$Reg 12$$,
  $$Individual wandering / absconding risk assessments; management plans; door security records; evidence of review following any incident across both registered parts$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$;

-- DEM-SAF-02: Covert medicines
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a resident lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the prescriber and reviewed regularly; in the nursing part, registered nurses take NMC accountability for covert administration$$,
  $$Reg 12$$,
  $$Covert medicine protocols per resident; MCA best interest decision records; prescriber authorisation; MAR / EMAR showing covert administration; NMC-accountable records where applicable$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$;

-- DEM-SAF-03: Dementia-specific staff training
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$All staff across both registered parts receive dementia-specific training covering types of dementia, communication approaches, behaviour support and person-centred care; training is refreshed regularly$$,
  $$Reg 18$$,
  $$Dementia training matrix covering both residential and nursing staff; training certificates or records; evidence of refresher training$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$;

-- DEM-EFF-01: Cognitive baseline in care plans
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Care plans document the type and date of dementia diagnosis, current cognitive baseline (e.g. MMSE or ACE-R score) and any changes in cognition; care plans transfer accurately when a resident moves between the residential and nursing parts$$,
  $$Reg 9$$,
  $$Care plans with dementia diagnosis details; cognitive assessment records; evidence of care plan continuity when residents transfer between registered parts$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$;

-- DEM-EFF-02: SALT / swallowing
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$SALT assessment is offered to residents living with dementia who present with dysphagia or swallowing difficulties; outcomes are documented and followed consistently across both parts of the service$$,
  $$Reg 14$$,
  $$SALT referral records; SALT assessment outcomes; modified diet / texture guidance in care plans; evidence of consistent implementation across residential and nursing parts$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$;

-- DEM-EFF-03: MCA / DoLS
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$MCA assessments are completed for residents living with dementia where capacity is in doubt; DoLS applications are submitted, tracked and renewed before expiry; authorisations transfer correctly when residents move between registered parts$$,
  $$Reg 11$$,
  $$MCA assessment records per decision; best interest meeting minutes; DoLS application and authorisation records; evidence of DoLS transfer when residents move between parts$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$;

-- DEM-EFF-04: Dementia-friendly environment
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$The environment across both registered parts supports residents living with dementia through evidence-based design features including contrasting colours, picture-format signage, sensory areas and room individualisation$$,
  $$Reg 15$$,
  $$Environmental audit covering both residential and nursing parts; photographs or walkthrough evidence; evidence of adaptations made in response to residents' needs$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$;

-- DEM-CAR-01: Life history / This Is Me
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each resident living with dementia and travels with them if they move between registered parts; it is accessible to all staff on shift$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents; evidence accessible at point of care; evidence of document transferring with resident between parts; evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$;

-- DEM-CAR-02: Adapted activities
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Activities are adapted to the cognitive ability and stage of dementia of each resident across both parts of the service; individual activity plans are reviewed regularly and include cognitive stimulation where appropriate$$,
  $$Reg 9$$,
  $$Individual activity plans; evidence of cognitive-ability-matched activities; activity review records covering both residential and nursing parts$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$;

-- DEM-RES-01: Communication needs
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented and transfer with the resident between registered parts; all staff use adapted techniques including simple language, non-verbal cues and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of consistent communication approaches across both parts; staff training records on dementia communication$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$;

-- DEM-WEL-01: Dementia lead / champion
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post and provides oversight across both registered parts; they support staff development, promote best practice and monitor dementia care quality throughout the service$$,
  $$Reg 17$$,
  $$Named dementia lead / champion; evidence of oversight across both parts; training, supervision or quality monitoring records$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$;

-- DEM-WEL-02: Admiral Nurse / memory clinic links
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with specialist dementia services including memory clinic, Admiral Nurse or Dementia UK; these are accessed for residents in both registered parts when dementia-related needs escalate$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic / Admiral Nurse; correspondence or meeting records with specialist services; evidence of referrals from both parts of the service$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$;
