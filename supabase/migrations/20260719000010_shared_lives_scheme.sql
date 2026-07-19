-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Shared Lives Scheme — Core checklist items + Dementia sub-service
--
-- Key Shared Lives differences from other service types:
--   • Care is delivered in the Shared Lives Carer's (SLC's) own family home —
--     not a care home or service premises
--   • SLCs are self-employed; the scheme recruits, trains, assesses and supports
--     them; link workers (coordinators) provide ongoing supervision and monitoring
--   • A rigorous matching process determines compatibility between the person
--     placed and the carer (and the carer's family) before placement begins
--   • CQC only inspects Shared Lives where personal care is provided
--   • "Right support, right care, right culture" guidance applies — most schemes
--     primarily support people with learning disabilities and/or autistic people
--   • Pre-employment DBS and safer recruitment checks are required for BOTH
--     scheme staff/coordinators AND shared lives carers (and adult household members)
--   • Medicines are administered by the shared lives carer in their home —
--     medicines governance must cover the carer's home environment
--   • DoLS MAY apply — the person lives in the carer's home and, depending on
--     mental capacity and restrictions, may be deprived of liberty; MCA applies
--     throughout; DoLS assessments must be requested where criteria are met
--   • Placements include long-term, short breaks (respite), and day support
--   • Safeguarding takes place in a private household — additional considerations
--     around visibility, access and carer accountability
--   • Inspections are typically announced with 48 hours' notice
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A risk assessment is completed for each person placed with a shared lives carer before or at the start of placement; it covers the carer's home environment, the person's known risks, and the carer's family composition; assessments are reviewed following any incident or change in the placement$$,
  $$Reg 12$$,
  $$Risk assessments per placement; date of last review; evidence of updates following incidents or changes; home environment assessment records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$The carer's home is assessed and approved by the scheme before any placement; home assessments are repeated at defined intervals and following any significant change in the carer's household (new occupant, renovation, carer health change)$$,
  $$Reg 12$$,
  $$Home assessment records with approval dates; reassessment schedule; evidence of reassessment following household changes; sign-off by scheme manager or coordinator$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$Emergency and out-of-hours support is available to shared lives carers at all times; carers know how to access the on-call coordinator; response arrangements are documented and communicated to every active carer$$,
  $$Reg 12$$,
  $$Out-of-hours rota or on-call log; evidence carers have been informed of emergency contact arrangements; records of out-of-hours calls and actions taken$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safeguarding
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$The scheme has a safeguarding policy that addresses the specific context of care in a private household; all coordinators and shared lives carers receive safeguarding training appropriate to their role; training records are maintained and renewals tracked$$,
  $$Reg 13$$,
  $$Safeguarding policy; coordinator and carer training records; training completion rates; evidence of refresher training; policy review date$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$Safeguarding concerns are identified, reported, and acted on promptly; coordinators make regular monitoring visits to carer homes that include direct observation of the living environment and, where possible, private conversations with the person placed; concerns are escalated to the local authority safeguarding team where required$$,
  $$Reg 13$$,
  $$Safeguarding referral log; monitoring visit records; evidence of private conversations with people placed; records of escalations and outcomes; correspondence with local authority safeguarding$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$All adult members of a shared lives carer's household are subject to appropriate checks before a placement begins; the scheme holds records of these checks and has a clear policy on what household member checks are required$$,
  $$Reg 13$$,
  $$Household member check records; scheme policy on household checks; evidence checks are completed before placement start; review process when a new adult moves into the carer's home$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Staffing and recruitment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$Safer recruitment is applied to both scheme staff (coordinators and managers) and shared lives carers; this includes DBS checks at the appropriate level, references, identity verification, and structured interviews; records are held for each and renewal timelines are tracked$$,
  $$Reg 19$$,
  $$Staff and carer recruitment files; DBS certificates and renewal dates; reference records; interview notes; evidence that recruitment process was completed before start date$$,
  7
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$The scheme has enough coordinators to maintain regular supervision and monitoring visits to all active placements; coordinator caseloads are reviewed and managed to ensure no placement is under-monitored; the scheme has a process to manage caseloads during coordinator absence$$,
  $$Reg 18$$,
  $$Coordinator caseload records; monitoring visit schedule and completion log; evidence of cover arrangements during absence; management review of caseload levels$$,
  8
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Medicines management
-- ════════════════════════════════════════════════════════════════════════════

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
WHERE ki.title = $$Medicines management$$ AND kq.name = $$Safe$$
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
WHERE ki.title = $$Medicines management$$ AND kq.name = $$Safe$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care and dignity
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$People placed by the scheme are treated as individuals and are supported to live as part of the carer's family where they choose to; care is person-centred and respects the person's preferences, interests and identity; coordinators obtain direct feedback from people placed during monitoring visits$$,
  $$Reg 9$$,
  $$Support plan person-centred sections; feedback from people placed (during coordinator visits or surveys); evidence that care reflects individual preferences; monitoring visit records noting person's presentation and expressed satisfaction$$,
  21
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$People's independence and choices are actively promoted; the carer and scheme support people to make decisions about their daily lives, pursue interests, maintain family and community relationships, and live as independently as possible; dependency on the carer is not created or reinforced where it can be avoided$$,
  $$Reg 10$$,
  $$Support plan independence goals; evidence of activities and community access; records of family and relationship maintenance support; coordinator visit notes evidencing promotion of independence$$,
  22
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$CAR-IC-03$$, NULL,
  $$People's privacy and dignity are respected in the carer's home; the person has their own private space and their belongings are respected; the scheme's policy addresses privacy and dignity in a shared household setting$$,
  $$Reg 10$$,
  $$Scheme privacy and dignity policy (covering shared household context); coordinator visit records noting privacy observations; support plans addressing personal space and privacy; evidence of actions where privacy concerns were raised$$,
  23
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Carer wellbeing
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Complaints and feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and oversight
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$The scheme has a governance framework covering all aspects of carer approval, placement management, monitoring, and performance review; audits are conducted regularly and findings are acted on; governance records are up to date and accessible to the CQC$$,
  $$Reg 17$$,
  $$Governance framework documents; audit schedule and completed audit records; evidence actions from audits are completed; management oversight records; CQC registration and notification records$$,
  31
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$The scheme maintains an accurate register of all active shared lives carers including their approval status, approval conditions, last DBS renewal, last annual review, and the placements they are currently supporting$$,
  $$Reg 17$$,
  $$Carer register; approval records with conditions; DBS renewal tracker; annual review completion log; placement-to-carer mapping records; evidence register is reviewed and updated regularly$$,
  32
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Incidents and near misses are reported, recorded and investigated; the scheme has a Duty of Candour policy and fulfils its duty when something goes wrong; notifiable incidents are reported to the CQC within the required timeframe$$,
  $$Reg 17, Reg 20$$,
  $$Incident log; investigation records and outcomes; evidence of notifications to CQC where required; Duty of Candour records; evidence of learning shared with carers and coordinators following significant incidents$$,
  33
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$WEL-GM-04$$, NULL,
  $$The scheme has a partnership agreement or working protocol with the local authority placing team; the protocol covers referral, matching, placement review, shared responsibilities, and escalation pathways$$,
  $$Reg 17$$,
  $$Partnership or working protocol with local authority; evidence of regular liaison with placing team; joint review records; escalation process documentation; evidence protocol is reviewed periodically$$,
  34
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-SAF-01$$, NULL,
  $$Where a person placed has dementia, a risk assessment specific to dementia-related risks is in place; this covers wandering and getting lost, vulnerability in the community, altered perception, and fire and kitchen safety in the carer's home$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments; evidence of home adaptations or safety measures in the carer's home; records of any incidents related to wandering or disorientation; coordinator visit records noting dementia risk management$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-SAF-02$$, NULL,
  $$Shared lives carers supporting people with dementia have received dementia-specific training; training covers understanding dementia, communication strategies, and responding to distressed behaviour without restraint$$,
  $$Reg 18$$,
  $$Dementia training records for relevant carers; training completion dates; evidence carers can describe dementia-specific care approaches; coordinator visit notes evidencing carer competence in dementia care$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-SAF-03$$, NULL,
  $$Where restraint is used for a person with dementia, it is lawful, proportionate and documented; the scheme has a clear policy on restraint that carers understand; any use of restraint is reported and reviewed$$,
  $$Reg 13$$,
  $$Restraint policy; evidence carers understand the policy; records of any restraint episodes with rationale and review; DoLS authorisation where relevant; coordinator oversight records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-WEL-01$$, NULL,
  $$The scheme's governance includes dementia-specific audit and oversight; this covers review of care plans, DoLS compliance, medicines management, and carer training for all placements involving people with dementia$$,
  $$Reg 17$$,
  $$Dementia audit records; DoLS compliance review; medicines audit records for dementia placements; training compliance records for carers supporting people with dementia; management review of dementia-specific outcomes$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$DEM-WEL-02$$, NULL,
  $$The scheme learns from dementia-related incidents and near misses; learning is shared with carers and coordinators in a way they can understand and act on; the scheme's dementia-specific practices are reviewed and updated in line with current guidance$$,
  $$Reg 17$$,
  $$Dementia incident records and outcomes; evidence learning has been shared with carers; evidence scheme practices align with current dementia care guidance; records of any practice changes made in response to incidents or guidance updates$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
