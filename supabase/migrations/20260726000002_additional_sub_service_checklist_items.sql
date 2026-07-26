-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Acquired Brain Injury, Physical Disabilities, Bariatric Care,
--            Sensory Impairment, and Epilepsy sub-service checklist items
--
-- Design:
--   • service_type_id = NULL  → universal (applicable across all service types)
--   • sub_service values as below
--   • item_type = 'Core'
--   • display_orders: ABI 101, PD 111, BAR 121, SI 131, EPI 141
--
-- Step 1: Expand the sub_service CHECK constraint.
-- Step 2: Seed 7 items per sub-service (35 total).
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
    'Learning Disabilities', 'Mental Health', 'End of Life',
    'Acquired Brain Injury', 'Physical Disabilities', 'Bariatric Care',
    'Sensory Impairment', 'Epilepsy'
  ));


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2A: ACQUIRED BRAIN INJURY — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- ABI-SAF-01: Vulnerability and ABI-specific safeguarding (Safeguarding)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-SAF-01$$, $$Acquired Brain Injury$$,
  $$Staff understand that people with acquired brain injury may be at heightened risk of exploitation, financial abuse and domestic abuse due to cognitive and behavioural changes; safeguarding training includes ABI-specific indicators and staff can identify and refer concerns appropriately$$,
  $$Reg 13$$,
  $$ABI-specific safeguarding training records; referral log; evidence of local authority safeguarding engagement where concerns have been raised; supervision notes reflecting ABI vulnerability awareness$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ABI-SAF-02: Neurorehabilitation competencies (Safe staffing)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-SAF-02$$, $$Acquired Brain Injury$$,
  $$Staff working with people with acquired brain injury have completed training in ABI-specific needs including cognitive rehabilitation principles, fatigue management, behavioural and emotional changes post-injury, and dysphasia awareness; training is role-matched and refreshed regularly$$,
  $$Reg 18$$,
  $$ABI-specific training records per staff member; evidence of neurorehabilitation competency assessment; specialist trainer or course credentials; supervision notes referencing ABI-specific practice$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ABI-EFF-01: Cognitive and neuropsychological assessment (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-EFF-01$$, $$Acquired Brain Injury$$,
  $$Each person's cognitive, communication and neuropsychological needs are assessed using validated tools at admission and reviewed as their condition changes; assessments inform care planning and rehabilitation goals in partnership with neuropsychology or specialist ABI services where available$$,
  $$Reg 9$$,
  $$Neuropsychological or cognitive assessments per individual; evidence of specialist input (neuropsychology, OT, SLT); care plans reflecting cognitive and communication needs; review records showing goal progress$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ABI-EFF-02: MCA for fluctuating capacity post-ABI (Consent to care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-EFF-02$$, $$Acquired Brain Injury$$,
  $$The service recognises that capacity following acquired brain injury may fluctuate across domains and over time; capacity assessments are decision-specific, time-specific and documented; Best Interests decisions are made with family, advocate or IMCA involvement and are recorded$$,
  $$Reg 11$$,
  $$Decision-specific MCA records for people with ABI; evidence of capacity fluctuation monitoring; Best Interests meeting notes; records of IMCA referrals; family or advocate involvement documented$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ABI-CAR-01: Supported decision-making with cognitive impairment (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-CAR-01$$, $$Acquired Brain Injury$$,
  $$Supported decision-making approaches are adapted to the person's cognitive profile; staff use prompting, visual aids, simplified language and environmental cues to maximise participation in decisions; rehabilitation goals are person-led and reviewed regularly with the individual and their support network$$,
  $$Reg 9$$,
  $$Care plans showing adapted decision-making support; examples of visual aids or communication tools used; evidence of person-led goal setting; rehabilitation review records with individual participation documented$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ABI-RES-01: Neurological MDT and community neurorehabilitation (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-RES-01$$, $$Acquired Brain Injury$$,
  $$The service liaises with community neurorehabilitation teams, neuropsychology, occupational therapy, physiotherapy and speech and language therapy to deliver a coordinated rehabilitation programme; MDT meetings are documented and outcomes feed into care plan updates$$,
  $$Reg 9$$,
  $$MDT referral and liaison records; evidence of joint working with neurorehabilitation teams; MDT meeting minutes or outcome summaries; care plan updates reflecting MDT recommendations; named contacts for specialist services$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ABI-WEL-01: Behaviour support and restrictive practice governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$ABI-WEL-01$$, $$Acquired Brain Injury$$,
  $$Where behaviour that challenges arises following acquired brain injury, Positive Behavioural Support (PBS) plans are in place, written with input from a PBS-qualified practitioner, and reviewed regularly; data on incidents and restrictive interventions is collected, reviewed at governance level and used to reduce restrictive practice over time$$,
  $$Reg 17$$,
  $$PBS plans per individual; PBS practitioner credentials; incident and restrictive intervention data; governance meeting minutes showing review of data; evidence of reducing trend in restrictive practice$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2B: PHYSICAL DISABILITIES — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- PD-SAF-01: Moving and handling risk assessment (Managing risks during care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-SAF-01$$, $$Physical Disabilities$$,
  $$Individual moving and handling risk assessments are completed for each person with a physical disability; handling plans are documented, accessible to all relevant staff and reviewed after any significant change in the person's condition, following an incident or at least annually; staff demonstrate competence in handling techniques specific to each person's needs$$,
  $$Reg 12$$,
  $$Individual moving and handling risk assessments; documented handling plans; competency records for relevant staff; evidence of post-incident or post-change review; annual review records$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- PD-SAF-02: Specialist equipment inspection and governance (Safe environments and infection prevention and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-SAF-02$$, $$Physical Disabilities$$,
  $$All specialist equipment used by people with physical disabilities — including hoists, slings, profiling beds, powered wheelchairs and standing frames — is inspected, maintained and serviced in accordance with LOLER and PUWER regulations; service records and LOLER examination reports are filed and up to date$$,
  $$Reg 15$$,
  $$LOLER examination reports for lifting equipment; PUWER records; planned preventive maintenance schedule; equipment service records; evidence of actions taken where defects have been identified$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- PD-EFF-01: Rehabilitation, OT and physiotherapy assessment (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-EFF-01$$, $$Physical Disabilities$$,
  $$People with physical disabilities receive regular assessments from occupational therapists and physiotherapists; assessments address functional ability, posture management, pain, seating, equipment and rehabilitation goals; findings are reflected in care plans and reviewed as needs change$$,
  $$Reg 9$$,
  $$OT and physiotherapy assessment records; postural management plans; equipment prescription records; care plans reflecting rehabilitation goals; evidence of reassessment following changes in condition$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- PD-CAR-01: Independent living and self-determination (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-CAR-01$$, $$Physical Disabilities$$,
  $$Care planning is rooted in an independent living philosophy; people with physical disabilities are supported to direct their own care, set their own goals and maintain maximum control over their daily lives; any support provided is the minimum necessary to enable independence rather than creating dependence$$,
  $$Reg 9$$,
  $$Care plans evidencing person-directed support and independent living goals; evidence of direct payments or personal budget discussions where appropriate; examples of care being adjusted to increase independence over time; feedback from individuals about control over their lives$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- PD-RES-01: MDT and community access facilitation (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-RES-01$$, $$Physical Disabilities$$,
  $$The service coordinates with a multi-disciplinary team including physiotherapy, occupational therapy, district nursing and specialist consultants; community access is actively supported with accessible transport, adapted environments and accompaniment where needed$$,
  $$Reg 9$$,
  $$MDT referral and contact records; evidence of community access support (transport, outing records); care plans showing MDT input; records of any barriers to community access and how they were addressed$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- PD-RES-02: Accessible environments and adaptations (Timely and equitable access)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-RES-02$$, $$Physical Disabilities$$,
  $$The physical environment is adapted to meet the needs of people with physical disabilities; accessibility audits are completed and acted upon; adaptations including ramps, level access, wide doorways, accessible bathrooms and height-adjustable equipment are in place, maintained and reviewed when needs change$$,
  $$Reg 15$$,
  $$Accessibility audit records; evidence of adaptations made; maintenance records for adapted equipment; evidence of reassessment when needs change; any actions outstanding from audits with timescales$$,
  112
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- PD-WEL-01: Equipment audit and maintenance governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$PD-WEL-01$$, $$Physical Disabilities$$,
  $$There is a comprehensive equipment register for all specialist equipment used in the service; planned preventive maintenance schedules are in place and followed; equipment defects are reported, actioned and tracked; governance processes include regular review of equipment compliance and any incidents involving equipment$$,
  $$Reg 17$$,
  $$Equipment register; planned preventive maintenance schedule; defect reporting and action log; governance meeting minutes evidencing equipment compliance review; LOLER/PUWER compliance summary$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2C: BARIATRIC CARE — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- BAR-SAF-01: Bariatric manual handling protocol (Managing risks during care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-SAF-01$$, $$Bariatric Care$$,
  $$A bariatric manual handling protocol is in place for each person receiving bariatric care; the protocol includes individual weight, centre of gravity assessment, minimum number of staff for each task, and specific equipment requirements; all staff involved in bariatric care hold current bariatric manual handling competency and the protocol is reviewed following any incident or significant change in the person's condition$$,
  $$Reg 12$$,
  $$Individual bariatric handling protocols; weight and centre of gravity assessments; staff bariatric manual handling competency records; incident review records; evidence of protocol review after changes in condition$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- BAR-SAF-02: Bariatric specialist equipment (Safe environments and infection prevention and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-SAF-02$$, $$Bariatric Care$$,
  $$Bariatric-rated equipment is in place for each person requiring it — including profiling beds, bariatric hoists and slings, reinforced seating and appropriately sized pressure mattresses — all rated to the individual's weight; equipment is subject to LOLER inspection and PUWER assessment; slings are individually fitted, labelled and inspected$$,
  $$Reg 15$$,
  $$Equipment weight ratings and specifications; LOLER inspection reports; individual sling fit records; bariatric pressure mattress assessments; evidence equipment is appropriate to the individual's current weight$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- BAR-EFF-01: Nutritional assessment and skin integrity monitoring (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-EFF-01$$, $$Bariatric Care$$,
  $$Nutritional assessment using a validated tool (e.g. MUST) is completed at admission and reviewed regularly; a dietitian is involved in care planning for people receiving bariatric care; skin integrity is monitored at every care contact using a validated risk assessment tool and any pressure damage is graded, documented and escalated appropriately$$,
  $$Reg 9$$,
  $$MUST or equivalent nutritional assessments; dietitian referral and care plan records; skin integrity assessment records at every care contact; pressure damage grading documentation; evidence of escalation and treatment for any skin breakdown$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- BAR-CAR-01: Dignity in bariatric care (Kindness, compassion and dignity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-CAR-01$$, $$Bariatric Care$$,
  $$People receiving bariatric care are treated with consistent dignity and respect; staff are trained to deliver bariatric care without stigmatising language or attitudes; conversations about weight, health goals and care needs are held sensitively and person-centredly; the service actively prevents discriminatory practice related to body size$$,
  $$Reg 10$$,
  $$Staff training records on dignity in bariatric care; evidence of person-centred conversations about health goals; any complaints or compliments related to dignity in care; supervision records reflecting dignity expectations; feedback from individuals about how they are treated$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- BAR-CAR-02: Supporting independence and mobility goals (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-CAR-02$$, $$Bariatric Care$$,
  $$Care planning for people receiving bariatric care includes person-led goals around mobility, independence and quality of life; rehabilitation objectives are agreed with the individual and reviewed regularly; any reduction in independence or mobility is risk-assessed and the least restrictive approach is taken$$,
  $$Reg 9$$,
  $$Care plans showing person-led mobility and independence goals; evidence of rehabilitation input; goal review records; least restrictive option assessments where mobility is restricted; feedback from individuals about their goals$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- BAR-RES-01: Dietitian and bariatric specialist liaison (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-RES-01$$, $$Bariatric Care$$,
  $$People receiving bariatric care have access to specialist dietetic input and, where clinically appropriate, referral to bariatric surgical or medical services; liaison with GP, community nursing and relevant specialists is documented; transfer and transition arrangements for hospital admissions or specialist appointments consider bariatric-specific requirements$$,
  $$Reg 9$$,
  $$Dietitian referral and review records; evidence of specialist bariatric service liaison; GP and community nursing contact records; hospital transfer risk assessments including bariatric considerations; specialist appointment records$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- BAR-WEL-01: Bariatric equipment audit and staff competency governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$BAR-WEL-01$$, $$Bariatric Care$$,
  $$There is a bariatric governance framework that includes a register of all bariatric equipment and its weight ratings, a schedule for LOLER inspection and maintenance, a record of staff bariatric training and competency, and a process for reviewing incidents and near misses; learning from incidents is shared with the team and used to improve practice$$,
  $$Reg 17$$,
  $$Bariatric equipment register with weight ratings; LOLER inspection schedule and records; staff bariatric training and competency register; incident review records; evidence of learning from incidents shared at team or governance meetings$$,
  121
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2D: SENSORY IMPAIRMENT — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- SI-SAF-01: Communication adaptations for raising concerns (Safeguarding)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-SAF-01$$, $$Sensory Impairment$$,
  $$The service ensures that people with visual or hearing impairments have accessible ways to raise safeguarding concerns, make complaints and give feedback; where verbal or written communication is not possible, alternative methods such as BSL interpretation, deafblind communication, Braille, pictorial tools or trusted advocate contact are in place and documented$$,
  $$Reg 13$$,
  $$Communication support plans per individual; evidence of BSL interpreter access or deafblind communication methods; accessible complaints procedures; advocate contact records; safeguarding referral log$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- SI-SAF-02: Environmental adaptations for sensory needs (Safe environments and infection prevention and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-SAF-02$$, $$Sensory Impairment$$,
  $$The physical environment is adapted to support the safety of people with sensory impairments; adaptations in place are appropriate to individuals' needs and may include adequate lighting, colour contrast markings, tactile flooring indicators, vibrating fire alarm systems, hearing loops, clear signage and uncluttered walkways; adaptations are reviewed as needs change$$,
  $$Reg 15$$,
  $$Environmental risk assessments for sensory needs; evidence of specific adaptations (lighting levels, contrast, tactile guides, vibrating alarms, loops); fire evacuation plans adapted for sensory impairment; adaptation review records$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- SI-EFF-01: Sensory and communication needs assessment (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-EFF-01$$, $$Sensory Impairment$$,
  $$A detailed sensory and communication needs assessment is completed for each person with a visual or hearing impairment at admission and reviewed regularly; assessments are informed by input from specialist sensory impairment services, ophthalmology or audiology where appropriate; communication preferences and methods are documented and shared with all staff$$,
  $$Reg 9$$,
  $$Sensory needs assessments; communication preferences documentation; evidence of specialist input (ophthalmology, audiology, sensory support services); care plans reflecting sensory needs; staff briefing records on individual communication methods$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- SI-CAR-01: Assistive technology and communication aids (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-CAR-01$$, $$Sensory Impairment$$,
  $$People with sensory impairments are supported to use assistive technology and communication aids that maximise their independence and quality of life; equipment such as hearing aids, magnification devices, screen readers, vibrating alert systems and communication apps is maintained, charged and accessible; staff are trained in supporting individuals to use their equipment$$,
  $$Reg 9$$,
  $$Assistive technology inventory per individual; equipment maintenance and charging records; staff training records on individual assistive technology; evidence of individuals using their equipment effectively; OT or assistive technology specialist referral records$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- SI-CAR-02: Adapted interactions and emotional wellbeing (Kindness, compassion and dignity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-CAR-02$$, $$Sensory Impairment$$,
  $$Staff adapt their interactions to the communication needs of people with sensory impairments, using appropriate proximity, lighting, facing the individual when speaking, using BSL, tactile communication or other preferred methods; the emotional wellbeing impact of sensory impairment, including isolation and depression, is monitored and addressed in care planning$$,
  $$Reg 10$$,
  $$Communication support plans; evidence of adapted staff interactions (supervision records, observation); wellbeing assessments; care plans addressing emotional impact of sensory impairment; referrals to sensory impairment wellbeing support or peer groups$$,
  132
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- SI-RES-01: Specialist sensory impairment service liaison (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-RES-01$$, $$Sensory Impairment$$,
  $$The service maintains active links with local sensory impairment services, the RNIB, Action on Hearing Loss and other specialist organisations; people with sensory impairments are referred to specialist services when needs change and are supported to access regular ophthalmic and audiological reviews$$,
  $$Reg 9$$,
  $$Records of sensory impairment specialist contacts and referrals; evidence of ophthalmic and audiological review attendance; RNIB or equivalent organisation referral records; care plans reflecting specialist recommendations; named contacts for sensory support services$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- SI-WEL-01: Staff training in sensory awareness and specialist communication (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$SI-WEL-01$$, $$Sensory Impairment$$,
  $$All staff working with people with sensory impairments complete training in sensory awareness, including deafblind awareness, BSL basics and the use of communication aids; specialist communication training is provided where individuals require it; training compliance is monitored and refreshers are scheduled; a governance audit of sensory accommodation quality is conducted annually$$,
  $$Reg 18$$,
  $$Staff sensory awareness training records; BSL or deafblind communication training records; training compliance monitoring; annual sensory accommodation audit; evidence of actions arising from audit$$,
  131
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2E: EPILEPSY — 7 universal items
-- ════════════════════════════════════════════════════════════════════════════

-- EPI-SAF-01: Individual seizure risk assessment and management plan (Managing risks during care and treatment)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-SAF-01$$, $$Epilepsy$$,
  $$An individual seizure risk assessment and management plan is in place for each person with epilepsy; the plan documents seizure type, frequency, duration, triggers, warning signs, first aid response and when to call 999; plans are written in collaboration with the person, their GP and epilepsy specialist nurse where available, reviewed at least annually and after any significant change in seizure pattern$$,
  $$Reg 12$$,
  $$Individual seizure risk assessments; seizure management plans; evidence of person and specialist involvement in plan development; seizure diary records; annual review records; post-change review evidence$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- EPI-SAF-02: Rescue medication governance (Safe medicines and treatments)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-SAF-02$$, $$Epilepsy$$,
  $$Where rescue medication (e.g. buccal midazolam or rectal diazepam) is prescribed, all staff involved in that person's care are trained and competency-assessed in its administration before being permitted to use it; rescue medication is stored accessibly, within expiry date and in sufficient supply; a protocol for use, including when to call 999, is documented alongside the prescription$$,
  $$Reg 12$$,
  $$Rescue medication prescriptions; staff training and competency assessment records per person; storage and stock records; expiry date monitoring; rescue medication administration protocol; evidence 999 escalation criteria are clear$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- EPI-EFF-01: Seizure monitoring, diary and SUDEP awareness (Assessing needs)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-EFF-01$$, $$Epilepsy$$,
  $$Seizures are recorded in an individual seizure diary at every occurrence, capturing type, duration, time of day, possible triggers and recovery time; diary data is shared with the epilepsy specialist nurse or neurologist at review; staff are aware of Sudden Unexpected Death in Epilepsy (SUDEP) risks and the precautions in place for each individual, including nocturnal monitoring where indicated$$,
  $$Reg 9$$,
  $$Seizure diary records per individual; evidence of diary data shared with specialist at reviews; SUDEP risk assessment per individual; nocturnal monitoring records where applicable; staff SUDEP awareness training records$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- EPI-CAR-01: Risk-enabling epilepsy management (Independence, choice and control)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-CAR-01$$, $$Epilepsy$$,
  $$Epilepsy management plans are developed with the person to enable them to live as full and active a life as possible while managing risk appropriately; positive risk-taking decisions are documented and reviewed; restrictions are the minimum necessary, proportionate to the actual risk and reviewed regularly; the person's own views and preferences about risk are respected and central to care planning$$,
  $$Reg 9$$,
  $$Epilepsy management plans showing risk-enabling approach; positive risk-taking documentation; evidence of individual's views and preferences recorded; any restrictions documented with rationale, review date and evidence of being the least restrictive option$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- EPI-RES-01: Neurology and epilepsy specialist nurse liaison (Care provision, integration and continuity)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-RES-01$$, $$Epilepsy$$,
  $$People with epilepsy have access to regular review by a neurologist or epilepsy specialist nurse; the service supports people to attend reviews and provides up-to-date seizure diary data to inform specialist decision-making; changes to anti-epileptic drug regimes are implemented promptly with appropriate monitoring$$,
  $$Reg 9$$,
  $$Records of neurology or epilepsy specialist nurse reviews; evidence of seizure diary data shared at reviews; AED change records including monitoring requirements; attendance support records; named epilepsy specialist contacts$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- EPI-RES-02: Status epilepticus response and 999 escalation (Timely and equitable access)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-RES-02$$, $$Epilepsy$$,
  $$All staff are trained in the first aid response to seizures including recovery position, timing, airway management and when to call 999 for status epilepticus; the threshold for calling 999 is specified in each person's seizure management plan; any instance of status epilepticus or prolonged seizure is recorded, reviewed and shared with the epilepsy specialist$$,
  $$Reg 12$$,
  $$Staff epilepsy first aid training records; seizure management plans specifying 999 call criteria; records of status epilepticus or prolonged seizures; evidence of specialist review following status epilepticus; any ambulance call records and outcomes$$,
  142
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- EPI-WEL-01: Seizure audit, SUDEP review and governance (Governance and management)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, NULL,
  $$Core$$, $$EPI-WEL-01$$, $$Epilepsy$$,
  $$Seizure frequency data across the service is reviewed at governance level at least quarterly; any SUDEP or near-SUDEP event triggers a serious incident review with learning shared across the team; the service can demonstrate that anti-epileptic medication errors are monitored, that rescue medication training compliance is tracked and that any gaps in competency are acted upon promptly$$,
  $$Reg 17$$,
  $$Quarterly seizure frequency governance reports; SUDEP or near-SUDEP serious incident review records; learning shared from reviews; AED medication error monitoring data; rescue medication training compliance register; evidence of prompt action on competency gaps$$,
  141
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
