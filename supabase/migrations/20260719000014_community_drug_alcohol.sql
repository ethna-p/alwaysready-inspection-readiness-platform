-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Community Drug and Alcohol Service — Core + Dementia sub-service
--
-- Key differences from Residential Rehabilitation Service:
--   • Non-residential; people attend appointments or drop-in sessions and
--     return home — the service provides no overnight care
--   • Harm reduction is a primary purpose alongside treatment; this includes
--     needle and syringe programmes (NSP), naloxone distribution, wound care
--     advice, and BBV testing and vaccination
--   • Opioid substitution therapy (OST): methadone and buprenorphine
--     prescribing is a core treatment modality; scripts must be clinically
--     supervised by a prescriber; Supervised Consumption (SC) arrangements
--     and takeaway doses must be managed safely
--   • Community alcohol detox: Librium-assisted detox can be carried out in
--     the community with daily monitoring; clinical risk thresholds for
--     hospital detox must be clearly defined
--   • Keyworking model: each client has a named key worker / care coordinator
--     who holds the therapeutic relationship; case loads, frequency of contact
--     and handover processes are quality indicators
--   • Criminal justice referrals: a significant proportion of clients are
--     referred by probation, the courts, or CJIT (Criminal Justice
--     Intervention Teams); information sharing with criminal justice agencies
--     is governed by consent and statutory gateways
--   • Safeguarding: this includes the welfare of children in households where
--     a parent or carer is using substances — a MARAC/MASH referral pathway
--     must be in place; domestic abuse co-occurrence is high in this
--     population; exploitation and coercive control must be screened
--   • Naloxone: take-home naloxone is distributed as a core activity; clients,
--     family members and peers should be offered training in administration
--   • No DoLS: this is a community service; people are voluntary and not
--     deprived of their liberty by the service; DoLS does not apply
--   • MCA applies to specific treatment decisions where a person may lack
--     capacity, e.g. during acute intoxication
--   • Recovery capital: employment, housing, social networks and mutual aid
--     (AA/NA/SMART Recovery) are part of the recovery plan
--   • Dementia sub-service: in a community drug and alcohol context, cognitive
--     impairment most commonly arises as alcohol-related brain damage (ARBD)
--     or Korsakoff syndrome; clients may present with confusion, memory
--     deficits or disorientation without a formal dementia diagnosis; the
--     service must have a pathway to specialist ARBD assessment and support
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A risk assessment is completed for each client at the start of treatment and reviewed regularly; it covers drug-related death risk, self-harm and suicide risk, domestic abuse, safeguarding concerns, and any physical health risks; the assessment is updated following any significant incident or change in the client's circumstances$$,
  $$Reg 12$$,
  $$Risk assessments per client; evidence of regular review; incident-triggered updates; drug-related death (DRD) risk grading; self-harm and suicide risk documentation; domestic abuse screening records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$Drug-related death (DRD) prevention is embedded in the service; all clients are offered take-home naloxone with training in its use; family members and peers are also offered naloxone and training; naloxone distribution is tracked and stock is maintained$$,
  $$Reg 12$$,
  $$Naloxone distribution records per client and family member; naloxone training records; evidence offer was made to all eligible clients; stock management records; evidence of naloxone restocking protocols$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$The service has a clear protocol for managing clients who disengage or are lost to follow-up; attempts to re-engage are documented; where there is a drug-related death risk, the protocol includes notification to the GP and other relevant agencies$$,
  $$Reg 12$$,
  $$Disengagement protocol; records of contact attempts for clients who disengage; evidence of GP notification where DRD risk is high; records of bridge referrals or liaison with other agencies; evidence of multi-agency response where needed$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$The service has a protocol for community alcohol detox; clinical risk thresholds for referring to hospital detox rather than community detox are clearly defined; clients in community detox are monitored daily; CIWA-Ar or an equivalent validated tool is used to monitor withdrawal$$,
  $$Reg 12$$,
  $$Community detox protocol; clinical threshold criteria for hospital referral; daily monitoring records for clients in community detox; CIWA-Ar or equivalent withdrawal monitoring records; evidence of escalation where withdrawal becomes medically unsafe$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$The service has a safeguarding policy covering adults and children; all staff are trained in safeguarding; the service screens for domestic abuse and has a MARAC referral pathway; parental substance misuse is assessed where a client has children and appropriate referrals are made to children's services$$,
  $$Reg 13$$,
  $$Safeguarding policy; staff training records; domestic abuse screening records; MARAC referral records; records of referrals to children's services where parental substance misuse raises concerns; safeguarding log with outcomes$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$The service screens for exploitation, county lines involvement, modern slavery, and coercive control; staff are trained to recognise and respond to these risks; concerns are raised with the appropriate statutory authority without delay$$,
  $$Reg 13$$,
  $$Exploitation screening records; county lines awareness training; modern slavery and coercive control screening; evidence of referrals to police or social care where exploitation is suspected; staff training records on exploitation indicators$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$Safer recruitment is applied to all staff; DBS checks, references, identity verification, and employment history checks are completed before staff commence employment; a registered manager is in post and their CQC registration is current$$,
  $$Reg 19$$,
  $$Staff recruitment files; DBS certificates and renewal dates; reference records; employment history gap checks; CQC registered manager certificate$$,
  7
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$Lone working arrangements are safe; staff who carry out home visits or outreach work have access to a lone working system, check-in protocols, and a procedure for raising an alarm; lone working risk assessments are completed for individual clients where relevant$$,
  $$Reg 12$$,
  $$Lone working policy; lone working system records; check-in logs; home visit risk assessments; evidence staff have been briefed on lone working protocols; records of any lone working incidents and actions taken$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Opioid substitution therapy (OST) is prescribed and monitored safely; a prescribing clinician reviews each client before initiating OST and at regular clinical reviews; supervised consumption (SC) arrangements are in place where clinically indicated; takeaway doses are approved by a prescriber and recorded; dose changes are authorised and documented$$,
  $$Reg 12$$,
  $$OST prescription records; evidence of prescriber assessment before initiation; supervised consumption records; takeaway dose authorisation records; dose change authorisation records; evidence of regular clinical review; controlled drug register where applicable$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Medicines management$$ AND kq.name = $$Safe$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Care is delivered in a non-judgmental, trauma-informed, harm-reduction-centred way; staff understand that addiction is a health condition; clients are treated with dignity regardless of the substances they use or their circumstances; the service is accessible and does not create unnecessary barriers to engagement$$,
  $$Reg 10$$,
  $$Evidence of trauma-informed approach in care records; client feedback on how they were treated; evidence service does not create unnecessary barriers; evidence clients feel able to attend without fear of stigma; staff training records on non-judgmental approaches$$,
  20
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Responding to people's needs
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Complaints and feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A registered manager is in post and registered with the CQC; the manager provides visible clinical and operational leadership; clinical governance includes regular case review, OST prescribing audit, and risk management; policies are reviewed and up to date$$,
  $$Reg 17$$,
  $$CQC registered manager certificate; evidence of manager involvement; clinical governance meeting records; OST prescribing audit; case review records; policy review dates$$,
  23
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Incidents and near misses including overdoses, drug-related deaths, safeguarding incidents, and lone working incidents are reported, recorded and investigated; the service fulfils its Duty of Candour when something goes wrong; notifiable incidents are reported to the CQC within the required timeframe$$,
  $$Reg 17, Reg 20$$,
  $$Incident log; DRD records and investigations; safeguarding incident records; CQC notifications; Duty of Candour records; evidence learning is shared with staff$$,
  24
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Information sharing with criminal justice agencies (probation, CJIT, courts) is governed by a written information sharing agreement and client consent; the service understands the statutory gateways under which information may be shared without consent; information sharing is documented in the client record$$,
  $$Reg 17$$,
  $$Information sharing agreements with criminal justice agencies; consent records for information sharing; evidence staff understand disclosure without consent where a statutory gateway applies; records of information shared with criminal justice agencies and the rationale$$,
  25
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- Note: In a community drug and alcohol service, dementia or cognitive
-- impairment most commonly presents as alcohol-related brain damage (ARBD)
-- or Korsakoff syndrome in clients with severe, long-term alcohol dependence.
-- Clients may present confused or disoriented without a formal diagnosis.
-- The Dementia sub-service items address governance for this group.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-SAF-01$$, NULL,
  $$Where a client presents with signs of cognitive impairment, confusion or memory loss, a specific risk assessment is completed; the assessment covers the client's ability to manage their own medications, recall appointments, and make safe decisions; and identifies risks arising from cognitive impairment combined with substance use$$,
  $$Reg 12$$,
  $$Cognitive impairment-specific risk assessments; evidence of cognitive screening (MMSE, MoCA, or equivalent); records of risk management actions taken; evidence of liaison with GP or specialist services$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-SAF-02$$, NULL,
  $$Where a client is identified as having alcohol-related brain damage (ARBD) or Korsakoff syndrome, OST and other medication regimes are reviewed to account for cognitive impairment; supervised consumption is considered for clients who cannot safely self-manage medication$$,
  $$Reg 12$$,
  $$ARBD-specific medication management reviews; evidence of supervised consumption where cognitively impaired; prescriber review records; evidence of risk assessment for self-management of medication$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-SAF-03$$, NULL,
  $$Staff are trained to recognise the signs of alcohol-related brain damage and Wernicke-Korsakoff syndrome; they know that thiamine (vitamin B1) deficiency is a medical emergency; they understand how to access emergency medical care and when to refer for a specialist ARBD assessment$$,
  $$Reg 18$$,
  $$ARBD and Wernicke-Korsakoff awareness training records; evidence staff know the signs; records of emergency referrals for suspected Wernicke's encephalopathy; thiamine prescribing or referral records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-WEL-01$$, NULL,
  $$The service's governance includes oversight of ARBD and dementia-related care; this covers cognitive screening practice, MCA compliance, referral pathway effectiveness, and the quality of care planning for clients with cognitive impairment$$,
  $$Reg 17$$,
  $$ARBD governance records; cognitive screening audit; MCA compliance review; referral pathway effectiveness data; care planning quality review for clients with ARBD or dementia$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$DEM-WEL-02$$, NULL,
  $$The service learns from incidents and near misses involving clients with ARBD or dementia; learning is shared with staff; clinical practices are reviewed in line with current ARBD guidance$$,
  $$Reg 17$$,
  $$ARBD-related incident records and outcomes; evidence learning has been shared with staff; evidence clinical practice aligns with current ARBD guidance; records of practice changes following incidents or guidance updates$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
