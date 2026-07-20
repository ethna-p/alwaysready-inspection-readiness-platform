-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Residential Rehabilitation Service — Core + Dementia sub-service
--
-- Key differences from all other service types:
--   • The primary purpose is structured drug and/or alcohol treatment;
--     people are resident in order to receive treatment (abstinence-based,
--     medically-assisted, or a combination of both)
--   • Placement is time-limited (typically 12–28 weeks); this is not a
--     long-term care setting
--   • Clinical governance is a central requirement: medical oversight of
--     detoxification, withdrawal monitoring using validated rating scales
--     (CIWA-Ar for alcohol, COWS for opioids), and prescribing by a
--     suitably qualified clinician are all expected by CQC
--   • Drug-related death (DRD) prevention is a specific inspection focus:
--     naloxone must be immediately accessible (NOT locked away); all staff
--     must be trained to administer it; take-home naloxone must be offered
--     to every client on discharge
--   • Ligature risk: the physical environment must be assessed for ligature
--     anchor points; self-harm and suicide risk is materially higher in
--     this population than in most care settings
--   • Clients are voluntary — they can self-discharge at any time; the
--     service must have a clear protocol for managing planned and unplanned
--     discharges (against medical advice / AWOL)
--   • Therapeutic programme: evidence-based psychosocial interventions
--     (CBT, DBT, 12-step, SMART Recovery, therapeutic community, mindfulness)
--     are expected alongside any medically-assisted treatment
--   • Dual diagnosis (co-occurring mental health conditions) is common
--     and must be assessed and managed
--   • Physical health screening at admission includes blood-borne virus
--     (BBV) testing (hepatitis B, C, HIV); results must be acted on
--   • Aftercare planning is a specific quality indicator: housing, community
--     drug and alcohol service connection, mutual aid, and employment support
--     must be addressed before discharge
--   • MCA applies; DoLS is unlikely (clients are voluntary and can leave)
--     but must be assessed if a client lacks capacity and is at risk of harm
--   • Information sharing with referrers, GPs and community services is a
--     CQC expectation; failure to share is a recurrent inspection finding
--   • Dementia sub-service: in a rehab context, dementia most commonly
--     arises as alcohol-related brain damage (ARBD / Korsakoff syndrome)
--     in clients with severe, long-term alcohol dependence
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A comprehensive risk assessment is completed for each client at admission covering withdrawal risk, drug-related death risk, self-harm and suicide risk, safeguarding concerns, and any physical health risks; assessments are reviewed regularly throughout treatment and following any significant incident or change$$,
  $$Reg 12$$,
  $$Admission risk assessments per client; withdrawal risk grading; self-harm and suicide risk documentation; evidence of regular reassessment throughout treatment; incident-triggered review records$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$Withdrawal is monitored using validated clinical rating scales; CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol) is used for alcohol withdrawal; COWS (Clinical Opioid Withdrawal Scale) is used for opioid withdrawal; monitoring frequency reflects the severity of the client's withdrawal and the clinical protocol$$,
  $$Reg 12$$,
  $$CIWA-Ar records for clients in alcohol detox; COWS records for opioid withdrawal; evidence monitoring frequency reflects clinical severity; clinical protocol for withdrawal management; prescriber sign-off on withdrawal monitoring$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$The physical environment is assessed for ligature anchor points; all staff know where potential ligature points are in the building; mitigation measures are in place and documented; the ligature risk assessment is reviewed at least annually and following any self-harm incident$$,
  $$Reg 12$$,
  $$Ligature risk assessment with identified anchor points; evidence staff have been briefed on locations; mitigation measures documented; review dates; evidence of review following any self-harm incident$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Naloxone is immediately accessible in an emergency — it is NOT stored in a locked cupboard during hours when clients are present; all staff are trained to recognise opioid overdose and to administer naloxone; take-home naloxone is offered to every client at discharge$$,
  $$Reg 12$$,
  $$Naloxone storage location records — accessible, not locked; naloxone training records for all staff; evidence of take-home naloxone provision at discharge; naloxone stock check records; records of any overdose episodes and naloxone administration$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MR-05$$, NULL,
  $$The service has a clear protocol for planned and unplanned discharges; where a client leaves against medical advice (AMA) or goes absent without leave (AWOL), the service follows a documented process including risk assessment, attempts to make contact, and notification of referrer and GP$$,
  $$Reg 12$$,
  $$Planned and unplanned discharge policy; AMA/AWOL protocol; records of unplanned discharges with actions taken; evidence of contact attempts; referrer and GP notification records; follow-up records for clients who self-discharge$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safeguarding
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$The service has a safeguarding policy and all staff receive safeguarding training; the service takes a trauma-informed approach to care and recognises that clients may have histories of abuse, exploitation, or involvement in the criminal justice system; safeguarding concerns are escalated without delay$$,
  $$Reg 13$$,
  $$Safeguarding policy; staff training records; evidence of trauma-informed approach in care planning; safeguarding referral log with outcomes; evidence of escalation to local authority safeguarding where required$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$The service has a clinical skill mix sufficient to manage withdrawal safely; where the service provides medically monitored detoxification, a prescribing clinician is available and accessible; clinical staff have appropriate training and experience in addiction treatment$$,
  $$Reg 18$$,
  $$Staff skill mix records; prescriber contact and availability records; evidence prescriber appointments are conducted face-to-face at admission and for clinical review; clinical staff training and qualification records$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MM-01$$, NULL,
  $$Medicines are managed safely; a medical summary is present in every client record at the start of treatment; controlled drugs (including detoxification medication and opioid substitution therapy) are stored, prescribed, administered and disposed of in accordance with legal requirements; medicines errors are recorded and investigated$$,
  $$Reg 12$$,
  $$Medical summaries in all client records; controlled drug register and storage records; prescriptions and MAR charts; evidence of face-to-face prescriber assessment at admission; medicines disposal records; medicines error log with investigation records$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A comprehensive assessment is completed for each client at admission using validated tools; this includes severity of dependence (AUDIT-C or SADQ for alcohol; substance use history for drugs), mental health screening, and physical health needs; findings are documented and inform the treatment plan$$,
  $$Reg 9$$,
  $$Admission assessments per client; AUDIT-C or SADQ records; mental health screening records; physical health assessment at admission; evidence assessment findings are reflected in the treatment plan$$,
  10
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Care is delivered in a non-judgmental, trauma-informed way; staff understand that addiction is a health condition and do not stigmatise clients; clients are treated with dignity and their personal goals and motivations for recovery are at the centre of the treatment programme$$,
  $$Reg 10$$,
  $$Evidence of trauma-informed approach in care records; client feedback on how they were treated; evidence recovery goals are individual and set by the client; staff training records on non-judgmental approaches; evidence clients feel able to raise concerns$$,
  19
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$Clients are involved in decisions about their treatment programme and are supported to be active participants in their own recovery; family involvement in treatment is offered and facilitated where the client consents and it is therapeutically appropriate$$,
  $$Reg 10$$,
  $$Evidence of client involvement in treatment decisions; records of family work or family sessions where offered; client consent to family involvement; evidence programme is flexible to individual need where possible$$,
  20
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Therapeutic programme
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
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
WHERE ki.title = $$Complaints and feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A registered manager is in post and registered with the CQC; the manager provides visible clinical and operational leadership; there is a clear management structure with defined clinical and operational responsibilities$$,
  $$Reg 17$$,
  $$CQC registered manager certificate; evidence of manager's clinical and operational involvement; management structure chart; evidence manager is accessible to staff and clients$$,
  23
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Clinical governance systems include regular audits of medicines management, withdrawal monitoring records, client risk assessments, and treatment plan quality; audit findings are acted on; policies are reviewed and up to date$$,
  $$Reg 17$$,
  $$Clinical audit schedule and completed records; medicines audit records; withdrawal monitoring audit; risk assessment quality audit; evidence actions from audits are completed; policy review dates$$,
  24
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Incidents and near misses including overdoses, self-harm, unplanned discharges, and safeguarding concerns are reported, recorded and investigated; the service fulfils its Duty of Candour when something goes wrong; notifiable incidents are reported to the CQC within the required timeframe$$,
  $$Reg 17, Reg 20$$,
  $$Incident log covering overdoses, self-harm, and unplanned discharges; investigation records and outcomes; CQC notifications where required; Duty of Candour records; evidence of learning shared with staff$$,
  25
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA sub-service items
-- Note: In a residential rehab context, dementia most commonly presents as
-- alcohol-related brain damage (ARBD) / Korsakoff syndrome in clients with
-- severe, long-term alcohol dependence. Cognitive impairment may only become
-- apparent once alcohol is removed during detoxification.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-SAF-01$$, NULL,
  $$Where a client has or develops alcohol-related brain damage (ARBD) or Korsakoff syndrome during treatment, a specific risk assessment is completed covering cognitive impairment, disorientation, vulnerability, and capacity to participate safely in the therapeutic programme$$,
  $$Reg 12$$,
  $$ARBD or Korsakoff-specific risk assessments; evidence of cognitive screening (e.g. MMSE or MoCA) where ARBD is suspected; records of actions taken to manage risks associated with cognitive impairment; evidence of liaison with specialist services$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-SAF-02$$, NULL,
  $$Staff are trained to recognise the signs of alcohol-related brain damage and Korsakoff syndrome; they understand that cognitive impairment may only emerge once alcohol is removed and that early thiamine (vitamin B1) administration is critical in preventing Wernicke's encephalopathy$$,
  $$Reg 18$$,
  $$ARBD and Korsakoff awareness training records; evidence of thiamine administration protocol; records of thiamine given during alcohol detox; evidence staff can describe signs of Wernicke-Korsakoff syndrome$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-SAF-03$$, NULL,
  $$Where a client with dementia or ARBD requires any restrictive intervention, it is lawful, proportionate and documented; the service has a clear restraint policy; any use of restraint is reported and reviewed$$,
  $$Reg 13$$,
  $$Restraint policy; evidence staff understand the policy; records of any restraint episodes with rationale and review; MCA assessment records supporting any restriction$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Health and wellbeing$$ AND kq.name = $$Effective$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
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
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-WEL-01$$, NULL,
  $$The service's governance includes oversight of ARBD and dementia-related care; this covers cognitive screening practice, thiamine protocols, DoLS compliance, and discharge planning quality for clients with cognitive impairment$$,
  $$Reg 17$$,
  $$ARBD governance records; thiamine protocol audit; cognitive screening audit; DoLS compliance review; discharge planning quality review for clients with ARBD or dementia$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$DEM-WEL-02$$, NULL,
  $$The service learns from incidents involving clients with ARBD or dementia; learning is shared with staff; clinical practices around ARBD recognition and management are reviewed and updated in line with current evidence$$,
  $$Reg 17$$,
  $$ARBD-related incident records and outcomes; evidence learning has been shared; evidence clinical practice aligns with current ARBD guidance; records of practice changes following incidents or guidance updates$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
