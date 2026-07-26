-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Learning Disabilities, Mental Health, and End of Life sub-service
--            checklist items
--
-- These items appear only for organisations that have enabled the corresponding
-- sub-service via the Account page.
--
-- Design:
--   • service_type_id = NULL  → universal (applicable across all service types)
--   • sub_service = 'Learning Disabilities' | 'Mental Health' | 'End of Life'
--   • item_type   = 'Core'   (consistent with Autism and Dementia sub-service pattern)
--   • display_order 71–77 (LD), 81–87 (MH), 91–97 (EOL) — appear after Core and
--     Autism items within each KLOE's checklist
--
-- Step 1: Expand the sub_service CHECK constraint.
-- Step 2: Seed 7 items per sub-service across the 5 key questions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Expand sub_service CHECK constraint
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.klo_checklist_items
  DROP CONSTRAINT klo_checklist_items_sub_service_check;

ALTER TABLE public.klo_checklist_items
  ADD CONSTRAINT klo_checklist_items_sub_service_check
  CHECK (sub_service IN (
    'Residential', 'Nursing', 'Joint',
    'Dementia', 'Autism',
    'Learning Disabilities', 'Mental Health', 'End of Life'
  ));


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2A: LEARNING DISABILITIES — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE ─────────────────────────────────────────────────────────────────────

-- LD-SAF-01: Oliver McGowan Mandatory Training (Safe staffing)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-SAF-01$$, $$Learning Disabilities$$,
  $$All staff have completed Oliver McGowan Mandatory Training on Learning Disability and Autism at the tier appropriate to their role; completion is tracked and refreshers are scheduled$$,
  $$Reg 18$$,
  $$Oliver McGowan training completion records per staff member; training tier (Tier 1 or Tier 2) matched to role; refresher schedule$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- LD-SAF-02: Safeguarding — mate crime and exploitation (Safeguarding)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-SAF-02$$, $$Learning Disabilities$$,
  $$Safeguarding training and referral practice covers forms of abuse specific to people with learning disabilities, including mate crime, cuckooing, county lines exploitation and online radicalisation; staff can recognise signs and know how to refer$$,
  $$Reg 13$$,
  $$Safeguarding training records covering LD-specific abuse types; referral log; evidence of local authority engagement where referrals have been made$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE ─────────────────────────────────────────────────────────────────

-- LD-EFF-01: Communication needs and easy-read information (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-EFF-01$$, $$Learning Disabilities$$,
  $$Communication needs are assessed for each person with a learning disability; information, choices and explanations are presented in formats they can understand, including easy-read, Makaton, PECS or pictorial resources as appropriate$$,
  $$Reg 9$$,
  $$Communication needs assessments; examples of easy-read documents or pictorial care plans; PECS or Makaton resources; evidence communication preferences are reflected in daily practice$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- LD-EFF-02: Decision-specific MCA (Consent to care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-EFF-02$$, $$Learning Disabilities$$,
  $$Mental Capacity Act assessments are decision-specific, time-specific and documented for every significant decision; fluctuating capacity is monitored; Best Interests decisions involve the person, family or advocate and are recorded$$,
  $$Reg 11$$,
  $$Decision-specific MCA assessment records; Best Interests meeting notes or checklists; evidence of family or IMCA involvement; records of fluctuating capacity monitoring$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── CARING ───────────────────────────────────────────────────────────────────

-- LD-CAR-01: Supported decision-making and least restrictive practice (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-CAR-01$$, $$Learning Disabilities$$,
  $$Supported decision-making is embedded in care planning; staff explore least restrictive options before any restriction is introduced and document the evidence base; every restriction is authorised, reviewed regularly and reduced or removed when no longer needed$$,
  $$Reg 9$$,
  $$Care plans showing supported decision-making approach; least restrictive option analysis; DoLS/LPS authorisation and review records; evidence of restrictions being reduced or removed$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE ───────────────────────────────────────────────────────────────

-- LD-RES-01: Right Support, Right Care, Right Culture self-assessment (Equity in experiences)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-RES-01$$, $$Learning Disabilities$$,
  $$The service has completed a self-assessment against Right Support, Right Care, Right Culture (RSRCC) expectations; findings are used in the improvement plan; the service can demonstrate how its culture, environment and practice promote community inclusion and independence$$,
  $$Reg 9$$,
  $$RSRCC self-assessment document; improvement actions arising from the assessment; evidence of community inclusion activities; outcome-focused care planning examples$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED ─────────────────────────────────────────────────────────────────

-- LD-WEL-01: PBS governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$LD-WEL-01$$, $$Learning Disabilities$$,
  $$Positive Behavioural Support (PBS) plans are in place for individuals who present with behaviour that challenges; plans are written or reviewed with a PBS-trained practitioner, reviewed regularly and used to reduce the need for restrictive interventions; data on restrictive interventions is collected and reviewed$$,
  $$Reg 17$$,
  $$PBS plans per individual; PBS practitioner credentials; restrictive intervention data; governance meeting minutes showing review of PBS data; evidence of reduced restrictive practice over time$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2B: MENTAL HEALTH — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE ─────────────────────────────────────────────────────────────────────

-- MH-SAF-01: Mental health crisis escalation (Safeguarding)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-SAF-01$$, $$Mental Health$$,
  $$Staff can identify signs of deteriorating mental health and have a clear, documented escalation pathway; out-of-hours mental health crisis contacts (CRHT, on-call psychiatrist) are known, accessible and up to date$$,
  $$Reg 12$$,
  $$Mental health escalation pathway document; out-of-hours crisis contact list; staff training records on mental health awareness; examples of escalation having been used appropriately$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- MH-SAF-02: Section 17 leave (Safe systems, pathways and transitions)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-SAF-02$$, $$Mental Health$$,
  $$Where Section 17 leave applies, leave arrangements are risk-assessed, documented, escorted where required, reviewed regularly by the Responsible Clinician and clearly communicated to care staff$$,
  $$Reg 12$$,
  $$Section 17 leave forms per individual; risk assessments; escort arrangements; evidence of RC review; records of any leave that was cancelled or restricted and the clinical rationale$$,
  82
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- MH-SAF-03: MHA administration training (Safe staffing)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-SAF-03$$, $$Mental Health$$,
  $$Staff involved in Mental Health Act administration understand their responsibilities; the AMHP and Nearest Relative roles and processes are understood by managers; MHA training is completed and refreshed at appropriate intervals$$,
  $$Reg 18$$,
  $$MHA training completion records; evidence of AMHP contact arrangements; manager awareness of Nearest Relative process; any MHA compliance audit results$$,
  83
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE ─────────────────────────────────────────────────────────────────

-- MH-EFF-01: MHA detention status, CTO and IMHA (Consent to care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-EFF-01$$, $$Mental Health$$,
  $$Mental Health Act detention status, section expiry dates and any Community Treatment Order conditions are clearly recorded, monitored and reviewed; access to an Independent Mental Health Advocate (IMHA) is offered, documented and facilitated$$,
  $$Reg 11$$,
  $$MHA section paperwork and expiry tracking; CTO conditions documentation; IMHA referral records; evidence IMHA access was offered and facilitated$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── CARING ───────────────────────────────────────────────────────────────────

-- MH-CAR-01: Recovery-focused care planning (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-CAR-01$$, $$Mental Health$$,
  $$Care plans are recovery-focused; the person's own goals, strengths, coping strategies and self-management skills are central to the plan; plans are co-produced with the individual and reviewed with them regularly$$,
  $$Reg 9$$,
  $$Recovery-focused care plans showing person's goals and strengths; evidence of co-production in plan reviews; Wellness Recovery Action Plans (WRAPs) or equivalent; outcome measurement tools$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE ───────────────────────────────────────────────────────────────

-- MH-RES-01: Tribunals and Managers' Hearings (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-RES-01$$, $$Mental Health$$,
  $$Mental Health Review Tribunal and Hospital Managers' Hearing arrangements are managed in a timely way; required reports are submitted on time; individuals are supported to attend and participate, including access to legal representation$$,
  $$Reg 9$$,
  $$Tribunal scheduling records; reports submitted on time; evidence of legal representation access; records of patient support provided; outcomes and any directions from Tribunals$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED ─────────────────────────────────────────────────────────────────

-- MH-WEL-01: DoLS/LPS interface with MHA (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$MH-WEL-01$$, $$Mental Health$$,
  $$Managers understand the interface between the Mental Health Act and the Mental Capacity Act / Deprivation of Liberty Safeguards (DoLS) / Liberty Protection Safeguards (LPS); any deprivation of liberty for an informal patient is recognised and referred; DoLS/LPS authorisations are applied for, monitored and reviewed at expiry$$,
  $$Reg 17$$,
  $$DoLS/LPS application records; authorisation monitoring log; evidence that informal patients are assessed for unlawful deprivation of liberty; manager training records on MHA/MCA interface$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2C: END OF LIFE — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE ─────────────────────────────────────────────────────────────────────

-- EOL-SAF-01: DNACPR / ReSPECT (Managing risks during care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-SAF-01$$, $$End of Life$$,
  $$DNACPR decisions are made in advance for people approaching end of life; decisions are recorded on ReSPECT forms (or equivalent), are accessible to clinical and care staff at point of need, signed by an appropriate clinician, and reviewed at least six-monthly or after any significant change in condition$$,
  $$Reg 12$$,
  $$ReSPECT or DNACPR forms per individual; evidence of clinician sign-off; review dates and records; evidence forms are accessible out of hours; any ambulance or hospital transfer documentation referencing DNACPR status$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- EOL-SAF-02: Anticipatory (just-in-case) medicines (Safe medicines and treatments)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-SAF-02$$, $$End of Life$$,
  $$Anticipatory ("just-in-case") medicines are prescribed and held in stock for people identified as approaching end of life; all relevant staff understand the indications for use and the process for administering or escalating to a prescriber$$,
  $$Reg 12$$,
  $$Anticipatory medicine prescriptions and stock records; protocol for use and escalation; staff training or competency records on end of life medicines; evidence medicines are reviewed as condition changes$$,
  92
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE ─────────────────────────────────────────────────────────────────

-- EOL-EFF-01: Advance Care Planning (Consent to care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-EFF-01$$, $$End of Life$$,
  $$Advance Care Plans are offered, completed in a person-led way and document wishes about resuscitation, hospitalisation and preferred place of death; any Lasting Power of Attorney (LPA) for health and welfare, or Advance Decision to Refuse Treatment (ADRT), is identified and filed with the care record$$,
  $$Reg 11$$,
  $$Advance Care Plans per individual; LPA and ADRT records; evidence conversations were offered and documented; evidence plans are reviewed and updated as condition changes$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── CARING ───────────────────────────────────────────────────────────────────

-- EOL-CAR-01: Gold Standards Framework and preferred place of care (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-CAR-01$$, $$End of Life$$,
  $$The service has a documented commitment to enabling individuals to die in their preferred place of care where clinically possible; Gold Standards Framework (or equivalent structured approach) is embedded; a GSF or equivalent register is maintained and reviewed regularly$$,
  $$Reg 9$$,
  $$GSF register or equivalent; evidence of preferred place of care discussions and documentation; records of deaths at preferred location vs. hospital; evidence of structured palliative care review meetings$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- EOL-CAR-02: Bereavement support (Kindness, compassion and dignity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-CAR-02$$, $$End of Life$$,
  $$Families and close contacts are supported sensitively after a death; a bereavement support process is in place including a condolence contact, signposting to bereavement services and, where appropriate, a referral; staff receive a debrief after each death to support wellbeing$$,
  $$Reg 10$$,
  $$Bereavement support policy and process; records of condolence contacts or letters; referrals to bereavement services; staff debrief records after deaths$$,
  92
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE ───────────────────────────────────────────────────────────────

-- EOL-RES-01: Palliative care team liaison (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-RES-01$$, $$End of Life$$,
  $$When a person enters the dying phase, the service liaises promptly with the GP, specialist palliative care team and hospice (where relevant); a Named Nurse or Key Worker is identified for end of life care coordination; out-of-hours arrangements are clear and communicated to the family$$,
  $$Reg 12$$,
  $$Evidence of GP and palliative care team contact in the dying phase; Named Nurse or Key Worker allocation; out-of-hours contact arrangements; family communication records$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED ─────────────────────────────────────────────────────────────────

-- EOL-WEL-01: AMBER Care Bundle governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EOL-WEL-01$$, $$End of Life$$,
  $$The AMBER Care Bundle (or equivalent structured escalation tool, e.g. Coordinate My Care, RESPECT process) is used to prompt timely, structured conversations and documentation when a person's condition is deteriorating and the clinical team is uncertain about recovery; its application is audited and learning is shared with staff$$,
  $$Reg 17$$,
  $$AMBER Care Bundle or equivalent documentation; evidence of structured deterioration conversations; audit of Bundle completion rates; learning from audit shared at governance meetings$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
