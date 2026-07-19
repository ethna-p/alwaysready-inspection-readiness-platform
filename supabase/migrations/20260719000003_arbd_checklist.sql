-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: ARBD Specialist Care Home checklist items
-- Strategy: copy all Residential Care Home items as the baseline, then apply
-- ARBD-specific overrides in-place.  Compared with writing 86 individual
-- INSERTs, this approach makes the specialist delta immediately visible.
--
-- What changes vs the RC baseline:
--   REPURPOSED  SAF-MR-03  dysphagia → absconding / community access risk
--   RENAMED     SAF-MR-04  bed rails → SAF-MR-05 (display_order 10)
--   NET-NEW     SAF-MR-04  behaviour support plans for ARBD/Korsakoff's
--   REPURPOSED  EFF-EB-03  quality accreditation → thiamine supplementation
--   NET-NEW     WEL-GM-06  dry house / alcohol abstinence policy
--   UPDATED     ~33 items  ARBD-specific wording (see UPDATE block below)
--
-- Total: 84 copied + 2 net-new = 86 items.
-- Safe to re-run: DELETE removes existing ARBD items before re-seeding.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Wipe any previously seeded ARBD items ─────────────────────

DELETE FROM public.klo_checklist_items
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── 2. Copy all Residential Care Home items as the baseline ───────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT
  klo_item_id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order
FROM public.klo_checklist_items
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$);

-- ── 3. ARBD-specific overrides ────────────────────────────────────
-- Only items where content meaningfully differs from the RC baseline.

-- ════ SAFE ════════════════════════════════════════════════════════

-- SAF-SC-03: substance-related and absconding incidents (RC: falls/pressure ulcer)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Substance-related incidents, absconding episodes and incidents involving challenging behaviour are reviewed monthly alongside standard incident categories, with documented learning$$,
  evidence_notes  = $$Incident log; monthly review minutes showing ARBD-specific categories; evidence of changed practice$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SC-03$$;

-- SAF-MR-01: add ataxia and gait disturbance specific to ARBD
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Falls risk assessments completed on admission and reviewed regularly; ataxia and gait disturbance associated with ARBD are identified and managed; post-fall review documented$$,
  evidence_notes  = $$Falls risk assessments; post-fall review records; evidence of ataxia-specific management$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-MR-01$$;

-- SAF-MR-03: replace dysphagia (RC) with absconding / community access risk (ARBD)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Absconding and community access risk assessment is completed for each resident; the management plan balances safety with the promotion of independence$$,
  evidence_notes  = $$Community access / absconding risk assessment per resident; management plan; review records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-MR-03$$;

-- SAF-MR-04 → SAF-MR-05: bed rails moves up one to make room for behaviour support plans
UPDATE public.klo_checklist_items SET
  ref           = $$SAF-MR-05$$,
  display_order = 10
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-MR-04$$;

-- SAF-SP-01: ARBD-specific pre-admission (RC: general pre-admission + trial visit)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Pre-admission assessment is completed before or on admission and includes: ARBD history, psychiatric background, substance misuse history, relapse risk factors and current capacity status$$,
  evidence_notes  = $$Pre-admission assessment document; completed ARBD/psychiatric history; capacity status at admission$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SP-01$$;

-- SAF-SP-02: clinical summary focus (RC: Red Bag scheme)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Hospital transfer documentation (clinical and medication summary, care needs) accompanies residents on transfer$$,
  evidence_notes  = $$Hospital transfer records; evidence of documentation sent with resident$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SP-02$$;

-- SAF-SP-03: community mental health team explicitly included (RC: district nursing)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$GP, community mental health team and other multi-disciplinary input is documented and acted upon; referral pathways are clear and used appropriately$$,
  evidence_notes  = $$MDT referral letters; CMHT correspondence; GP visit records; evidence of recommendations acted upon$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SP-03$$;

-- SAF-SP-04: enablement programme (RC: discharge-to-home)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Community step-down and reintegration transitions are planned with the resident and relevant agencies; the enablement programme stage is documented and reviewed$$,
  evidence_notes  = $$Transition plans; enablement programme records; step-down reviews; agency correspondence$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SP-04$$;

-- SAF-EI-03: PPE and staff knowledge emphasis (RC: outbreak plan tested)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Infection prevention and control policy is in place and the outbreak management procedure is known to staff; PPE is available and used correctly$$,
  evidence_notes  = $$IPC policy; PPE availability records; staff training records; outbreak management procedure$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-EI-03$$;

-- SAF-SS-01: ARBD/Korsakoff specialist staffing (RC: dependency-based ratio)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Staffing rota reflects ARBD specialist care needs; sufficient staff with ARBD and Korsakoff syndrome awareness training are on duty on every shift$$,
  evidence_notes  = $$Staff rota; ARBD awareness training matrix; dependency assessment records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-SS-01$$;

-- SAF-MT-01: EMAR and annual competency checks (RC: MAR audit only)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$MAR charts or electronic medicine administration records (EMAR) are audited monthly for accuracy and gaps; staff competency in medicine administration is checked annually$$,
  evidence_notes  = $$MAR / EMAR audit records; monthly stock check; annual competency check records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-MT-01$$;

-- SAF-MT-03: prescribed thiamine storage and administration (RC: general storage)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Medicines storage, including fridge temperatures, is checked and logged daily; prescribed supplements including thiamine (vitamin B1) are stored and administered safely$$,
  evidence_notes  = $$Daily temperature logs; medicine storage audit; prescribed supplement administration records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$SAF-MT-03$$;

-- ════ EFFECTIVE ═══════════════════════════════════════════════════

-- EFF-AN-01: psychiatric and substance misuse history in support plans (RC: general needs)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Support plans are completed before or on admission and include: psychiatric history, relapse risk factors, substance misuse background, self-care capacity and current physical and mental health needs$$,
  evidence_notes  = $$Admission support plan; psychiatric history documentation; substance misuse history; relapse risk assessment$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-AN-01$$;

-- EFF-AN-02: "Support plans" replaces "Care plans" consistent with ARBD terminology
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Support plans are reviewed at least monthly or after any significant change in the person's needs or capacity$$,
  evidence_notes  = $$Monthly review records; evidence of plan updates following changes; review sign-off$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-AN-02$$;

-- EFF-AN-03: confabulation and memory impairment (RC: Accessible Information Standard)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Communication and cognitive needs are assessed; confabulation, memory difficulties and their impact on care planning and capacity assessment are documented and communicated to staff$$,
  evidence_notes  = $$Communication needs assessment; cognitive assessment records; staff briefing notes on confabulation and memory impairment$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-AN-03$$;

-- EFF-EB-01: monthly nutritional assessment and diabetes (RC: general MUST screening)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Nutrition and hydration screening is completed and reviewed monthly; any concerns are escalated to the GP or dietitian; specialist dietary needs (e.g. diabetes) are provided for$$,
  evidence_notes  = $$MUST or equivalent screening tool; monthly nutritional assessment records; dietitian referrals; diabetic diet records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-EB-01$$;

-- EFF-EB-03: thiamine supplementation (RC: quality accreditation scheme — not relevant to ARBD)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Prescribed thiamine (vitamin B1) supplementation is documented, administered correctly and its effectiveness is monitored$$,
  evidence_notes  = $$Prescription records for thiamine; MAR / EMAR administration records; clinical review notes$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-EB-03$$;

-- EFF-EB-04: rehabilitation and enablement goals (RC: general wellbeing outcomes)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Resident outcomes, including rehabilitation progress and wellbeing, are monitored and reviewed against each person's individual enablement goals$$,
  evidence_notes  = $$Enablement programme records; outcome reviews; progress notes; goal-setting documentation$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-EB-04$$;

-- EFF-HL-01: CMHT and substance misuse services added (RC: GP/dentist/optician only)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Residents are supported to access GP, dentist, optician, podiatry, community mental health team and substance misuse services as needed; appointments are arranged and attended$$,
  evidence_notes  = $$Appointment records; GP correspondence; CMHT correspondence; substance misuse service referrals$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-HL-01$$;

-- EFF-HL-02: ARBD-associated conditions (RC: generic long-term conditions)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Health action plans are in place for residents with long-term conditions associated with ARBD, such as diabetes, liver disease or hypertension$$,
  evidence_notes  = $$Health action plans; long-term condition management records; GP / specialist correspondence$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-HL-02$$;

-- EFF-HL-03: cognitive stimulation and rehabilitation (RC: general physical wellbeing)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Activity programme promotes cognitive stimulation, physical wellbeing and rehabilitation goals; access to the community and social events is supported$$,
  evidence_notes  = $$Activity programme; individual activity plans; cognitive stimulation records; community access log$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-HL-03$$;

-- EFF-CT-02: fluctuating capacity in ARBD/Korsakoff's; DoLS (RC: general MCA)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Mental Capacity Act assessments are completed where capacity is in doubt; in ARBD and Korsakoff's syndrome capacity may fluctuate and assessments are reviewed regularly; DoLS applications are made where appropriate$$,
  evidence_notes  = $$MCA assessment records; best interest decisions; DoLS applications and authorisations; capacity review dates$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$EFF-CT-02$$;

-- ════ CARING ══════════════════════════════════════════════════════

-- CAR-KD-02: substance misuse and psychiatric history are sensitive — explicit confidentiality
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Confidentiality of resident information, including substance misuse history and psychiatric background, is maintained and understood by all staff$$,
  evidence_notes  = $$Confidentiality policy; staff training records; evidence of discreet information handling (e.g. private handovers)$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$CAR-KD-02$$;

-- CAR-PC-01: life history, rehabilitation aspirations (RC: generic individualised care plans)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Support plans are individualised and include the person's life history, personal goals, rehabilitation aspirations and preferences for daily living$$,
  evidence_notes  = $$Individualised support plans; life history records; goal-setting documentation; evidence of resident involvement in planning$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$CAR-PC-01$$;

-- CAR-IC-01: cognitive stimulation and rehabilitation stage (RC: interests only)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Meaningful activities and cognitive stimulation programme is in place, tailored to individual abilities and rehabilitation stage; access to community activities and events is supported$$,
  evidence_notes  = $$Activity programme; individual activity plans; community access records; cognitive stimulation records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$CAR-IC-01$$;

-- CAR-IC-05: fluctuating capacity (RC: general ACP offer)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Advance care planning discussions are offered and documented; particular care is taken where residents have fluctuating capacity$$,
  evidence_notes  = $$Advance care planning records; evidence of discussions held; capacity review linked to ACP$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$CAR-IC-05$$;

-- ════ RESPONSIVE ══════════════════════════════════════════════════

-- RES-CC-01: CMHT and substance misuse services named (RC: generic MDT)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Multi-disciplinary team input, including community mental health team, substance misuse services and GP, is sought and recorded for residents with complex needs$$,
  evidence_notes  = $$MDT meeting records; CMHT and substance misuse correspondence; GP referral records; evidence of recommendations acted upon$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-CC-01$$;

-- RES-CC-02: keywork relationship and rehabilitation monitoring (RC: named contact only)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Key worker system is in place: each resident has a named key worker who maintains the keywork relationship, monitors rehabilitation progress and advocates for their needs$$,
  evidence_notes  = $$Named key worker records; keywork session notes; rehabilitation progress reviews$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-CC-02$$;

-- RES-CC-03: enablement programme (RC: internal transitions within the home)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Community step-down and reintegration transitions are planned with the resident, their family and relevant agencies; the enablement programme stage is documented and reviewed$$,
  evidence_notes  = $$Transition plans; enablement stage records; agency correspondence; discharge planning minutes$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-CC-03$$;

-- RES-LF-02: adapted engagement for cognitive and memory difficulties (RC: general meetings)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Resident meetings are held regularly; engagement approaches take into account cognitive and memory difficulties; outcomes are acted upon$$,
  evidence_notes  = $$Resident meeting minutes; evidence of accessible format or adapted engagement; evidence of actions taken$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-LF-02$$;

-- RES-TA-01: ARBD-specific pre-admission assessment (RC: general admission process)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Admission process is clear, timely and non-discriminatory; includes an ARBD-specific pre-admission assessment$$,
  evidence_notes  = $$Admission policy; pre-admission assessment tool; equality monitoring at admission$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-TA-01$$;

-- RES-TA-03: cognitive impairment and simple language (RC: sensory / communication needs)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Information is available in accessible formats for residents with cognitive impairment or communication difficulties; posters and written materials use simple, clear language$$,
  evidence_notes  = $$Accessible information policy; examples of adapted materials; evidence of communication support provided$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-TA-03$$;

-- RES-EE-03: ARBD population vulnerabilities (RC: Accessible Information Standard only)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Staff receive training on equality, diversity and the specific needs and vulnerabilities of the ARBD population$$,
  evidence_notes  = $$Equality and diversity training records; ARBD-specific training matrix; evidence of training applied in practice$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$RES-EE-03$$;

-- ════ WELL-LED ════════════════════════════════════════════════════

-- WEL-SD-01: ARBD enablement and rehabilitation focus (RC: generic vision and values)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Service has a clear, documented vision and values that reflect the specialist ARBD enablement and rehabilitation focus, and these are understood by staff$$,
  evidence_notes  = $$Statement of purpose; vision and values document; evidence of staff awareness$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-SD-01$$;

-- WEL-GM-01: reflects specialist ARBD service and enablement model (RC: generic statement)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Statement of purpose is current and accurately reflects the specialist ARBD service provided, including the enablement model$$,
  evidence_notes  = $$Current statement of purpose; CQC registration details; evidence of last review date$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-GM-01$$;

-- WEL-GM-02: ARBD-specific risk assessments in audit schedule (RC: generic audit areas)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Quality assurance audit schedule covers: care plans, medicines, ARBD-specific risk assessments, environment, health and safety and staffing$$,
  evidence_notes  = $$Audit schedule; completed audit records; action plans arising from audits; area manager oversight records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-GM-02$$;

-- WEL-PC-01: community reintegration as a specific goal (RC: general community engagement)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Service engages with the local community to support social inclusion and community reintegration for residents$$,
  evidence_notes  = $$Community engagement records; community trip logs; partnerships with local groups or clubs$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-PC-01$$;

-- WEL-PC-02: CMHT and substance misuse services named (RC: generic health/social care)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Partnership working with local health, social care, community mental health and substance misuse services is evidenced$$,
  evidence_notes  = $$Partnership agreements or protocols; correspondence with local authority, CMHT and substance misuse services; joint working records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-PC-02$$;

-- WEL-IL-03: ARBD specialist networks (RC: generic research/pilots)
UPDATE public.klo_checklist_items SET
  checklist_item  = $$Service engages with ARBD specialist networks, research or sector innovation where available$$,
  evidence_notes  = $$Evidence of engagement with ARBD networks or clinical specialists; research or pilot participation records$$
WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$) AND ref = $$WEL-IL-03$$;

-- ── 4. Net-new items (no RC equivalent) ──────────────────────────

-- SAF-MR-04: behaviour support plans (SAF-MR-04 slot freed by renaming bed rails to SAF-MR-05)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Behaviour support plans are in place for residents who present with challenging behaviour associated with ARBD or Korsakoff's syndrome$$,
  $$Reg 12$$,
  $$Behaviour support plans; evidence of staff training in challenging behaviour; review records$$,
  9
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$;

-- WEL-GM-06: dry house / alcohol abstinence policy — fundamental to ARBD specialist practice
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
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$;
