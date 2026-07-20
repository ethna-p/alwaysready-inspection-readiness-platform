-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Specialist College — Core checklist items + Dementia sub-service
--
-- Key Specialist College differences from other service types:
--   • Dual registration: CQC regulates personal care; Ofsted regulates
--     education — the provider must satisfy both regulators
--   • Students (typically 16–25) hold Education, Health and Care (EHC)
--     plans funded by the local authority; annual EHC plan reviews are a
--     statutory requirement
--   • Education is the primary purpose — independence skills, functional
--     skills, communication, vocational skills and community participation
--     are expected learning outcomes, not extras
--   • A mix of day students and residential students; CQC regulates
--     personal care for both; residential premises are regulated as a
--     care home (CQC has jurisdiction over premises, unlike supported living)
--   • DoLS CAN and DOES apply for residential students who lack capacity
--     and are under continuous supervision and control
--   • Transition planning is a specific quality indicator: into the college
--     (from school or children's services) and out (to supported living,
--     employment, further education, or adult social care)
--   • "Right support, right care, right culture" guidance applies — the
--     student population primarily has learning disabilities and/or autism
--   • Positive Behaviour Support (PBS) applies where students have
--     behaviours that challenge; restrictive practices must be lawful,
--     proportionate, and individually authorised
--   • Complex health needs are common: epilepsy (including buccal
--     midazolam protocols), physical disabilities, swallowing difficulties,
--     complex communication needs
--   • Safeguarding has education-specific elements: a Designated
--     Safeguarding Lead (DSL), Prevent duty, missing from education
--     protocols, and county lines awareness for older students
--   • Dementia sub-service: people with Down syndrome have a
--     significantly elevated risk of early-onset Alzheimer's disease;
--     colleges supporting adults with Down syndrome must be prepared
--     to identify and manage cognitive decline
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A risk assessment is completed for each student covering their health and care needs, their behaviour, and the residential or day environment; assessments are updated following any incident or change in needs and are shared with relevant care and education staff$$,
  $$Reg 12$$,
  $$Risk assessments per student; date of last review; evidence of updates following incidents or changes; evidence care and education staff both have access to relevant risk information$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$Complex health needs are identified and managed safely; where students have epilepsy, emergency medication protocols (such as buccal midazolam) are in place and staff are trained and competent to administer them; protocols are reviewed by an appropriate health professional$$,
  $$Reg 12$$,
  $$Emergency medicines protocols per student (buccal midazolam, EpiPen, etc.); staff competency assessments; evidence protocols have been reviewed by a GP, nurse or specialist; records of administration of emergency medicines; incident records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$The residential premises are safe, well-maintained and meet all relevant building and fire safety requirements; fire risk assessments are current; personal emergency evacuation plans (PEEPs) are in place for all residential students$$,
  $$Reg 12, Reg 15$$,
  $$Fire risk assessment; fire drill records; PEEP records per residential student; building maintenance log; evidence any maintenance issues are addressed promptly; CQC premises inspection readiness$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$The college has a Designated Safeguarding Lead (DSL) who is trained to the appropriate level; the DSL role covers both the care and education functions of the college; all staff receive safeguarding training appropriate to their role; training records are maintained$$,
  $$Reg 13$$,
  $$DSL appointment and training records; safeguarding training records for all staff (care and education); evidence DSL is accessible to both care and education staff; safeguarding policy review date$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$Safeguarding concerns are identified, reported and escalated promptly; the college meets its Prevent duty and has processes to identify students who may be vulnerable to radicalisation; county lines and exploitation risks are recognised for older students$$,
  $$Reg 13$$,
  $$Safeguarding referral log; Prevent training records; evidence of contextual safeguarding awareness; county lines awareness training; correspondence with local authority safeguarding; records of any Prevent referrals$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$The college has a clear protocol for managing planned and unplanned absences including home leave, missing from education, and students who fail to return; absences are monitored and responded to promptly$$,
  $$Reg 13$$,
  $$Absence and home leave policy; missing from education protocol; records of absences and returns; evidence of actions taken when students fail to return as expected; communication records with families and local authority when students are absent$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-SG-04$$, NULL,
  $$Restrictive practices are used only as a last resort, are lawful, proportionate and individually authorised; a Positive Behaviour Support (PBS) plan is in place for any student for whom restrictive practices may be used; restrictions are reviewed regularly and reduced where possible$$,
  $$Reg 13$$,
  $$PBS plans where relevant; restrictive practice log; evidence of MCA or DoLS authorisation for any restriction; evidence of regular review and reduction of restrictions; PBS-trained staff records$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$Safer recruitment is applied to all staff including care workers, teachers, support workers, therapists and ancillary staff; this includes enhanced DBS checks, two references, identity verification, and structured interview; records are held for all staff$$,
  $$Reg 19$$,
  $$Recruitment files for all staff categories; DBS certificates and renewal dates; reference records; interview notes; evidence recruitment was completed before unsupervised access to students$$,
  8
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$Staffing levels across care and education functions are sufficient to meet the needs of all students; residential staffing at night reflects individual assessed needs; there is a clear plan for managing staff absence$$,
  $$Reg 18$$,
  $$Staffing rotas (care and education); evidence rotas reflect individual student needs; night-time staffing records; evidence of how gaps are managed; records of agency or bank staff use$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed safely for all students in receipt of personal care; MAR charts are accurately maintained; staff administering medicines are assessed as competent; PRN protocols are in place for as-needed medicines; medicines errors are recorded and investigated$$,
  $$Reg 12$$,
  $$MAR charts; medicines competency assessments; PRN protocols; medicines error log; evidence of investigation and learning following errors; medicines audit records$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A person-centred care and support plan is in place for each student in receipt of personal care; it is aligned with but distinct from the EHC plan; the student and their family or advocate are involved in developing and reviewing it$$,
  $$Reg 9$$,
  $$Care and support plans per student; evidence of student and family involvement in plan development; evidence of alignment with EHC plan goals; review records; advocate involvement records$$,
  11
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Independence, choice and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Students are empowered to express their views and make choices about their daily lives, learning, and care; student voice is gathered through accessible formats (easy read, visual surveys, keyworker conversations); student feedback is acted on and students see the results$$,
  $$Reg 10$$,
  $$Student feedback records in accessible formats; evidence of student involvement in their own planning; evidence feedback has been acted on; student council or representative group records where in place$$,
  20
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$Care and support actively promotes independence skills development in line with the student's EHC plan outcomes; staff support students to do things themselves rather than doing for them; independence progress is tracked and celebrated$$,
  $$Reg 10$$,
  $$Support plans with independence goals linked to EHC plan outcomes; evidence of a support approach over a doing-for approach; independence progress records; evidence goals are set by and with the student; records of skills achieved$$,
  21
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Right support, right care, right culture + transitions
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Complaints and feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A registered manager is in post and registered with CQC; the manager understands the dual CQC/Ofsted regulatory framework; governance arrangements cover both the care and education functions of the college$$,
  $$Reg 17$$,
  $$CQC registered manager certificate; evidence of manager's understanding of dual regulatory requirements; governance framework covering care and education; records of engagement with both CQC and Ofsted$$,
  26
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Governance systems include regular audits of care quality, support plans, medicines, risk assessments, and the residential environment; audit findings are acted on; policies are reviewed and up to date; quality improvement is ongoing and evidenced$$,
  $$Reg 17$$,
  $$Audit schedule and completed records; evidence audit actions are completed; policy review dates; quality improvement plans with progress evidence; management oversight records$$,
  27
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Incidents and near misses are reported, recorded and investigated; the college fulfils its Duty of Candour when something goes wrong; notifiable incidents are reported to the CQC within the required timeframe$$,
  $$Reg 17, Reg 20$$,
  $$Incident log; investigation records and outcomes; CQC notifications where required; Duty of Candour records; evidence of learning shared with staff; evidence of actions taken to prevent recurrence$$,
  28
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- Note: In the specialist college context, dementia most commonly arises
-- in adults with Down syndrome, who have a significantly elevated risk of
-- early-onset Alzheimer's disease. Colleges supporting adults with Down
-- syndrome must be prepared to identify cognitive decline and adapt support.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-SAF-01$$, NULL,
  $$Where a student has dementia or is at elevated risk (including adults with Down syndrome), a dementia-specific risk assessment is in place; risks covered include wandering, altered perception, changes in behaviour, and safety in the college environment$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments; evidence of environmental safety measures; records of incidents related to wandering or disorientation; evidence of liaison with GP and specialist in Down syndrome and dementia$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-SAF-02$$, NULL,
  $$Staff supporting students with dementia have received dementia-specific training; for colleges supporting adults with Down syndrome, this includes awareness of Down syndrome and Alzheimer's, how dementia presents differently in this population, and how to respond with compassion$$,
  $$Reg 18$$,
  $$Dementia training records; Down syndrome and Alzheimer's awareness training where relevant; evidence staff can describe how dementia presents in their student population; staff knowledge assessment records$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-SAF-03$$, NULL,
  $$Where restraint is used for a student with dementia, it is lawful, proportionate and documented; the college has a clear restraint policy; any use is reported and reviewed; PBS remains the primary framework$$,
  $$Reg 13$$,
  $$Restraint policy; evidence staff understand the policy; records of any restraint episodes with rationale and review; DoLS authorisation where relevant; PBS plan referencing dementia-specific approaches$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-WEL-01$$, NULL,
  $$The college's governance includes oversight of dementia-specific care quality; this covers care plan review, DoLS compliance, medicines management, staff training, and monitoring of cognitive and functional decline for all students with or at risk of dementia$$,
  $$Reg 17$$,
  $$Dementia audit records; DoLS compliance review; medicines audit records; training compliance for staff supporting students with dementia; management review of dementia-specific outcomes$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Specialist College$$),
  $$Core$$, $$DEM-WEL-02$$, NULL,
  $$The college learns from dementia-related incidents and near misses; learning is shared with staff; dementia-specific practices are reviewed and updated in line with current guidance including guidance on Down syndrome and Alzheimer's$$,
  $$Reg 17$$,
  $$Dementia incident records and outcomes; evidence learning has been shared with staff; evidence practice aligns with current guidance (including Down syndrome Alzheimer's guidance); records of practice changes following incidents or guidance updates$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
