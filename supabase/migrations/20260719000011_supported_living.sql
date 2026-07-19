-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Supported Living — Core checklist items + Dementia sub-service
--
-- Key Supported Living differences from other service types:
--   • People hold their own tenancy or licence agreements — care and
--     accommodation are provided under SEPARATE contracts; CQC regulates
--     the care only, not the premises
--   • Staff work in people's own homes — lone working protocols apply;
--     the home is not a care facility and cannot be treated as one
--   • "Right support, right care, right culture" guidance applies — the
--     majority of people supported have a learning disability and/or autism
--   • Overnight arrangements vary per person: some have waking night staff,
--     some sleep-in, some have no overnight support; this must reflect each
--     person's assessed needs, not service convenience
--   • Positive Behaviour Support (PBS) framework applies where people
--     have behaviours that challenge; restrictive practices must be the
--     last resort, lawful, proportionate, and documented
--   • DoLS position is person-specific: holding a tenancy does not
--     automatically prevent a deprivation of liberty; where continuous
--     supervision and control mean the person is not free to leave, DoLS
--     via the local authority as supervisory body must be applied for
--   • No pendant/telecare system (unlike ECH) and no communal dining
--   • People may live alone in their own flat or in shared accommodation
--     where they hold a tenancy for their bedroom and share communal areas
--   • Communication: many people use AAC, Makaton, PECS, or other
--     alternative communication methods; support plans must reflect this
--   • Independence promotion is not optional — staff are there to support
--     people to do things, not to do things for them
--   • Annual LD health checks via GP Enhanced Service are a specific
--     evidence requirement; hospital passports must be maintained
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A risk assessment is completed for each person before support begins; it covers risks within their home, in the community, and arising from their specific needs; assessments are updated following any incident or change in the person's circumstances$$,
  $$Reg 12$$,
  $$Risk assessments per person; date of last review; evidence of updates following incidents or changes; separate property risk assessment where relevant$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$Risk management reflects a positive risk-taking approach; people are not prevented from doing things simply because of risk; risk assessments document what the risk is, what mitigations are in place, and how the person was involved in the decision$$,
  $$Reg 12$$,
  $$Risk assessments evidencing person's involvement in risk decisions; records of risk-enabling decisions and outcomes; evidence staff are trained in positive risk-taking; no blanket restrictions without individual MCA-supported rationale$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$Lone working protocols are in place for all staff working alone in a person's home; staff know how to raise an alert if they feel unsafe; the provider monitors lone worker check-ins and responds to any missed check-ins$$,
  $$Reg 12$$,
  $$Lone working policy; evidence staff have been trained in lone working procedures; lone worker check-in logs or electronic monitoring records; records of actions taken following missed check-ins$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Overnight support arrangements (waking night, sleep-in, or no overnight cover) reflect each person's individual assessed needs; overnight arrangements are documented in the support plan and are not determined by cost or rota convenience alone$$,
  $$Reg 12$$,
  $$Support plans documenting overnight arrangements with rationale; evidence overnight level is based on individual assessment; sleep-in or waking night rotas; evidence of review when needs change overnight$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safeguarding
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$The service has a safeguarding policy that addresses the specific context of a supported living setting; all staff receive safeguarding training at the appropriate level; training records are maintained and renewal timelines are tracked$$,
  $$Reg 13$$,
  $$Safeguarding policy; staff training records; training completion rates and renewal dates; evidence policy is reviewed and up to date$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$Safeguarding concerns are identified, reported, and escalated promptly; the service recognises that people with learning disabilities or autism may have difficulty reporting abuse themselves and ensures staff are vigilant; referrals to the local authority safeguarding team are made without delay where required$$,
  $$Reg 13$$,
  $$Safeguarding referral log with outcomes; evidence staff can describe how to recognise and report abuse; records of how people with communication needs were supported to make or inform a safeguarding referral; correspondence with local authority safeguarding$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$Restrictive practices are used only as a last resort, are lawful, proportionate, and individually authorised; a Positive Behaviour Support (PBS) plan is in place for any person for whom restrictive practices may be used; any restriction is reviewed regularly and reduced where possible$$,
  $$Reg 13$$,
  $$PBS plans where relevant; restrictive practice log; evidence of MCA or DoLS authorisation for any restriction; evidence of regular review and reduction of restrictions; PBS lead or trained staff records$$,
  7
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Staffing and recruitment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$Safer recruitment is applied to all staff; this includes enhanced DBS checks, two references, identity verification, employment history check, and structured interview; a registered manager is in post and their registration with CQC is current$$,
  $$Reg 19$$,
  $$Staff recruitment files; DBS certificates and renewal dates; reference records; employment history gap checks; interview records; CQC registered manager certificate$$,
  8
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$Staffing levels and rotas are based on each person's assessed needs; the service maintains consistent staff teams for each person to ensure familiarity, trust and effective communication; there is a clear plan for managing staffing gaps or absences without disrupting the person's routine$$,
  $$Reg 18$$,
  $$Staffing rotas; evidence rotas reflect individual assessed needs; consistency of key staff per person; evidence of how gaps are managed; records of agency or bank staff use and steps to maintain consistency$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Medicines management
-- ════════════════════════════════════════════════════════════════════════════

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
WHERE ki.title = $$Medicines management$$ AND kq.name = $$Safe$$
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
WHERE ki.title = $$Medicines management$$ AND kq.name = $$Safe$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Independence, choice and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$People are empowered to make choices and decisions about every aspect of their lives including their daily routine, food, activities, and relationships; staff support people to make decisions rather than making decisions for them$$,
  $$Reg 10$$,
  $$Support plans evidencing person's choices and preferences; evidence staff use a support approach not a doing-for approach; records of how choices were supported in practice; feedback from people supported and their families$$,
  21
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$People's tenancy rights are fully respected; people can have visitors, maintain relationships, decorate their home, and come and go as they choose; any restriction on these rights requires individual MCA-based justification$$,
  $$Reg 10$$,
  $$Support plans noting tenancy rights; evidence of visitor arrangements; evidence that restrictions on visitors or freedom of movement have individual MCA justification; no blanket visitor restrictions$$,
  22
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-03$$, NULL,
  $$Support plans include meaningful goals and aspirations set by the person; progress towards goals is tracked; staff actively work with people to achieve outcomes that may have previously been thought not possible$$,
  $$Reg 9$$,
  $$Goals and aspirations in support plans; evidence of progress tracking; records of goals achieved; evidence goals are set by the person not the service; review records updating goal progress$$,
  23
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Right support, right care, right culture
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Complaints and feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A registered manager is in post and registered with the CQC; the manager is visible and accessible to staff and people supported; there is a clear management structure with defined responsibilities$$,
  $$Reg 17$$,
  $$CQC registered manager certificate; evidence of manager visibility and accessibility; management structure chart; records of manager involvement in oversight and decision-making$$,
  27
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Governance systems include regular audits of care quality, support plans, medicines, and risk assessments; audit findings are acted on and learning is shared with staff; quality improvement plans are in use and show measurable progress$$,
  $$Reg 17$$,
  $$Audit schedule and completed audit records; evidence actions from audits are completed; quality improvement plans with progress evidence; management review records; policies reviewed and up to date$$,
  28
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Incidents and near misses are reported, recorded and investigated; the service fulfils its Duty of Candour when something goes wrong; notifiable incidents are reported to the CQC within the required timeframe$$,
  $$Reg 17, Reg 20$$,
  $$Incident log; investigation records and outcomes; CQC notifications where required; Duty of Candour records; evidence of learning shared with staff; evidence of actions taken to prevent recurrence$$,
  29
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-04$$, NULL,
  $$Staff wellbeing is actively monitored; the specific risks of lone working are recognised and mitigated; staff are encouraged to raise concerns without fear of reprisal; a speak-up or whistleblowing policy is in place$$,
  $$Reg 17$$,
  $$Lone working policy; staff wellbeing records; speak-up or whistleblowing policy; evidence staff are aware of and feel safe to use it; staff survey or feedback records; evidence concerns raised have been investigated and acted on$$,
  30
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-SAF-01$$, NULL,
  $$Where a person supported has dementia, a dementia-specific risk assessment is in place covering wandering and getting lost, vulnerability in the community, altered perception, and safety within the home environment$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments; evidence of home safety measures; records of incidents related to wandering or disorientation; evidence of community safety measures where relevant$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-SAF-02$$, NULL,
  $$Staff supporting people with dementia have received dementia-specific training covering understanding dementia, communication strategies, and responding to distressed behaviour without restraint$$,
  $$Reg 18$$,
  $$Dementia training records for relevant staff; training completion dates; evidence staff can describe dementia-specific approaches; observation records evidencing appropriate staff responses$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-SAF-03$$, NULL,
  $$Where restraint is used for a person with dementia, it is lawful, proportionate, and documented; the service has a clear restraint policy that staff understand; any use of restraint is reported and reviewed$$,
  $$Reg 13$$,
  $$Restraint policy; evidence staff understand the policy; records of any restraint episodes with rationale, authorisation, and review; DoLS authorisation where relevant$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-WEL-01$$, NULL,
  $$The service's governance includes dementia-specific oversight covering care plan quality, DoLS compliance, medicines management, and staff training for all people supported with dementia$$,
  $$Reg 17$$,
  $$Dementia audit records; DoLS compliance review; medicines audit records; training compliance records for staff supporting people with dementia; management review of dementia-specific outcomes$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$DEM-WEL-02$$, NULL,
  $$The service learns from dementia-related incidents and near misses; learning is shared with staff; dementia-specific practices are reviewed and updated in line with current guidance$$,
  $$Reg 17$$,
  $$Dementia incident records and outcomes; evidence learning has been shared with staff; evidence practice aligns with current dementia care guidance; records of practice changes following incidents or guidance updates$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
