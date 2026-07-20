-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Fix KLOE title and key question mismatches in checklist seeds
--
-- Problem:
--   Checklist migrations for 10 service types/sub-services used incorrect
--   KLOE titles or wrong key question names in WHERE clauses. Because the
--   SELECT returned 0 rows, those items were silently never inserted.
--
-- Wrong title → correct title:
--   Medicines management            → Safe medicines and treatments
--   Assessment and care planning    → Assessing needs
--   Training and development (Eff)  → Safe staffing (Safe)
--   Mental capacity and consent     → Consent to care and treatment
--   Health and wellbeing            → Supporting people to live healthier lives
--   Compassionate care              → Kindness, compassion and dignity
--   Responding to people's needs    → Care provision, integration and continuity
--   Complaints and feedback         → Listening to and responding to feedback
--   Person-centred culture (WL)     → Person-centred care (Caring)
--
-- Wrong key question → correct key question (title was already correct):
--   Person-centred care AND Responsive          → AND Caring
--   Care provision... AND Effective             → AND Responsive
--   Equity in experiences AND Caring            → AND Responsive
--   Listening to and responding... AND Caring   → AND Responsive
--
-- Affected migrations:
--   20260719000005  dementia_sub_service
--   20260719000007  dementia_nursing_and_dualreg
--   20260719000008  homecare_agency
--   20260719000009  extra_care_housing
--   20260719000010  shared_lives_scheme
--   20260719000011  supported_living
--   20260719000012  specialist_college
--   20260719000013  residential_rehab
--   20260719000014  community_drug_alcohol
--   20260719000016  autism_sub_service
--
-- Total INSERT statements corrected and re-run: 196
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000005_dementia_sub_service.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented in care plans; staff use adapted techniques including simple language, non-verbal cues and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of adapted communication in observation records or staff notes; staff training records on dementia communication$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$;

-- ── WELL-LED ─────────────────────────────────────────────────────────────────

-- DEM-WEL-01: Dementia lead / champion

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Where a resident has co-occurring dementia, communication needs specific to dementia (in addition to ARBD-related communication needs) are documented and staff use adapted techniques accordingly$$,
  $$Reg 9$$,
  $$Communication needs assessments differentiating ARBD and dementia-related needs; evidence of adapted communication in support notes; relevant staff training records$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$;

-- DEM-WEL-01 (ARBD): Dementia lead


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000007_dementia_nursing_and_dualreg.sql

-- ═══════════════════════════════════════════════════════════════


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
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$;

-- DEM-WEL-01: Dementia lead / champion

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
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$;

-- DEM-WEL-01: Dementia lead / champion


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000008_homecare_agency.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A consistent rota promotes continuity of carers; new carers are introduced to the service user before attending alone; any change of regular carer is communicated to the service user in advance$$,
  $$Reg 9$$,
  $$Rota records showing carer consistency; evidence of introductions before lone attendance; communications to service users about carer changes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Handover between carers is effective; any changes in a service user's condition are communicated to the next carer and, where clinically significant, to the relevant professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs in the home; evidence of inter-carer communication; records of escalation to professionals when a change in condition was noted$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$The service works alongside district nurses, community mental health teams, GPs and other community professionals; records of joint working and shared information are maintained$$,
  $$Reg 9$$,
  $$Records of multi-professional contact; joint visit records; evidence of care co-ordination with community teams; referral outcomes$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-04$$, NULL,
  $$When a service user is discharged from hospital, the service is notified and adapts the care package before the first post-discharge visit; a care plan review is completed within an agreed timeframe$$,
  $$Reg 9$$,
  $$Hospital discharge notifications; evidence of pre-discharge communication with hospital team; updated care plans following discharge; timescales for review$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-05$$, NULL,
  $$When the service reduces or ends, a planned transition is arranged with the service user and, where relevant, with the commissioning authority; continuity of support is maintained during the handover period$$,
  $$Reg 9$$,
  $$Cessation or reduction of care records; evidence of planned transition; communication with commissioners and community teams$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Supporting people to live healthier lives
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-EE-01$$, NULL,
  $$Communication needs are documented in care plans including language, literacy, hearing or visual impairments; interpreters or adapted materials are arranged as needed$$,
  $$Reg 9$$,
  $$Care plans with communication needs documented; evidence of interpreter arrangements; accessible care plan formats (e.g. easy read, large print, translated)$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-EE-02$$, NULL,
  $$All staff complete equality and diversity training; the service actively considers the cultural, religious and lifestyle preferences of each service user in care delivery$$,
  $$Reg 18$$,
  $$Equality and diversity training matrix; care plans recording cultural or religious preferences; evidence of preferences being honoured in practice$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Listening to and responding to feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-LR-01$$, NULL,
  $$Service users and families are given regular opportunities to give feedback; annual satisfaction surveys are conducted and the results are shared with staff$$,
  $$Reg 17$$,
  $$Satisfaction survey records; evidence of results being shared; response rate and themes identified$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-LR-02$$, NULL,
  $$Feedback from service users shapes care planning and service improvement; there is evidence that suggestions have led to tangible changes$$,
  $$Reg 17$$,
  $$Examples of improvements made in response to feedback; evidence shared with service users that their feedback was acted on$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-01$$, NULL,
  $$Care plans reflect each service user's individual preferences, cultural and religious needs, life history, social interests and communication style$$,
  $$Reg 9$$,
  $$Care plans with individual preference sections completed; evidence of life history, cultural and religious needs documented and reflected in care$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-02$$, NULL,
  $$The service responds promptly when a service user's needs change; care plans are amended and communicated to all carers before the next visit$$,
  $$Reg 9$$,
  $$Records of urgent care plan amendments; evidence of communication to carers following changes; timescales from change in need to updated care plan$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-03$$, NULL,
  $$End of life preferences, including preferred place of death, DNACPR decisions and advanced care plans, are documented and shared with the relevant professionals where the service user consents$$,
  $$Reg 9$$,
  $$End of life care plans; DNACPR documentation; evidence of sharing with GP and community nurse; care plans updated as end of life needs change$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Timely and equitable access
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for service users living with dementia are documented in care plans; all visiting carers — including cover and agency staff — use adapted techniques including simple language, familiar routines and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of handover of communication guidance to cover and agency carers; spot check observations of communication approaches$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000009_extra_care_housing.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$Continuity of care workers is promoted through consistent rota allocation; residents are introduced to new staff before they work with them alone$$,
  $$Reg 9$$,
  $$Rota records showing staff consistency per resident; evidence of introductions before lone working; communications to residents about staffing changes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Handover between staff is effective; changes in a resident's condition are communicated to the next shift and, where clinically significant, to the relevant professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs in each flat; evidence of inter-shift communication; records of escalation to professionals when a change in condition was noted$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$The service works alongside district nurses, GPs, community mental health teams and other professionals; records of joint working and shared information are maintained$$,
  $$Reg 9$$,
  $$Records of multi-professional contact; joint visit records; evidence of care co-ordination with community teams$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-04$$, NULL,
  $$When a resident is discharged from hospital, the service is notified and adapts the care package before the first post-discharge visit; the housing provider is informed where flat adaptations may be needed$$,
  $$Reg 9$$,
  $$Hospital discharge notifications; updated care plans following discharge; timescales for review; communication with housing provider about any flat adaptations required$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-05$$, NULL,
  $$When a resident's care package changes significantly or ceases, a planned transition is arranged; where a resident needs to move to a more intensive setting, support is provided throughout the transition and the housing provider is notified$$,
  $$Reg 9$$,
  $$Care package change records; evidence of planned transition; communication with resident, family and housing provider; continuity of care during transition period$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Supporting people to live healthier lives
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-EE-01$$, NULL,
  $$Communication needs are documented in care plans including language, literacy, hearing or visual impairments; interpreters or adapted materials are arranged as needed$$,
  $$Reg 9$$,
  $$Care plans with communication needs documented; evidence of interpreter arrangements; accessible care plan formats (e.g. easy read, large print, translated)$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-EE-02$$, NULL,
  $$All staff complete equality and diversity training; care delivery actively considers the cultural, religious and lifestyle preferences of each resident$$,
  $$Reg 18$$,
  $$Equality and diversity training matrix; care plans recording cultural or religious preferences; evidence of preferences being honoured in care and in communal activity planning$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Listening to and responding to feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-LR-01$$, NULL,
  $$Residents have regular opportunities to give feedback; resident meetings and annual satisfaction surveys are conducted and the results are shared with staff and the housing provider$$,
  $$Reg 17$$,
  $$Satisfaction survey records; resident meeting minutes; evidence of results being shared; response rate and themes identified$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-LR-02$$, NULL,
  $$Feedback from residents shapes care planning and service improvement; there is evidence that suggestions have led to tangible changes$$,
  $$Reg 17$$,
  $$Examples of improvements made in response to feedback; evidence shared with residents that their feedback was acted on$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-01$$, NULL,
  $$Care plans reflect each resident's individual preferences, cultural and religious needs, life history, social interests and communication style$$,
  $$Reg 9$$,
  $$Care plans with individual preference sections completed; evidence of life history, cultural and religious needs documented and reflected in care and activity planning$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-02$$, NULL,
  $$The service responds promptly when a resident's needs change; care plans are amended and all staff are informed before the next shift$$,
  $$Reg 9$$,
  $$Records of urgent care plan amendments; evidence of communication to all scheme staff following changes; timescales from change in need to updated care plan$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-03$$, NULL,
  $$End of life preferences, including preferred place of death, DNACPR decisions and advanced care plans, are documented and shared with relevant professionals where the resident consents$$,
  $$Reg 9$$,
  $$End of life care plans; DNACPR documentation; evidence of sharing with GP and community nurse; care plans updated as end of life needs change$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Timely and equitable access
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented in care plans; all scheme staff use adapted techniques including simple language, familiar routines and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of communication guidance shared with all staff; spot check observations of communication approaches$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000010_shared_lives_scheme.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed by shared lives carers in their own homes; each carer administering medicines has been assessed as competent to do so and has completed appropriate training; the scheme conducts periodic medicines audits at carer homes$$,
  $$Reg 12$$,
  $$Carer medicines competency assessments; medicines training records; medicines administration records (MARs) held at carer homes; audit records from coordinator visits; records of medicine errors and actions taken$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-MM-02$$, NULL,
  $$Medicines are stored safely at the carer's home; the scheme's medicines policy addresses home storage requirements; coordinators check medicines storage during monitoring visits$$,
  $$Reg 12$$,
  $$Medicines storage records; coordinator visit notes evidencing medicines storage check; scheme medicines policy including home storage section; evidence of action where storage concerns were identified$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessment and care planning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A person-centred support plan is completed for each person placed with a shared lives carer; it covers the person's needs, wishes, routines, communication preferences, cultural and spiritual needs, and health care needs; the person (and advocate or family where appropriate) is involved in developing and reviewing it$$,
  $$Reg 9$$,
  $$Support plans per placement; evidence of person's involvement in plan development; review records; evidence of cultural, spiritual and communication needs addressed; family or advocate involvement records$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Support plans are reviewed at least annually and following any significant change in the person's needs, health, or placement circumstances; reviews are completed with the person, their coordinator and where appropriate the shared lives carer$$,
  $$Reg 9$$,
  $$Review dates on support plans; records of reviews following change; evidence all three parties (person, coordinator, carer) are involved; actions arising from reviews and evidence they were completed$$,
  12
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Matching and placement process
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-MP-01$$, NULL,
  $$The scheme operates a structured matching process before any long-term or short break placement begins; matching considers the person's needs, preferences, interests, cultural background, and the carer's household composition, skills and experience; both the person and the carer have the opportunity to meet before a placement is confirmed$$,
  $$Reg 9$$,
  $$Matching records including rationale for each match; evidence of pre-placement introductions or trial periods; person and carer consent to proceed with placement; cultural and personal compatibility assessment$$,
  13
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-MP-02$$, NULL,
  $$The scheme has a documented process for managing placement breakdowns; where a placement ends unexpectedly, the scheme provides support to both the person and the carer; a debrief is completed and learning is used to improve future matching$$,
  $$Reg 9$$,
  $$Placement breakdown records; evidence of support provided to person and carer after breakdown; debrief records; evidence that learning has been applied to future matching practice$$,
  14
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Training and development (coordinators and carers)
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-TD-01$$, NULL,
  $$Coordinators and shared lives carers receive induction training before they begin their roles; ongoing mandatory training is tracked and renewals are managed; the scheme has a process to address gaps or overdue training$$,
  $$Reg 18$$,
  $$Induction records for coordinators and carers; mandatory training matrix with completion dates and renewal due dates; evidence of action where training is overdue; gap analysis records$$,
  15
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-TD-02$$, NULL,
  $$Coordinators receive regular formal supervision from a manager; supervision records document discussion of individual placements, carer performance, and any concerns; supervision is not replaced by informal contact alone$$,
  $$Reg 18$$,
  $$Coordinator supervision records; supervision frequency against policy; evidence placement and carer concerns are discussed; manager sign-off on supervision records$$,
  16
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-TD-03$$, NULL,
  $$Shared lives carers receive regular support visits from their allocated coordinator; visit records document discussion of the person's wellbeing, any concerns, and carer development needs; annual appraisal or review of the carer's performance and approval is completed$$,
  $$Reg 18$$,
  $$Carer support visit records; visit frequency against scheme policy; annual carer appraisal or review records; evidence of actions arising from concerns raised by carers$$,
  17
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Mental capacity and consent
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Mental capacity is assessed for specific decisions affecting the person's care and placement; assessments are decision-specific and time-specific; where a person lacks capacity for a decision, a best interests process is followed and documented$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; best interests records; evidence of involvement of family, advocate or IMCA; records of decisions made in best interests and review dates$$,
  18
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$Where a person living with a shared lives carer may be deprived of their liberty, the scheme identifies this and applies for a DoLS authorisation; the scheme understands that DoLS CAN apply in a shared lives placement (unlike a tenancy-based service) because the person lives in the carer's home, not their own home$$,
  $$Reg 11$$,
  $$DoLS applications where criteria are met; DoLS authorisations held on file; evidence the scheme has assessed whether DoLS applies for each person without capacity where restrictions exist; IMCA involvement records where required$$,
  19
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Health and wellbeing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$The scheme supports people placed to access community health and social care services; coordinators or carers accompany people to appointments where needed; health needs are documented in support plans and GP and specialist contacts are recorded$$,
  $$Reg 9$$,
  $$Support plan health sections; appointment records; evidence of coordinator or carer involvement in health appointments; GP and specialist contact details held on file; health action plans where used$$,
  20
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care and dignity
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$CAR-CW-01$$, NULL,
  $$The scheme actively monitors and supports the wellbeing of shared lives carers; coordinators check on carer wellbeing during support visits; carers are encouraged to raise concerns or difficulties without fear of losing their approved status$$,
  $$Reg 17$$,
  $$Coordinator visit notes evidencing carer wellbeing checks; carer feedback records; evidence carers feel able to raise concerns; records of support provided to carers in difficulty$$,
  24
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$CAR-CW-02$$, NULL,
  $$Respite and short break arrangements are in place to support carer sustainability; the scheme has a process to arrange emergency respite when needed; carers are encouraged to take breaks and are not expected to provide care 24/7 without respite$$,
  $$Reg 17$$,
  $$Respite and short break policy; records of respite arranged; evidence carers are aware of and can access respite; emergency respite records; carer feedback on respite availability$$,
  25
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Right support, right care, right culture
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$RES-RC-01$$, NULL,
  $$The scheme demonstrates how it meets the principles of "Right support, right care, right culture" for people with learning disabilities or autistic people; this includes promoting inclusion, independence, community access, and a culture of respect and equality$$,
  $$Reg 9$$,
  $$Evidence of community access and inclusion activities; support plans embedding RSRCC principles; training on autism and learning disabilities for coordinators and carers; scheme culture statements or service development plans$$,
  26
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$RES-RC-02$$, NULL,
  $$People are supported to access social activities, community groups, employment, education, and volunteering opportunities in line with their interests and abilities; coordinators and carers actively facilitate community connections rather than providing care in isolation$$,
  $$Reg 9$$,
  $$Support plans with community goals and activities; records of community access and participation; evidence of employment, education or volunteering support where relevant; coordinator visit records noting social activities$$,
  27
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Transitions and placement management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$RES-TR-01$$, NULL,
  $$Placement transitions (moving in, planned moves out, carer changes) are managed in a planned and person-centred way; the person is supported to understand and prepare for any transition; the scheme coordinates with the local authority and other professionals to ensure continuity$$,
  $$Reg 9$$,
  $$Transition planning records; evidence of person's involvement in transition planning; coordination records with local authority and other professionals; support plans updated to reflect transition$$,
  28
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$RES-TR-02$$, NULL,
  $$Short break and respite placements are planned with the same rigour as long-term placements; the person is matched appropriately for short breaks; their needs, preferences and routines are shared with the short break carer in advance$$,
  $$Reg 9$$,
  $$Short break placement records; evidence of pre-placement information sharing with short break carer; matching rationale for short break placements; feedback from people and carers following short breaks$$,
  29
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Complaints and feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$RES-CF-01$$, NULL,
  $$People placed and their families know how to make a complaint and feel safe to do so; the scheme has an accessible complaints procedure; complaints are investigated promptly and feedback is given to the complainant; learning from complaints is documented$$,
  $$Reg 16$$,
  $$Complaints policy; evidence people and families have been informed of complaints process; complaints log with outcomes; evidence of learning applied following complaints; coordinator visit records noting any expressed dissatisfaction$$,
  30
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and oversight
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$WEL-PC-01$$, NULL,
  $$The registered manager is visible and accessible to coordinators and carers; the scheme has a clear management structure; the manager provides oversight of all active placements and is informed of concerns promptly$$,
  $$Reg 17$$,
  $$Management structure chart; evidence of manager involvement in oversight and decision-making; records of manager-level review of placements; evidence manager is accessible to coordinators and carers$$,
  35
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-EFF-01$$, NULL,
  $$Support plans for people with dementia include a detailed life history and communication profile; carers use this to provide personalised care that connects to the person's identity, memories and preferences$$,
  $$Reg 9$$,
  $$Life history records within support plans; communication profiles; evidence carers are familiar with person's history and preferences; coordinator visit records noting use of life history in daily care$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-EFF-02$$, NULL,
  $$Cognitive decline and changes in behaviour or function are identified early and documented; the coordinator and carer have an agreed escalation pathway for involving the GP, memory service or specialist team when changes are observed$$,
  $$Reg 9$$,
  $$Records of cognitive monitoring in support plans; evidence of GP or specialist referrals following changes; coordinator visit notes capturing any changes in cognition or behaviour; communication between coordinator and carer about changes$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-EFF-03$$, NULL,
  $$Mental capacity is assessed regularly for people with dementia as capacity may fluctuate or decline; DoLS is applied for where the person lacks capacity and is living in the carer's home under continuous supervision and control from which they cannot freely leave$$,
  $$Reg 11$$,
  $$Mental capacity assessments with review dates; DoLS applications and authorisations; evidence assessments are reviewed following changes in condition; IMCA involvement records where no family is available$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-EFF-04$$, NULL,
  $$Nutrition and hydration needs for people with dementia are actively managed; carers are aware of risks such as forgetting to eat, swallowing difficulties, or changes in appetite; concerns are escalated to the GP or SALT as appropriate$$,
  $$Reg 14$$,
  $$Nutrition and hydration records in support plans; SALT referrals or recommendations where relevant; records of weight monitoring or food and fluid intake monitoring; GP referrals for nutrition concerns$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-CAR-01$$, NULL,
  $$Carers are sensitive to the emotional and psychological needs of people with dementia; distressed behaviour is understood and responded to with compassion rather than task-focused care; the scheme provides carers with guidance and support when managing challenging or distressed behaviour$$,
  $$Reg 9$$,
  $$Evidence of compassionate, person-centred responses to distressed behaviour; carer guidance or policies on behaviour that challenges; coordinator visit records noting carer approach; records of additional support provided to carers managing distressed behaviour$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-CAR-02$$, NULL,
  $$End-of-life care planning is initiated early for people with dementia placed by the scheme; the person's wishes (where known or previously expressed) and their family's involvement are documented; the scheme coordinates with the GP and palliative care team as appropriate$$,
  $$Reg 9$$,
  $$Advance care plans or end-of-life wishes documentation; evidence of family involvement in planning; records of coordination with GP and palliative care; coordinator records of end-of-life conversations$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-RES-01$$, NULL,
  $$Where a person with dementia needs to transition to a different placement or care setting as their needs increase, the scheme manages this with care and in advance; the decision is made in a timely way in partnership with the local authority and family, avoiding emergency or crisis-driven moves$$,
  $$Reg 9$$,
  $$Transition planning records for people with increasing needs; evidence of advance planning with local authority and family; records of any emergency placements and what triggered them; learning from emergency transitions applied to future planning$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000011_supported_living.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed safely in each person's own home; MAR charts are accurately maintained; staff administering medicines are assessed as competent; PRN protocols are in place for as-needed medicines; medicines errors are recorded and investigated$$,
  $$Reg 12$$,
  $$MAR charts; medicines competency assessments for relevant staff; PRN protocols; medicines error log; evidence of investigation and learning following errors; medicines audit records$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MM-02$$, NULL,
  $$Where a person self-administers their medicines (in part or fully), this is documented and supported appropriately; the person's capacity to self-administer is assessed; any support provided is recorded$$,
  $$Reg 12$$,
  $$Self-administration assessments; records of support provided; evidence person has been involved in decisions about their own medicines; records of reassessment when circumstances change$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessment and care planning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A person-centred support plan is in place for each person; it covers their needs, preferences, communication methods, cultural and spiritual background, goals and aspirations; the person and/or their advocate is actively involved in developing and reviewing it$$,
  $$Reg 9$$,
  $$Support plans per person; evidence of person's involvement in plan development; review records; communication needs addressed; cultural and spiritual sections; family or advocate involvement records$$,
  12
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Support plans are reviewed at least annually and following any significant change in the person's needs, health or circumstances; reviews are outcome-focused and track progress against goals$$,
  $$Reg 9$$,
  $$Review dates on support plans; evidence reviews happened following changes; outcome tracking and goal progress records; evidence actions from reviews were followed through$$,
  13
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$Support plans include a communication profile that describes how the person communicates, what they understand, and how to support them to express choices and decisions; where the person uses AAC, Makaton, PECS, or objects of reference, staff are trained in and use these methods$$,
  $$Reg 9$$,
  $$Communication profiles in support plans; evidence staff use person's preferred communication method; AAC, Makaton or PECS training records where relevant; records of how communication needs were accommodated during assessments and reviews$$,
  14
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Training and development
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-TD-01$$, NULL,
  $$All staff complete induction training before working with people unsupported; ongoing mandatory training includes learning disability and autism awareness, safeguarding, MCA, PBS and positive risk-taking; training is tracked and renewal timelines managed$$,
  $$Reg 18$$,
  $$Induction records; mandatory training matrix with completion dates and renewal due dates; LD and autism awareness training records; PBS training where relevant; evidence of action where training is overdue$$,
  15
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-TD-02$$, NULL,
  $$Staff receive regular formal supervision and an annual appraisal; supervision records document discussion of individual people supported, competency, and any concerns; a registered manager provides visible leadership and is accessible to staff$$,
  $$Reg 18$$,
  $$Supervision records; supervision frequency against policy; appraisal records; evidence competency and concerns are discussed; evidence registered manager is present and accessible$$,
  16
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Mental capacity and consent
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Mental capacity is assessed for specific decisions affecting the person's care and daily life; assessments are decision-specific and time-specific; where a person lacks capacity for a decision, a best interests process is documented and involves family, advocate or IMCA$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; best interests records; family, advocate or IMCA involvement records; evidence assessments are not blanket or generalised; records of decisions made in best interests and review dates$$,
  17
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$The service assesses whether each person without capacity who is subject to continuous supervision and control may be deprived of their liberty; where this test is met, a DoLS authorisation is applied for through the local authority as supervisory body; the service does not assume that holding a tenancy automatically prevents a deprivation of liberty$$,
  $$Reg 11$$,
  $$DoLS screening or assessment per relevant person; DoLS applications and authorisations where criteria are met; evidence the service has considered the Cheshire West acid test (continuous supervision and control + not free to leave); IMCA involvement records$$,
  18
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Health and wellbeing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$People supported have an up-to-date health action plan; annual health checks with their GP are supported and completed; the service acts on health check outcomes and follows up on any referrals or recommendations$$,
  $$Reg 9$$,
  $$Health action plans per person; annual health check records; evidence of follow-up on referrals and health check recommendations; GP and specialist contact records$$,
  19
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$A hospital passport is maintained for each person; it is kept up to date and is readily available to take to any hospital appointment or admission; staff know where to find it and how to use it$$,
  $$Reg 9$$,
  $$Hospital passports per person; evidence passports are up to date; evidence staff know where to find and how to use the passport; records of passports being used at hospital appointments or admissions$$,
  20
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Independence, choice and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-RC-01$$, NULL,
  $$The service demonstrates how it meets the principles of "Right support, right care, right culture"; it promotes inclusion, independence, and community access; a person-centred culture is embedded — the service exists for the people it supports, not the other way around$$,
  $$Reg 9$$,
  $$Evidence of community access and inclusion; support plans embedding RSRCC principles; training on autism and learning disabilities; evidence the service culture places people at the centre; leader visibility and accountability records$$,
  24
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-RC-02$$, NULL,
  $$People are supported to access the community, pursue interests, and participate in activities of their choosing; support is not limited to the person's home; the service actively facilitates employment, education, volunteering, and social connections$$,
  $$Reg 9$$,
  $$Support plans with community and activity goals; records of community access; evidence of employment, education, volunteering support where relevant; activity records reflecting person's choices; evidence staff facilitate access rather than restrict it$$,
  25
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Complaints and feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-CF-01$$, NULL,
  $$People supported know how to raise a concern or complaint and are supported to do so in ways that reflect their communication needs; the service has an accessible complaints procedure; complaints are investigated and responded to promptly; learning from complaints is documented$$,
  $$Reg 16$$,
  $$Complaints procedure in accessible formats (easy read, visual); complaints log with outcomes; evidence of feedback from people in formats they can use; evidence of learning applied following complaints; records of how people with communication needs were supported to give feedback$$,
  26
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-EFF-01$$, NULL,
  $$Support plans for people with dementia include a detailed life history and communication profile; staff use this to provide personalised care that connects to the person's identity, memories and preferences$$,
  $$Reg 9$$,
  $$Life history records within support plans; communication profiles; evidence staff are familiar with person's history and preferences; records of how life history informs daily care and interaction$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-EFF-02$$, NULL,
  $$Cognitive decline and changes in behaviour or function are identified early; the service has an agreed escalation pathway for involving the GP or memory service when changes are observed; changes are documented and reviewed$$,
  $$Reg 9$$,
  $$Records of cognitive monitoring in support plans; GP or specialist referrals following changes; records of behavioural or functional changes; communication between support team and health professionals$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-EFF-03$$, NULL,
  $$Mental capacity is assessed regularly for people with dementia as capacity may fluctuate; DoLS is applied for where the person is under continuous supervision and control and not free to leave; the service does not assume a tenancy prevents deprivation of liberty$$,
  $$Reg 11$$,
  $$Mental capacity assessments with review dates; DoLS applications and authorisations where criteria are met; evidence of regular reassessment; IMCA involvement records where no family is available$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-EFF-04$$, NULL,
  $$Nutrition and hydration needs for people with dementia are actively managed; staff are aware of risks including forgetting to eat, swallowing difficulties, and changes in appetite; concerns are escalated to the GP or SALT as appropriate$$,
  $$Reg 14$$,
  $$Nutrition and hydration sections in support plans; SALT referrals or recommendations where relevant; weight monitoring records; GP referrals for nutrition concerns; records of food and fluid intake monitoring where needed$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-CAR-01$$, NULL,
  $$Staff are sensitive to the emotional and psychological needs of people with dementia; distressed behaviour is understood and responded to with compassion rather than task-focused care; PBS principles are applied where relevant$$,
  $$Reg 9$$,
  $$Evidence of compassionate, person-centred responses to distressed behaviour; PBS plans where relevant; staff guidance on behaviour that challenges; records of additional support where distressed behaviour is frequent$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-CAR-02$$, NULL,
  $$End-of-life care planning is initiated early for people with dementia; the person's wishes and their family's involvement are documented; the service coordinates with the GP and palliative care team as needs increase$$,
  $$Reg 9$$,
  $$Advance care plans or end-of-life wishes documentation; evidence of family involvement in planning; GP and palliative care records; records of conversations about future care preferences$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-RES-01$$, NULL,
  $$Where a person with dementia needs to transition to a different setting as their needs increase, the transition is planned in advance and in partnership with the person (where possible), their family, and the local authority; crisis-driven unplanned moves are avoided$$,
  $$Reg 9$$,
  $$Transition planning records; evidence of advance planning with family and local authority; evidence of person's involvement in transition planning; records of any unplanned moves and the reasons$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000012_specialist_college.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed safely for all students in receipt of personal care; MAR charts are accurately maintained; staff administering medicines are assessed as competent; PRN protocols are in place for as-needed medicines; medicines errors are recorded and investigated$$,
  $$Reg 12$$,
  $$MAR charts; medicines competency assessments; PRN protocols; medicines error log; evidence of investigation and learning following errors; medicines audit records$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessment and care planning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A person-centred care and support plan is in place for each student in receipt of personal care; it is aligned with but distinct from the EHC plan; the student and their family or advocate are involved in developing and reviewing it$$,
  $$Reg 9$$,
  $$Care and support plans per student; evidence of student and family involvement in plan development; evidence of alignment with EHC plan goals; review records; advocate involvement records$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Support plans include a communication profile describing how the student communicates, what they understand, and how to support them to express choices; where the student uses AAC, Makaton, PECS, or objects of reference, all staff are trained in and use these methods$$,
  $$Reg 9$$,
  $$Communication profiles in support plans; evidence staff (care and education) use the student's preferred communication method; AAC, Makaton or PECS training records where relevant; evidence communication needs are accommodated in reviews and assessments$$,
  12
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — EHC plan and local authority interface
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-EH-01$$, NULL,
  $$Annual EHC plan reviews are completed within the statutory timeframe and involve the student, their family, the funding local authority, and relevant professionals; outcomes from reviews are acted on and progress against EHC plan outcomes is monitored$$,
  $$Reg 9$$,
  $$EHC plan annual review records; evidence reviews are completed within 12 months; evidence student and family are involved; progress reports against EHC plan outcomes; local authority correspondence$$,
  13
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Training and development
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-TD-01$$, NULL,
  $$All staff complete induction training before working with students unsupported; ongoing mandatory training includes learning disability and autism awareness, safeguarding, MCA, PBS, and emergency health procedures relevant to the student group; training is tracked across both care and education staff$$,
  $$Reg 18$$,
  $$Induction records; mandatory training matrix covering care and education staff; evidence of specialist training (epilepsy, buccal midazolam, complex communication); training renewal dates; evidence of action where training is overdue$$,
  14
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-TD-02$$, NULL,
  $$Care staff and support workers receive regular formal supervision and an annual appraisal; supervision records document discussion of individual students, competency, and any concerns; multidisciplinary working between care and education staff is supported and documented$$,
  $$Reg 18$$,
  $$Supervision records; supervision frequency against policy; appraisal records; evidence of multidisciplinary communication between care and education teams; records of joint planning or case discussions$$,
  15
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Mental capacity and consent
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Mental capacity is assessed for specific decisions affecting the student's care; assessments are decision-specific and time-specific; where a student lacks capacity, a best interests process is documented and involves family, advocate or IMCA$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; best interests records; family, advocate or IMCA involvement records; evidence assessments are not blanket or generalised; records of decisions made in best interests and review dates$$,
  16
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$Where a residential student lacks capacity and is subject to continuous supervision and control and not free to leave, a DoLS authorisation is applied for through the local authority as supervisory body; the college actively assesses whether each relevant student meets the Cheshire West acid test$$,
  $$Reg 11$$,
  $$DoLS screening or assessment per relevant residential student; DoLS applications and authorisations where criteria are met; evidence the college has considered the acid test for each student without capacity; IMCA involvement records$$,
  17
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Health and wellbeing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$Students have an up-to-date health action plan that is embedded in their care and support plan; annual health checks with their GP are supported and completed; the college acts on health check outcomes and follows up on any referrals or recommendations$$,
  $$Reg 9$$,
  $$Health action plans per student; annual health check records; evidence of follow-up on referrals and health check recommendations; GP, SALT, OT, and specialist contact records$$,
  18
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$A hospital passport is maintained for each student with complex health needs; it is kept up to date and is available to accompany the student to any hospital appointment or admission; all relevant staff know where to find it and how to use it$$,
  $$Reg 9$$,
  $$Hospital passports per student; evidence passports are current; evidence staff know how to use the passport; records of passports being used at hospital appointments or admissions$$,
  19
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Independence, choice and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$RES-RC-01$$, NULL,
  $$The college demonstrates how it meets the principles of "Right support, right care, right culture"; the culture of the college places students at the centre; people with learning disabilities and autistic students are supported to live meaningful, inclusive lives with genuine choice and control$$,
  $$Reg 9$$,
  $$Evidence of RSRCC principles embedded in care plans and college ethos; community access and inclusion records; training on LD and autism; student outcomes demonstrating real-world independence and participation; leader accountability records$$,
  22
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$RES-TR-01$$, NULL,
  $$Transition INTO the college from school or children's services is managed in a planned and person-centred way; the student and their family are supported to understand and prepare for the transition; information is gathered from the previous provider and incorporated into the student's plans$$,
  $$Reg 9$$,
  $$Transition-in planning records; evidence of information received from previous providers; evidence student and family were supported through transition; induction records; care and support plan updated at transition$$,
  23
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$RES-TR-02$$, NULL,
  $$Transition OUT of the college (to supported living, employment, further education, or adult social care) is planned well in advance and in partnership with the student, their family, and the funding local authority; the college actively supports positive destination outcomes$$,
  $$Reg 9$$,
  $$Transition-out planning records; evidence of advance planning with local authority, family and the student; positive destination outcomes data; records of handover information shared with the next provider; evidence of preparation for leaving college$$,
  24
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Complaints and feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$RES-CF-01$$, NULL,
  $$Students and their families know how to raise a concern or complaint; the college has an accessible complaints procedure in formats that meet students' communication needs; complaints are investigated and responded to promptly; learning from complaints is documented$$,
  $$Reg 16$$,
  $$Complaints procedure in accessible formats (easy read, visual); complaints log with outcomes; evidence of learning applied following complaints; evidence families are informed of the process at admission; records of support provided to students to raise complaints$$,
  25
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-EFF-01$$, NULL,
  $$Support plans for students with dementia include a life history and communication profile; staff use this to maintain the student's sense of identity and connection to familiar people and activities even as cognitive function changes$$,
  $$Reg 9$$,
  $$Life history records within support plans; communication profiles; evidence staff are familiar with the student's history and preferences; records of how life history informs daily support$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-EFF-02$$, NULL,
  $$Cognitive decline and changes in behaviour, function or learning ability are identified early; the college has a clear pathway to involve the GP, memory service or Down syndrome specialist when changes are observed; changes are documented and reviewed regularly$$,
  $$Reg 9$$,
  $$Records of cognitive and functional monitoring; GP or specialist referrals following changes; communication between care and education teams about observed changes; records of adaptations made to the student's programme and support in response to decline$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-EFF-03$$, NULL,
  $$Mental capacity is assessed regularly for students with dementia as capacity may decline; DoLS is applied for where the student lacks capacity and is in residential accommodation under continuous supervision and control; assessments are reviewed as cognitive function changes$$,
  $$Reg 11$$,
  $$Mental capacity assessments with review dates; DoLS applications and authorisations where criteria are met; evidence of regular reassessment as dementia progresses; IMCA involvement records where no family is available$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-EFF-04$$, NULL,
  $$Nutrition and hydration needs for students with dementia are actively managed; staff are alert to changes in eating behaviour, appetite or swallowing ability; concerns are escalated to the GP or SALT promptly$$,
  $$Reg 14$$,
  $$Nutrition and hydration sections in support plans; SALT referrals or recommendations; weight monitoring records; GP referrals for nutrition concerns; records of food and fluid monitoring where relevant$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-CAR-01$$, NULL,
  $$Staff respond to distressed behaviour in students with dementia with compassion and understanding; distress is recognised as communication of an unmet need; PBS principles are applied; the college adjusts the student's programme and environment to reduce distress$$,
  $$Reg 9$$,
  $$PBS plans addressing dementia-related distress; records of compassionate responses to distressed behaviour; records of programme or environment adjustments made; staff guidance on dementia and distress$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-CAR-02$$, NULL,
  $$End-of-life care planning is initiated early for students with dementia; the student's wishes (where previously expressed or knowable) and their family's involvement are documented; the college coordinates with the GP and palliative care team as needs increase$$,
  $$Reg 9$$,
  $$Advance care plans or end-of-life wishes documentation; evidence of family involvement; GP and palliative care records; records of end-of-life conversations; EHC plan review reflecting changing needs$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-RES-01$$, NULL,
  $$Where a student with dementia needs to transition out of the college to a more appropriate care setting, the transition is planned well in advance and in partnership with the student (where possible), their family, and the local authority; the EHC plan is updated to reflect changing needs$$,
  $$Reg 9$$,
  $$Transition planning records; evidence of advance planning with local authority and family; evidence of person's involvement in transition planning; EHC plan amendment records; records of handover to the next provider$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000013_residential_rehab.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed safely; a medical summary is present in every client record at the start of treatment; controlled drugs (including detoxification medication and opioid substitution therapy) are stored, prescribed, administered and disposed of in accordance with legal requirements; medicines errors are recorded and investigated$$,
  $$Reg 12$$,
  $$Medical summaries in all client records; controlled drug register and storage records; prescriptions and MAR charts; evidence of face-to-face prescriber assessment at admission; medicines disposal records; medicines error log with investigation records$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessment and care planning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A comprehensive assessment is completed for each client at admission using validated tools; this includes severity of dependence (AUDIT-C or SADQ for alcohol; substance use history for drugs), mental health screening, and physical health needs; findings are documented and inform the treatment plan$$,
  $$Reg 9$$,
  $$Admission assessments per client; AUDIT-C or SADQ records; mental health screening records; physical health assessment at admission; evidence assessment findings are reflected in the treatment plan$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$A person-centred treatment plan is in place for each client; it covers the therapeutic programme, recovery goals, discharge planning and aftercare; the client is actively involved in developing and reviewing it; plans are reviewed regularly during treatment$$,
  $$Reg 9$$,
  $$Treatment plans per client; evidence of client involvement in developing the plan; review records with dates; recovery goals documented; evidence of plan updates following client progress or changes$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$Aftercare planning begins at admission and is a core component of treatment; discharge planning covers connection to community drug and alcohol services, housing, mutual aid (AA/NA/SMART Recovery), employment support, and GP registration; a clear handover is made to community services at the point of discharge$$,
  $$Reg 9$$,
  $$Aftercare plans per client; evidence planning begins early in treatment; community service referrals at discharge; housing status at discharge; mutual aid connection records; GP registration confirmation; handover letters to community services at discharge$$,
  12
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Training and development
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-TD-01$$, NULL,
  $$All staff complete induction training before working with clients unsupported; mandatory training includes safeguarding, substance misuse awareness, withdrawal management, naloxone administration, mental health awareness, and trauma-informed practice; training is tracked and renewal timelines managed$$,
  $$Reg 18$$,
  $$Induction records; mandatory training matrix with completion dates and renewal due dates; naloxone training records; withdrawal management training; evidence of action where training is overdue$$,
  13
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-TD-02$$, NULL,
  $$Staff receive regular formal supervision and an annual appraisal; supervision records document discussion of individual clients, clinical competency, and any concerns; the registered manager provides visible clinical and operational leadership$$,
  $$Reg 18$$,
  $$Supervision records; supervision frequency against policy; appraisal records; evidence clinical practice and client-specific concerns are discussed; evidence manager is visible and accessible$$,
  14
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Mental capacity and consent
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Informed consent to treatment is obtained and documented at admission; clients are made aware of the treatment programme, its risks and their right to self-discharge; where a client's capacity may be temporarily impaired (during acute withdrawal or intoxication), capacity is assessed before major treatment decisions are made$$,
  $$Reg 11$$,
  $$Consent to treatment records; information provided to clients at admission; evidence capacity assessments were completed where impairment was a concern; records of treatment decisions and client involvement$$,
  15
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Health and wellbeing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$A physical health assessment is completed at admission; blood-borne virus (BBV) testing — including hepatitis B, hepatitis C, and HIV — is offered to every client; results are acted on and clients are supported to access treatment and specialist services where needed$$,
  $$Reg 9$$,
  $$Physical health assessment records at admission; BBV testing offer and uptake records; evidence of referral or treatment where tests are positive; hepatitis C treatment pathway records; HIV referral records$$,
  16
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$Dual diagnosis (co-occurring mental health conditions alongside substance misuse) is assessed and managed; the service has a clear pathway for accessing mental health support; clients with a dual diagnosis receive treatment that addresses both conditions concurrently rather than sequentially$$,
  $$Reg 9$$,
  $$Dual diagnosis assessment records; mental health screening tools; evidence of referrals to mental health services where needed; evidence of integrated treatment approach for clients with dual diagnosis; liaison records with mental health services$$,
  17
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$Information about each client's treatment, health status and discharge plan is shared with their GP and, where relevant, with the referring community drug and alcohol service; information sharing is documented in the client's record$$,
  $$Reg 9$$,
  $$Evidence of information sharing with GP at admission and discharge; referral-in correspondence; referrer updates during treatment; discharge summaries sent to GP and community service; evidence of consent to share information obtained$$,
  18
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-TP-01$$, NULL,
  $$The therapeutic programme is evidence-based; psychosocial interventions (CBT, DBT, 12-step facilitation, SMART Recovery, motivational interviewing, mindfulness) are delivered by staff trained in those methods; the programme is structured and provides meaningful activity throughout the day$$,
  $$Reg 9$$,
  $$Evidence of evidence-based therapeutic model; staff qualifications and training in relevant interventions; weekly programme schedule; client records evidencing participation in therapeutic activities; outcome data from therapeutic programme$$,
  21
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Complaints and feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-CF-01$$, NULL,
  $$Clients know how to raise a concern or complaint and feel safe to do so without fear of being discharged; the service has an accessible complaints procedure; complaints are investigated and responded to promptly; learning from complaints is documented$$,
  $$Reg 16$$,
  $$Complaints policy and procedure; evidence clients are informed of the complaints process at admission; complaints log with outcomes; evidence of learning applied following complaints; evidence clients feel able to raise concerns without fear$$,
  22
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-EFF-01$$, NULL,
  $$Where ARBD or dementia is identified during treatment, the treatment plan is adapted to reflect the client's cognitive capacity; therapeutic programme involvement is adjusted to what the client can meaningfully engage with; adaptations are documented and reviewed$$,
  $$Reg 9$$,
  $$Treatment plan adaptations for clients with ARBD or dementia; evidence of programme adjustments; evidence client's cognitive capacity is considered in treatment planning; review records$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-EFF-02$$, NULL,
  $$Cognitive decline or ARBD is identified through screening during or after detoxification; a clear pathway is in place to refer the client to a specialist ARBD or memory service where needed; screening results and referrals are documented$$,
  $$Reg 9$$,
  $$Cognitive screening records (MMSE, MoCA, or equivalent); ARBD screening protocol; evidence of specialist referrals where indicated; liaison records with ARBD or memory services$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-EFF-03$$, NULL,
  $$Mental capacity is assessed for specific decisions for clients with ARBD or dementia; where a client lacks capacity, a best interests process is followed; DoLS is applied for where the client lacks capacity and meets the deprivation of liberty criteria$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; best interests records; DoLS applications and authorisations where criteria are met; IMCA involvement records where no family is available$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-EFF-04$$, NULL,
  $$Nutrition and hydration needs for clients with ARBD or dementia are actively managed; thiamine supplementation is maintained; nutritional risks including Wernicke-Korsakoff-related eating difficulties are identified and acted on$$,
  $$Reg 14$$,
  $$Thiamine supplementation records; nutritional assessment records; evidence of SALT referral where swallowing concerns; weight monitoring records; GP or specialist referrals for nutrition concerns$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-CAR-01$$, NULL,
  $$Clients with ARBD or dementia are treated with compassion and without stigma; staff understand that cognitive impairment in this context is a consequence of dependence, not a character flaw; care is adapted to maintain dignity and reduce confusion or distress$$,
  $$Reg 9$$,
  $$Evidence of compassionate, non-stigmatising care for clients with ARBD; staff training on ARBD and dignity; records of care adaptations made to support clients with cognitive impairment; client or family feedback$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-CAR-02$$, NULL,
  $$Where a client with ARBD or dementia requires a transition to a specialist care setting after treatment, this is planned in partnership with the client, their family and the local authority; discharge is not made to an inappropriate setting$$,
  $$Reg 9$$,
  $$Transition planning records for clients with ARBD or dementia; evidence of local authority and family involvement in discharge planning; records of appropriate placements arranged; evidence client was not discharged to an unsuitable setting$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-RES-01$$, NULL,
  $$Where a client with ARBD or dementia cannot safely continue the standard therapeutic programme, their treatment is adapted or an appropriate alternative pathway is identified; the client is not simply discharged without a plan$$,
  $$Reg 9$$,
  $$Records of programme adaptations for clients with ARBD; evidence of alternative pathway identification; discharge planning records for clients who cannot complete the programme; evidence of coordination with other services$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000014_community_drug_alcohol.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Opioid substitution therapy (OST) is prescribed and monitored safely; a prescribing clinician reviews each client before initiating OST and at regular clinical reviews; supervised consumption (SC) arrangements are in place where clinically indicated; takeaway doses are approved by a prescriber and recorded; dose changes are authorised and documented$$,
  $$Reg 12$$,
  $$OST prescription records; evidence of prescriber assessment before initiation; supervised consumption records; takeaway dose authorisation records; dose change authorisation records; evidence of regular clinical review; controlled drug register where applicable$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessment and care planning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A comprehensive assessment is completed for each client at the start of treatment using validated tools; this includes substance use history, severity of dependence (AUDIT or SADQ for alcohol; DUDIT for drug use), mental health screening, physical health needs, and social circumstances$$,
  $$Reg 9$$,
  $$Admission assessments per client; AUDIT/SADQ or DUDIT records; mental health screening; physical health needs assessment; social circumstances assessment; evidence findings are reflected in the treatment plan$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$A person-centred care plan is in place for each client; it includes treatment goals, agreed interventions, key worker contact frequency, and a recovery plan; the client is involved in developing and reviewing the plan; plans are reviewed at a minimum every 12 weeks and following any significant change$$,
  $$Reg 9$$,
  $$Care plans per client; evidence of client involvement; review records with dates; recovery goals documented; evidence of plan updates; key worker contact frequency as agreed$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$Recovery planning addresses the broader determinants of recovery: housing, employment or purposeful activity, peer support, mutual aid (AA/NA/SMART Recovery), and family relationships; the care plan reflects a whole-person approach to sustained recovery$$,
  $$Reg 9$$,
  $$Evidence of recovery capital assessment; housing and employment status in care records; referrals to employment and housing support; mutual aid connections; evidence of whole-person approach in care planning$$,
  12
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Training and development
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-TD-01$$, NULL,
  $$All staff complete induction training before working with clients unsupported; mandatory training includes safeguarding (adults and children), substance misuse awareness, naloxone administration, domestic abuse, trauma-informed practice, and information governance; training is tracked and renewal timelines managed$$,
  $$Reg 18$$,
  $$Induction records; mandatory training matrix with completion dates and renewal due dates; naloxone training records; domestic abuse training; information governance training; evidence of action where training is overdue$$,
  13
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-TD-02$$, NULL,
  $$Staff receive regular formal supervision and an annual appraisal; supervision records document discussion of individual clients, clinical competency, risk management and any concerns; key worker caseloads are reviewed to ensure they are safe and manageable$$,
  $$Reg 18$$,
  $$Supervision records; supervision frequency against policy; appraisal records; evidence individual client risk and caseload size are discussed; evidence manager reviews caseloads$$,
  14
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Mental capacity and consent
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Informed consent to treatment is obtained and documented at the start of treatment; consent to share information with third parties (GP, probation, children's services) is obtained separately and reviewed; where a client is acutely intoxicated, significant decisions are deferred until capacity is assessed$$,
  $$Reg 11$$,
  $$Consent to treatment records; information sharing consent records per agency; evidence consent is reviewed where circumstances change; capacity assessment records where acute intoxication is a concern$$,
  15
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Health and wellbeing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$Blood-borne virus (BBV) testing — including hepatitis B, hepatitis C, and HIV — is offered to every client at the start of treatment; results are acted on promptly; the service has a clear pathway to hepatitis C treatment and HIV specialist referral; hepatitis B vaccination is offered where appropriate$$,
  $$Reg 9$$,
  $$BBV testing offer and uptake records per client; evidence of action where tests are positive; hepatitis C treatment pathway records and referrals; HIV referral records; hepatitis B vaccination records$$,
  16
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$The needle and syringe programme (NSP) operates in accordance with public health guidance; sterile equipment is dispensed without barriers to access; wound care advice is available; clients are supported to transition from injecting to safer routes of administration$$,
  $$Reg 9$$,
  $$NSP dispensing records; evidence of access without barriers; wound care advice records; evidence of safer use advice given; records of support to transition to non-injecting routes; staff training in NSP delivery$$,
  17
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$Dual diagnosis (co-occurring mental health conditions alongside substance misuse) is assessed; the service has a care pathway for clients with dual diagnosis; it works in collaboration with community mental health teams to ensure clients receive integrated care$$,
  $$Reg 9$$,
  $$Dual diagnosis screening records; care pathway for dual diagnosis clients; evidence of collaboration with CMHT; joint care planning records; evidence of referrals and liaison with mental health services$$,
  18
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-04$$, NULL,
  $$Information about each client's treatment is shared with their GP at the start of treatment and on any significant change; where a client does not have a GP, the service supports them to register with one; discharge summaries are sent to the GP at the end of treatment$$,
  $$Reg 9$$,
  $$Evidence of GP notification at treatment start; correspondence with GP during treatment; evidence of support to register with GP where not registered; discharge summaries sent to GP; evidence of consent to share information with GP$$,
  19
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-TP-01$$, NULL,
  $$The service offers a range of evidence-based treatment options; these include psychosocial interventions (CBT, motivational interviewing, SMART Recovery, 12-step facilitation), harm reduction, OST, assisted withdrawal, and relapse prevention; clients are matched to the most appropriate treatment modality for their needs$$,
  $$Reg 9$$,
  $$Evidence of treatment options offered; records of treatment modality matched to client assessment; psychosocial intervention records; OST and assisted withdrawal records; evidence of evidence-based practice model$$,
  21
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-CF-01$$, NULL,
  $$Clients know how to raise a concern or complaint and feel safe to do so; the service has an accessible complaints procedure; complaints are investigated and responded to promptly; learning from complaints is documented$$,
  $$Reg 16$$,
  $$Complaints policy and procedure; evidence clients are informed of the process; complaints log with outcomes; evidence of learning applied following complaints$$,
  22
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-EFF-01$$, NULL,
  $$A capacity assessment is completed for specific decisions for clients with ARBD or dementia; where a client lacks capacity, a best interests decision is made and documented; the service involves a family member or IMCA in the best interests process where appropriate$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; best interests records; evidence of family or IMCA involvement; records of treatment decisions made for clients lacking capacity$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-EFF-02$$, NULL,
  $$The care plan for a client with ARBD or dementia is adapted to reflect their cognitive capacity; appointment reminders, simplified written information, and involvement of a family member or carer (with consent) are considered; the plan is reviewed more frequently to reflect changing need$$,
  $$Reg 9$$,
  $$Adapted care plans for clients with ARBD or dementia; evidence of cognitive capacity adaptations; evidence of more frequent review; records of family or carer involvement; evidence of accessible information formats used$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-EFF-03$$, NULL,
  $$Where ARBD or dementia is identified, the service co-ordinates with the client's GP, a specialist ARBD service or memory clinic to ensure a formal assessment is completed and that the client receives appropriate specialist input alongside drug and alcohol treatment$$,
  $$Reg 9$$,
  $$ARBD or memory clinic referral records; liaison records with GP and specialist services; evidence of co-ordinated care planning; records of specialist assessments received and actioned$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-EFF-04$$, NULL,
  $$Nutrition and physical health risks for clients with ARBD or dementia are identified and acted on; thiamine status is assessed and supplementation is considered; the GP is informed of the client's nutritional and physical health needs$$,
  $$Reg 9$$,
  $$Physical health assessments noting ARBD-related nutritional risk; thiamine assessment or prescribing records; GP liaison records regarding nutrition and physical health; evidence of referral for nutritional support where needed$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-CAR-01$$, NULL,
  $$Clients with ARBD or dementia are treated with compassion and without stigma; staff understand that cognitive impairment in this context is a consequence of long-term alcohol dependence; care is adapted to be accessible and non-distressing$$,
  $$Reg 9$$,
  $$Evidence of compassionate, non-stigmatising approach; staff training on ARBD and dementia; records of care adaptations to reduce confusion or distress; client or family feedback$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-CAR-02$$, NULL,
  $$Where a client with ARBD or dementia requires a transition to a more supported setting (e.g. an ARBD specialist care home or supported living placement), this is planned and coordinated with the local authority and the client's family; the client is not discharged from the service without a plan$$,
  $$Reg 9$$,
  $$Transition planning records for clients with ARBD or dementia; evidence of local authority and family involvement; records of appropriate placement secured; evidence client was not discharged without a plan$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-RES-01$$, NULL,
  $$The service responds flexibly to clients with ARBD or dementia; where a client cannot independently attend appointments, home visits or outreach are offered; the service does not discharge a client for missed appointments without first assessing whether cognitive impairment is a factor$$,
  $$Reg 9$$,
  $$Records of home visits or outreach for clients with cognitive impairment; evidence of reasonable adjustments before discharge; attendance pattern review records; evidence of cognitive impairment considered before discharge$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════

-- Fixes from: 20260719000016_autism_sub_service.sql

-- ═══════════════════════════════════════════════════════════════


INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident; it covers communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like for that person; the profile is developed with the resident and their family or advocate$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles are accessible to all staff who support that person; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; this may include AAC devices, visual schedules, social stories, Makaton, PECS, or easy-read materials; all staff who support that resident know how to use the communication tools in the resident's profile$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; staff training on individual communication tools; evidence that written information is available in accessible formats$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); training records are up to date; staff can describe what autism means for each person they support$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion as appropriate; evidence staff can describe individual autism profiles; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity for a specific decision, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; evidence capacity is assumed unless evidence to the contrary; best interests records including involvement of people who know the resident$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces; changes to the environment are planned with residents in advance$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments made; quiet space provision; evidence residents were involved in any environmental changes; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; support is not one-size-fits-all; the service adjusts its approach where a resident's needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual communication and sensory needs; evidence of care plan adjustments where needs change; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds the principles of Right Support, Right Care, Right Culture (RSRCC); the culture is person-centred and not institutionalised; autistic residents are supported to have choice and control over their lives; the service exists for the people it supports, not the other way around$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in care planning and culture; staff can describe what RSRCC means in practice; evidence of individual choice and control; evidence the service is not institutionalised in its approach; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident covering communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is developed with the resident and their family or advocate$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles are accessible to all staff who support that person; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; nursing staff are trained to adapt clinical communication for autistic patients; written information including care plans, consent forms and health information is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; nursing staff training on autism and communication; evidence that written information is available in accessible formats; hospital passport or communication passport$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); nursing staff understand that autistic people may present physical health symptoms atypically and that standard pain and distress assessment tools may not be valid$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion; evidence clinical staff are aware of atypical presentation of pain and illness in autistic people$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity for a specific decision, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; evidence capacity is assumed unless evidence to the contrary; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments made; quiet space provision; evidence residents were involved in any environmental changes; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; clinical care is adapted to the individual's autism; the service adjusts its approach where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual communication and sensory needs; evidence of care plan adjustments where needs change; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds the principles of Right Support, Right Care, Right Culture (RSRCC); care is person-centred; autistic residents have choice and control over their lives and their clinical care; the service actively works to prevent inappropriate placements of younger autistic adults in nursing homes$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means in practice; evidence of individual choice and control; records of any younger autistic adults and evidence their placement is appropriate and transition-planned$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident covering communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is developed with the resident and their family$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles accessible to all staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; staff are trained to adapt communication for autistic residents; written information is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; staff training on individual communication tools; accessible written information$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); training records are up to date$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion as appropriate; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments; quiet space provision; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; support is personalised and adjusted where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual needs; evidence of care plan adjustments; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds RSRCC principles; care is person-centred; autistic residents have choice and control; the culture is not institutionalised$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means in practice; evidence of individual choice and control; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident; staff understand that autistic presentation may interact with ARBD-related cognitive impairment and that each requires distinct assessment and support$$,
  $$Reg 9$$,
  $$Individual autism profiles; evidence of distinction between autism and ARBD in assessment; profiles accessible to all staff; evidence profiles are updated$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is tailored to the autistic resident's individual needs; staff understand that ARBD may affect a resident's ability to communicate and that this is separate from autism-related communication differences$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids; evidence staff distinguish autism communication needs from ARBD cognitive effects; accessible written information$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand the distinct needs of autistic people and do not attribute autism-related behaviour to ARBD or vice versa$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence staff can distinguish autism from ARBD presentation; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation separately from any ARBD-related cognitive impairment; assessors do not conflate autism with lack of capacity$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence autism and ARBD are assessed separately; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments; quiet space provision; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care is responsive to each autistic resident's individual communication and sensory needs; support is personalised and adjusted where needs change$$,
  $$Reg 9$$,
  $$Evidence of individualised support; care records reflecting individual needs; evidence of care plan adjustments; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; care is person-centred; autistic residents have choice and control; the culture does not conflate autism with ARBD$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means; evidence of individual choice and control; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic person covering their communication needs, sensory sensitivities, triggers for distress, preferred routines, and what good support looks like in their home; the profile is shared with all support workers who visit that person$$,
  $$Reg 9$$,
  $$Individual autism profiles per person; evidence of person and family involvement; profiles shared with and read by all visiting staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Support workers are briefed on each autistic person's individual communication needs before visiting; where the person uses AAC, visual supports or specific communication strategies, support workers are trained to use them; written materials left in the home are in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles shared with support workers; evidence of AAC or communication strategy training; accessible written materials in the person's home; evidence support workers know how to communicate with each person$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All support workers who visit autistic people have completed Oliver McGowan Mandatory Training; the service prioritises consistency of support workers for autistic people to minimise distress from unfamiliar faces$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of support worker consistency rota planning for autistic people; evidence of how new workers are introduced; evidence of training in de-escalation and autism-specific support$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$Support workers respect the autistic person's sensory environment in their own home; they do not make changes to the person's home environment without prior agreement; they are aware of sensory triggers and avoid them during visits$$,
  $$Reg 10$$,
  $$Sensory needs documented in care plans; evidence support workers are briefed on sensory environment; evidence of no unrequested changes to home environment; person and family feedback$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care is responsive to each autistic person's individual communication and sensory needs in their own home; support is personalised to each visit and each person; the service adjusts its approach where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of personalised support; care records reflecting individual needs; evidence of care plan adjustments; person and family feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; support workers understand that they are guests in the autistic person's home and that support must be delivered on the person's terms; the culture values the person's autonomy and routine$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in practice; staff can describe what this means; evidence of respect for the person's home and autonomy; person and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic tenant covering communication needs, sensory sensitivities, triggers for distress, preferred routines in their flat and in communal areas, and what good support looks like for them$$,
  $$Reg 9$$,
  $$Individual autism profiles per tenant; evidence of tenant involvement; profiles accessible to all staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic tenant who needs it; support workers know and use the person's preferred communication methods; written information about the scheme and their tenancy is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per tenant; evidence of communication aids in use; accessible written information; staff training on individual communication methods$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic tenants have completed Oliver McGowan Mandatory Training; the service prioritises consistency of support workers for autistic tenants$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of support worker consistency planning; evidence of how new workers are introduced to autistic tenants$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$Sensory needs are considered in both private flats and communal areas; reasonable adjustments are made to communal space lighting, sound and layout where autistic tenants find these distressing; tenants have access to quieter areas of the scheme$$,
  $$Reg 10$$,
  $$Sensory assessments per tenant; evidence of adjustments in communal areas; evidence tenants are involved in decisions about communal spaces; staff training on sensory needs$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic tenant's individual communication and sensory needs; support is personalised; the service adjusts its approach as needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of personalised support; care records reflecting individual needs; evidence of care plan adjustments; tenant and family feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; support is delivered on the autistic tenant's terms within their own home; the culture values autonomy, routine and the person's right to live as they choose$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means; evidence of tenant autonomy and control; quality assurance records$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic person covering their communication needs, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is shared with the Shared Lives carer and any household members who interact with the person$$,
  $$Reg 9$$,
  $$Individual autism profiles; evidence of person and family involvement; profiles shared with the carer and relevant household members; evidence profiles are updated$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$The Shared Lives carer is trained in and uses the autistic person's preferred communication methods; the scheme ensures the carer has access to AAC tools, visual supports or other communication aids as needed; accessible written information is available to the person in the carer's home$$,
  $$Reg 9$$,
  $$Carer training records on individual communication methods; evidence of AAC or communication aids in the carer's home; accessible written information; evidence carer can demonstrate the person's communication methods$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All Shared Lives carers supporting autistic people have completed Oliver McGowan Mandatory Training; the scheme provides ongoing autism-specific support and training to carers; carers know how to access additional support from the scheme when needed$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for carers; evidence of ongoing autism support from the scheme; evidence carers know how to access help; carer supervision records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The sensory environment in the carer's home is assessed as part of the matching process and is adapted where possible to meet the autistic person's sensory needs; the person has access to a quiet space within the carer's home$$,
  $$Reg 10$$,
  $$Sensory assessment as part of matching; evidence of sensory adaptations in the carer's home; evidence the person has a quiet space; evidence carers understand and respect sensory needs$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Support is responsive to the autistic person's individual communication and sensory needs; where needs change the scheme reviews the match and adjusts the support or the placement accordingly$$,
  $$Reg 9$$,
  $$Evidence of responsive support; records of match reviews where needs change; evidence of care plan adjustments; person and family feedback; evidence of re-matching where current placement is not meeting need$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; the autistic person is treated as an equal member of the carer's household, not as a patient or client; the scheme actively monitors that the placement remains person-centred$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in placement monitoring; carer supervision records; evidence the person is treated as a household member; person and family feedback; quality assurance records$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$The admission assessment considers whether a client may be autistic, including undiagnosed autism; the service is aware that autistic people commonly use substances as a coping mechanism and that autism may present atypically (especially in women and people who have learned to mask); where autism is identified or suspected, the treatment plan is adapted$$,
  $$Reg 9$$,
  $$Admission assessment records; evidence of autism screening or consideration; evidence treatment plan is adapted where autism is identified or suspected; referral for formal autism assessment where appropriate$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for autistic clients who need it; information about the treatment programme, house rules, and client rights is available in accessible formats; group sessions are facilitated in a way that is accessible for autistic participants$$,
  $$Reg 9$$,
  $$Communication profiles for autistic clients; accessible written information; evidence group facilitation is adapted for autistic participants; evidence autistic clients are not excluded from therapeutic benefit due to communication or social differences$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand that autism and substance use frequently co-occur; they understand the concept of masking and do not assume an autistic person lacks insight or motivation because their presentation differs from non-autistic clients$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of substance use and autism co-occurrence awareness training; evidence staff understand masking; evidence of non-discriminatory approach to autistic clients$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The residential environment is assessed for sensory impact on autistic clients; where possible, reasonable adjustments are made to lighting, sound, and shared spaces; autistic clients have access to a quiet space within the residential setting$$,
  $$Reg 10$$,
  $$Sensory environment assessment; evidence of reasonable adjustments; evidence autistic clients have access to quiet space; client feedback on the environment$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$The therapeutic programme is adapted for autistic clients where needed; alternatives to standard group formats are considered; the service does not discharge an autistic client for non-compliance where the non-compliance reflects autism-related difference rather than unwillingness to engage$$,
  $$Reg 9$$,
  $$Evidence of programme adaptations for autistic clients; evidence of alternatives to group formats where needed; evidence that any discharge for non-compliance has been reviewed against autism needs; client feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; autistic clients are treated with dignity and without stigma; the service recognises that their substance use may be linked to their autism and does not pathologise autistic traits as resistance to treatment$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; evidence autistic traits are not misattributed to resistance; staff training on autism and substance use; client and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$The initial assessment considers whether a client may be autistic, including undiagnosed autism; the service understands that autistic people are more likely to use substances as a coping mechanism and to mask autistic traits; where autism is identified or suspected, the treatment plan is adapted$$,
  $$Reg 9$$,
  $$Admission assessment records; evidence of autism screening or consideration; evidence treatment plan is adapted where autism is identified; referral for formal autism assessment where appropriate$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for autistic clients who need it; appointment letters and written information are available in accessible formats; key workers adapt their communication style to the individual autistic client; the service assigns a consistent key worker to each autistic client where possible$$,
  $$Reg 9$$,
  $$Communication profiles for autistic clients; accessible appointment letters and information; evidence of key worker consistency; evidence of adapted communication style; evidence of accessible formats used$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand that autism and substance use frequently co-occur; they understand the concept of masking and do not interpret autistic traits as non-engagement or resistance to treatment$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of substance use and autism awareness training; evidence staff understand masking; evidence of non-discriminatory approach$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The clinic environment is assessed for sensory impact; reasonable adjustments are made to the waiting area and appointment rooms where autistic clients find these distressing; autistic clients may be offered a direct arrival pathway that avoids waiting in busy or loud reception areas$$,
  $$Reg 10$$,
  $$Evidence of sensory assessment of clinic environment; evidence of reasonable adjustments; evidence of direct arrival pathways where needed; client feedback on the environment$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Treatment is adapted for autistic clients where needed; the service does not discharge an autistic client for missed appointments or apparent non-engagement without first considering whether the non-engagement reflects unmet autism need; alternatives to standard group or clinic formats are offered$$,
  $$Reg 9$$,
  $$Evidence of treatment adaptations for autistic clients; evidence that missed appointments are reviewed against autism need before discharge; evidence of alternative formats offered; client feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; autistic clients are treated with dignity and without stigma; the service recognises that substance use may be linked to autism and does not pathologise autistic traits as resistance to treatment or lack of motivation$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; evidence autistic traits are not misattributed to resistance; staff training on autism and substance use; client feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;