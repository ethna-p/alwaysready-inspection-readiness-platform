# Nursing Home Checklist Cross-Reference Review v2
## CQC Draft Assessment Framework ASC v9 — Exact Language Audit

**Scope:** 84 Nursing Home Core checklist items  
**Source migrations:**
- `20260716000001_checklist_tables.sql` — original 84 items
- `20260719000001_checklist_content_corrections.sql` — 4 corrections applied

**Method:** Every checklist item was compared against the CQC Good-level rating characteristics for the relevant KLOE. Items are flagged ✏️ wherever the wording paraphrases rather than uses CQC's exact language. No item was found to use CQC's exact Good-characteristic wording verbatim across all 84 items; all require revision to varying degrees. Where an item correctly names CQC-specific tools or terms (DoLS, FPPR, DSPT) these are retained in revised versions.

**Note on the 20260719 corrections:** EFF-EB-03 checklist text was replaced; SAF-SC-03, EFF-CT-02 and WEL-IL-03 had evidence_notes updated only. All four are assessed here against their current (post-correction) state.

---

## Key question: SAFE

### SAF-SC — Safety Culture

**KLOE:** Is there a positive and equitable safety culture where risks are proactively managed, concerns are listened to, incidents are thoroughly investigated, and lessons are learned to improve care?

**CQC Good characteristics (verbatim extracts used as source):**
- "All incidents are recorded, investigated and outcomes are communicated to those involved."
- "There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve."
- "The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care."
- "There is a good understanding of the duty of candour."
- "Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen."
- "Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse. There are systems and processes in place to identify concerns and prevent closed cultures from developing."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-SC-01 | Clinical incident log (medication errors, falls, pressure injuries) reviewed monthly with trend analysis | "All incidents are recorded, investigated and outcomes are communicated to those involved." / "The service looks for safety-related themes and trends." | ✏️ Revise — enumerates clinical categories not in CQC language; "monthly" is not a CQC requirement | All incidents are recorded, investigated, and the service looks for safety-related themes and trends to drive improvement. |
| SAF-SC-02 | Duty of Candour policy is understood and applied by nursing and care staff whenever something goes wrong | "There is a good understanding of the duty of candour." / "When an incident has happened, staff are open and transparent with people and those close to them." | ✏️ Revise — "policy is understood" is not CQC's phrase; CQC says "good understanding of the duty of candour" | There is a good understanding of the duty of candour; staff are open and transparent with people and those close to them when incidents occur. |
| SAF-SC-03 | Clinical governance meeting (medicines, pressure ulcers, falls) held monthly with documented actions | "The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care." | ✏️ Revise — "clinical governance meeting monthly" is operational language not in CQC text; safety alerts language now in evidence_notes only, should be in the item | Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care. |
| SAF-SC-04 | Whistleblowing and raising concerns policy is known to nursing and care staff | "Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen." | ✏️ Revise — "policy is known" is not CQC language; CQC focuses on culture of welcoming concerns, not policy awareness | Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources to identify and manage safety risks. |
| SAF-SC-05 | Learning from clinical incidents is shared at nursing handover and staff meetings | "There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve." / "learning from external safety incidents is embedded in the delivery of care." | ✏️ Revise — "shared at handover and staff meetings" is operational; CQC language is about embedding learning in care delivery | There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve. |

---

### SAF-MR — Managing Risks During Care and Treatment

**KLOE:** Are risks to each person monitored and managed so that their care and treatment is safe and supportive?

**CQC Good characteristics (verbatim extracts):**
- "People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm."
- "People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance."
- "Care, support and treatment are discussed with people so they understand the potential risks and side effects."
- "When people communicate their needs, emotions or distress, they are consistently supported and listened to. Staff can manage this in a positive way that protects people's rights and safety."
- "The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe."
- "Restraint is only ever used as a last resort and there is a clear commitment from all staff to minimising the use of restrictive interventions in the service."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-MR-01 | Pressure ulcer risk assessment (e.g. Waterlow) completed on admission and reviewed regularly | "People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm." | ✏️ Revise — names a specific tool (Waterlow) and specifies admission; CQC language covers foreseeable risks in care plans generally | Care plans reflect foreseeable risks including pressure ulcer risk; clinical risks are anticipated and managed to reduce the potential for harm, in line with recognised good practice. |
| SAF-MR-02 | Moving and handling risk assessments completed for all residents with mobility or handling equipment needs | "People's care plans reflect any foreseeable risks and how they should be managed." / "care is provided in line with recognised good practice guidance." | ✏️ Revise — operational phrasing; CQC language is about care plans reflecting foreseeable risks and good practice | Care plans reflect moving and handling risks; care is provided in line with recognised good practice guidance, using appropriate specialist equipment. |
| SAF-MR-03 | Falls risk assessed and reviewed; post-fall clinical review (including neurological observations where indicated) completed | "People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm." | ✏️ Revise — "neurological observations" is clinical operational detail not in framework; CQC uses deterioration/emergency language | Falls risk is reflected in care plans; deterioration and emergencies are anticipated and managed to reduce the potential for harm, including prompt post-fall review. |
| SAF-MR-04 | Choking and dysphagia risk identified with SALT input; texture-modified diets followed and documented | "People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance." | ✏️ Revise — highly operational, SALT referral not in CQC text; CQC language is about good practice guidance and protection from avoidable harm | Choking and dysphagia risks are identified and care is provided in line with recognised good practice guidance, including appropriate specialist referral, to protect residents from avoidable harm. |

---

### SAF-SP — Safe Systems, Pathways and Transitions

**KLOE:** Are there systems to enable collaborative working across care pathways and services, to ensure that safety and continuity of care are prioritised?

**CQC Good characteristics (verbatim extracts):**
- "Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners."
- "Shared systems and processes for safe care are managed collaboratively, including proactive risk identification, monitoring and learning."
- "Plans and information for care during transitions are established and shared before people move between services."
- "Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes. People experience a smooth process and there is continuity of care."
- "Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up."
- "The service has appropriate systems and processes to manage its responsibilities in relation to delegated healthcare activities safely, in line with good practice."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-SP-01 | Pre-admission clinical assessment is completed by a registered nurse before admission | "Plans and information for care during transitions are established and shared before people move between services." | ✏️ Revise — "registered nurse" requirement is not CQC language; CQC focuses on plans being established before transitions | Plans and information for care are established and shared before people move into the service, considering individual needs, circumstances and expected outcomes. |
| SAF-SP-02 | Hospital transfer documentation (clinical summary, medicines, care needs) accompanies residents on transfer | "Plans and information for care during transitions are established and shared before people move between services." / "People experience a smooth process and there is continuity of care." | ✏️ Revise — "clinical summary, medicines" is operational detail; CQC language is about plans and information being established and shared | Plans and information for care during transitions are established and shared before people move between services to ensure continuity and a smooth process. |
| SAF-SP-03 | GP, tissue viability nurse, dietitian and other clinical specialist input is documented and acted on | "Staff work together proactively with teams in other services... to deliver co-ordinated, timely, consistent and person-centred care. Actions are appropriately owned and followed up." | ✏️ Revise — lists specific professionals not named in CQC text; CQC language is about proactive collaboration with other services | Staff work proactively with teams in other services to deliver co-ordinated, timely and person-centred care; actions are appropriately owned and followed up. |
| SAF-SP-04 | Clinical handover between shifts is structured, documented and covers all residents with changing needs | "Shared systems and processes for safe care are managed collaboratively, including proactive risk identification, monitoring and learning." | ✏️ Revise — "handover between shifts" is operational; CQC language is about shared systems for safe care managed collaboratively | Shared systems and processes for safe care, including handover, are managed collaboratively, with proactive risk identification, monitoring and learning. |

---

### SAF-SG — Safeguarding

**KLOE:** Does the service work with partners and people to protect their rights to live in safety and be free from abuse and improper treatment?

**CQC Good characteristics (verbatim extracts):**
- "The service supports people to feel safe. It takes timely and appropriate action when people are at risk or have experienced abuse or neglect."
- "There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service."
- "Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed."
- "Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care."
- "People are deprived of their liberty lawfully. Any potential deprivation of liberty is recognised promptly and appropriate authorisation is sought."
- "Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person."
- "People are supported to understand what safeguarding means and how to raise concerns on behalf of themselves and others."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-SG-01 | Safeguarding Adults policy is current, accessible and all staff are aware of it | "There are effective safeguarding systems, processes and practices... communicated effectively and are accessible to people, staff and visitors to the service." | ✏️ Revise — "policy is current" is not CQC language; CQC refers to "effective safeguarding systems, processes and practices" that are accessible to people, staff and visitors | There are effective safeguarding systems, processes and practices, accessible to people, staff and visitors to the service, operating in line with legislation and guidance. |
| SAF-SG-02 | All nursing and care staff have completed safeguarding adults training at the appropriate level | "...managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity." | ✏️ Revise — "completed training at appropriate level" paraphrases; CQC says "appropriately trained staff" | Safeguarding systems are managed by appropriately trained staff; training is appropriate to role, refreshed at regular intervals, with competency assessed. |
| SAF-SG-03 | Safeguarding referrals are made correctly and promptly; referral log maintained | "Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed." | ✏️ Revise — "referral log" is operational; CQC language focuses on timely sharing with agencies and escalation pathways | Information about people who have suffered harm or are at risk is shared with the local authority in a timely way; staff use appropriate escalation pathways when concerns are not addressed. |

---

### SAF-EI — Safe Environments and Infection Prevention and Control

**KLOE:** Are potential risks within the care environment detected and managed appropriately to enable safe delivery of care for people and staff?

**CQC Good characteristics (verbatim extracts):**
- "Environments are safe and adapted to meet people's needs, in line with legislation and good practice."
- "Where the provider is responsible, there is a comprehensive system to proactively manage the safety and upkeep of the premises (including communal and personal spaces) and equipment, and risks are assessed and controlled. Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance."
- "Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance."
- "The service monitors and acts on equipment alerts, recalls and safety information."
- "The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic."
- "Fire safety procedures are effective."
- "Information about the risk of infection is shared appropriately with relevant partners, people using the service and visitors."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-EI-01 | Fire risk assessment is current; PEEPs are in place reflecting clinical and mobility needs | "Fire safety procedures are effective." | ✏️ Revise — "fire risk assessment is current; PEEPs" is operational detail beyond CQC's single phrase; however PEEPs are an important clinical addition for nursing homes | Fire safety procedures are effective; Personal Emergency Evacuation Plans are in place and reflect the individual clinical and mobility needs of all residents. |
| SAF-EI-02 | Gas, electrical and water safety certificates, including legionella testing, are current | "There is a comprehensive system to proactively manage the safety and upkeep of the premises... Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance." | ✏️ Revise — lists certificates not named by CQC; CQC language is about a comprehensive system with professionally qualified people doing checks | There is a comprehensive system to proactively manage the safety and upkeep of the premises; professionally qualified and competent people complete all required environmental checks and maintenance. |
| SAF-EI-03 | Infection prevention and control policy is in place and the outbreak management plan has been tested, including for higher-acuity clinical procedures | "The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic." | ✏️ Revise — "outbreak management plan tested" and "higher-acuity clinical procedures" are operational additions not in CQC text | The service manages the control and prevention of infection well; infection prevention and control roles are clear and the risk of infection is minimised because premises and equipment are kept clean and hygienic. |
| SAF-EI-04 | Clinical equipment (hoists, profiling beds, pressure-relieving mattresses) is serviced and maintained | "Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance." | ✏️ Revise — lists specific equipment types not in CQC text; CQC uses broader "special or adaptive equipment" language | Equipment, including special or adaptive equipment, is maintained, stored and used in line with good practice and guidance; the service monitors and acts on equipment alerts, recalls and safety information. |
| SAF-EI-05 | Sharps and clinical waste disposal arrangements meet current guidance | "Facilities, equipment... maintained... in line with good practice and guidance." / No specific Good-level text on clinical waste disposal | ✏️ Revise — "sharps and clinical waste" is operational; CQC's Good characteristics do not address clinical waste specifically but it falls under safe environment/good practice | The environment and clinical waste arrangements meet current legislation and good practice guidance; the service is kept clean and hygienic to minimise the risk of infection. |

---

### SAF-SS — Safe Staffing

**KLOE:** Are there enough qualified, skilled and experienced staff who receive adequate support, supervision and development to keep people safe and meet their needs?

**CQC Good characteristics (verbatim extracts):**
- "Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles."
- "Recruitment, disciplinary and capability processes, and ongoing checks, are safe, effective and reviewed for equality impacts."
- "There are appropriate staffing levels and skill mix to meet people's needs."
- "Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services."
- "Staff and volunteers receive training that is appropriate to their role. This is embedded into practice and refreshed at regular intervals. Competency is assessed as required to maintain knowledge and skills in line with good practice."
- "There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed)."
- "The service has systems for investigating any allegations against people in positions of trust that it employs, and actions are taken to address any risk to people."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-SS-01 | Registered nurse coverage is maintained on every shift, with a contingency plan for short-notice absence | "There are appropriate staffing levels and skill mix to meet people's needs." | ✏️ Revise — "registered nurse coverage on every shift" is a nursing home operational requirement; CQC language is about appropriate staffing levels and skill mix | There are appropriate staffing levels and skill mix, including registered nurse cover on every shift, to meet people's needs; contingency arrangements are in place for staff absence. |
| SAF-SS-02 | NMC registration is verified and revalidation dates are tracked for all registered nurses | "There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed)." | ✏️ Revise — "NMC registration verified" is operational; CQC language references professional revalidation as part of support processes | There are processes to support professional revalidation where needed; NMC registration and revalidation dates are verified and tracked for all registered nurses. |
| SAF-SS-03 | DBS and reference checks are completed for all staff before they start unsupervised work | "Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles." | ✏️ Revise — "before unsupervised work" is operational; CQC language is about thorough and safe recruitment practices | Thorough and safe recruitment practices are in place, including DBS checks and references, ensuring staff and volunteers are suitably experienced, qualified and competent. |
| SAF-SS-04 | Clinical supervision and appraisal are completed for all nursing staff at agreed intervals | "There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed)." | ✏️ Revise — "at agreed intervals" is operational; CQC language is about induction, supervision and appraisal processes being in place | There are supervision and appraisal processes to support nursing staff to develop and improve services; competency is assessed to maintain knowledge and skills in line with good practice. |

---

### SAF-MT — Safe Medicines and Treatments

**KLOE:** Are medicines and treatments safe and delivered in a timely way, in line with people's needs and preferences?

**CQC Good characteristics (verbatim extracts):**
- "There is a clear approach to the safe use of medicines, and roles and responsibilities are understood."
- "People and their representatives are involved in assessments, reviews and decisions, including the level of support needed and self-medication. This is clearly documented in care records."
- "Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance."
- "People are supported with their medicines in line with the Mental Capacity Act 2005, and this is clearly documented in their care plan."
- "Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance."
- "The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable."
- "The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| SAF-MT-01 | MAR charts are audited monthly for accuracy and gaps, including controlled drugs | "Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance." | ✏️ Revise — "MAR charts audited monthly" is operational; CQC language is about medicines being recorded safely in line with legislation | Medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance; medication records are audited regularly for accuracy and gaps. |
| SAF-MT-02 | Controlled drugs register is reconciled and checked by two staff | "Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance." | ✏️ Revise — "reconciled and checked by two staff" is operational procedure; CQC's exact language should be used | Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance, with dual sign-off on all controlled drug transactions. |
| SAF-MT-03 | Syringe driver and IV medicines administration is undertaken only by nurses with current competency sign-off | "There is a clear approach to the safe use of medicines, and roles and responsibilities are understood." | ✏️ Revise — "syringe driver and IV" is operational clinical detail; CQC's phrase is about roles and responsibilities being clear and understood | There is a clear approach to the safe use of medicines; roles and responsibilities for advanced administration, including syringe drivers and IV medicines, are understood and staff hold current competency. |
| SAF-MT-04 | Medicines storage, including fridge temperatures and clinical room security, is checked daily and logged | "medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance." | ✏️ Revise — "fridge temperatures and clinical room security, checked daily and logged" is operational; CQC language is about storage in line with legislation | Medicines are stored safely in line with legislation and guidance, including temperature-controlled storage; storage checks are completed and recorded regularly. |

---

## Key question: EFFECTIVE

### EFF-AN — Assessing Needs

**KLOE:** Are people's needs holistically assessed and reviewed with them to maximise the effectiveness of their care, support and treatment?

**CQC Good characteristics (verbatim extracts):**
- "People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics."
- "People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment."
- "Assessments inform care plans, enabling people to receive care, support and treatment that have the best possible outcomes."
- "Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected."
- "Risk assessments about care are person-centred, proportionate, and regularly reviewed with the person, where possible."
- "Assessments focus on people's strengths, and there is a trauma-informed approach to understanding people's needs."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| EFF-AN-01 | Pre-admission and ongoing clinical needs assessments are completed by a registered nurse, covering physical, mental and clinical needs | "People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics." | ✏️ Revise — "by a registered nurse" is operational; misses "emotional, sensory, social" needs and "wishes"; "clinical" is not in CQC's taxonomy | People's needs are comprehensively assessed, reflecting their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics. |
| EFF-AN-02 | Nursing care plans are reviewed at least monthly or after any significant clinical change | "Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected." | ✏️ Revise — "at least monthly" is operational; CQC uses "regularly reviewed and updated" | Assessments and care plans are regularly reviewed and updated to make sure staff have current information, so that care is meeting people's needs and individual outcomes as expected. |
| EFF-AN-03 | Communication needs are assessed and met in line with the Accessible Information Standard | "People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment." | ✏️ Revise — adds "Accessible Information Standard" which is appropriate but the core phrase paraphrases CQC; also should include CQC's reason ("to maximise the effectiveness") | People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment, in line with the Accessible Information Standard. |

---

### EFF-EB — Evidence-Based Care and Equitable Outcomes

**KLOE:** Is care, support and treatment delivered in line with legislation, evidence-based standards and good practice, to achieve equitable and good outcomes?

**CQC Good characteristics (verbatim extracts):**
- "People receive care, support and treatment aligned to recognised good practice standards."
- "Staff and leaders understand the current legislation, standards and good practice relevant to their service and apply these effectively."
- "There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it."
- "Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible."
- "People's nutritional and hydration needs are met in line with current standards and good practice guidance."
- "People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| EFF-EB-01 | Nutrition and hydration screening (e.g. MUST) is completed and reviewed regularly, with dietitian input where indicated | "People's nutritional and hydration needs are met in line with current standards and good practice guidance." / "People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions." | ✏️ Revise — "MUST" is not named by CQC; "screening" is operational; CQC focuses on needs being met in line with standards | People's nutritional and hydration needs are met in line with current standards and good practice guidance; dietary risks including poor nutrition, dehydration and swallowing problems are identified and managed. |
| EFF-EB-02 | Weight and clinical markers (e.g. wound healing, pressure ulcer grading) are monitored and escalated appropriately | "Staff monitor and evaluate outcomes related to people's health and quality of life... and act to improve them when possible." | ✏️ Revise — "weight and clinical markers, wound healing, pressure ulcer grading" is operational; CQC uses "outcomes related to people's health and quality of life" | Staff monitor and evaluate outcomes related to people's health, including clinical markers, and act to improve them where possible. |
| EFF-EB-03 *(corrected)* | A clinical audit programme is in place covering key clinical areas (e.g. pressure ulcers, falls, medicines, care planning), with results reviewed and acted on | "There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it." | ✏️ Revise — better than the original but "audit programme covering key clinical areas" still paraphrases; CQC's exact phrase should lead | There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment; the service takes action to continuously improve it, evidenced by a clinical audit programme with documented improvements. |
| EFF-EB-04 | Clinical outcomes (e.g. pressure ulcer incidence, falls rate) are monitored and reviewed over time | "Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible." | ✏️ Revise — "pressure ulcer incidence, falls rate" are operational; CQC uses "outcomes related to people's health and quality of life"; note this overlaps with EFF-EB-02 — consider merging or sharper distinction | Staff monitor and evaluate outcomes related to people's health and quality of life over time, using outcome data to act and improve care where possible. |

---

### EFF-HL — Supporting People to Live Healthier Lives

**KLOE:** Are people encouraged and supported to manage their own health and wellbeing?

**CQC Good characteristics (verbatim extracts):**
- "People are supported to manage their health, care and wellbeing needs by staff who understand their needs and preferences. They are empowered to set goals and achieve what is important to them to stay as healthy and as independent as possible."
- "Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised."
- "People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene."
- "The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports."
- "The service progresses any relevant advice or recommendations made by other professionals or commissioners to prevent deterioration in health and well-being and avoidable hospital admissions."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| EFF-HL-01 | Residents are supported to access GP, dentist, optician, podiatry and specialist clinical appointments | "The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports." | ✏️ Revise — lists named professionals not in CQC text; CQC language is about enabling access to health and social care support and health checks | The service works with residents and professionals to plan and enable access to health and social care support; residents are supported to access health checks and healthcare passports are completed where appropriate. |
| EFF-HL-02 | Health action plans are in place for residents with long-term conditions, reviewed by nursing staff | "Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised." / "The service progresses any relevant advice or recommendations made by other professionals or commissioners to prevent deterioration in health and well-being and avoidable hospital admissions." | ✏️ Revise — "health action plans for long-term conditions" is not CQC language; CQC focuses on identifying risks and preventing deterioration | Risks to residents' health and wellbeing are identified and support to prevent deterioration is prioritised, including progressing advice from other professionals to prevent avoidable hospital admissions. |
| EFF-HL-03 | Activity and rehabilitation programme supports healthier outcomes where clinically appropriate | "People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene." | ✏️ Revise — "activity and rehabilitation programme" is operational; CQC focuses on encouraging healthier choices | Residents are encouraged and supported to make healthier choices relating to diet, lifestyle and physical activity, including through activity and rehabilitation opportunities where clinically appropriate. |

---

### EFF-CT — Consent to Care and Treatment

**KLOE:** Are people supported to understand and exercise their right to consent to care, support and treatment?

**CQC Good characteristics (verbatim extracts):**
- "Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision."
- "There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively."
- "Staff actively consider whether people have the mental capacity to give consent. If there is a reason to doubt the person has capacity, assessments are completed in line with legal requirements and recorded."
- "The service makes lawful decisions in people's best interests when required. People are involved and their feelings, beliefs and values are considered."
- "People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| EFF-CT-01 | Consent is obtained and recorded before clinical care and treatment is provided | "Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment." | ✏️ Revise — "obtained and recorded" is operational; CQC says staff ensure people understand what they are consenting to and are given information, support and time | Staff know the importance of consent and ensure people understand what they are consenting to before care or treatment is delivered, with appropriate information and time given to support informed decisions. |
| EFF-CT-02 *(evidence notes corrected)* | Mental Capacity Act assessments are completed where capacity is in doubt, including for clinical decisions | "Staff actively consider whether people have the mental capacity to give consent. If there is a reason to doubt the person has capacity, assessments are completed in line with legal requirements and recorded." / "Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person." | ✏️ Revise — "where capacity is in doubt" paraphrases CQC's "if there is a reason to doubt"; "including for clinical decisions" is not CQC language; DoLS should appear in item text, not only in evidence notes | Staff actively consider whether people have the mental capacity to give consent; where there is reason to doubt capacity, assessments are completed in line with the Mental Capacity Act 2005, recorded, and DoLS applied where appropriate. |
| EFF-CT-03 | Advocacy access is offered and recorded where needed | "People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service." | ✏️ Revise — "access is offered and recorded" paraphrases; CQC says people are "supported to access" and advocates "appropriately involved" | People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service. |

---

## Key question: CARING

### CAR-KD — Kindness, Compassion and Dignity

**KLOE:** Are people treated with kindness, empathy, compassion and respect, and is their privacy and dignity maintained?

**CQC Good characteristics (verbatim extracts):**
- "There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect."
- "Staff communicate clearly, in a kind and respectful way. They actively listen to people to understand and respond to their individual needs and preferences."
- "Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way. This protects their rights and dignity and staff learn to understand the causes of people's distress to avoid it happening again in the future."
- "People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these."
- "Staff prioritise and anticipate people's comfort and wellbeing needs."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| CAR-KD-01 | Dignity audits are completed, including during clinical procedures, and used to improve practice | "People feel cared for with kindness, compassion, dignity and respect." / "People's privacy, confidentiality, and respect are consistently upheld." | ✏️ Revise — "dignity audits" is not CQC language; CQC focuses on consistent culture of dignity and respect being upheld | People feel cared for with kindness, compassion, dignity and respect; privacy and dignity are consistently upheld during all clinical procedures and personal care, and any shortfalls are challenged. |
| CAR-KD-02 | Confidentiality of clinical and personal information is maintained and understood by staff | "People's privacy, confidentiality, and respect are consistently upheld. Staff have a clear understanding of the boundaries of confidentiality and work within these." | ✏️ Revise — "clinical and personal information" is a narrower framing than CQC's privacy and confidentiality; "maintained and understood" vs CQC "clear understanding of the boundaries" | People's privacy and confidentiality are consistently upheld; staff have a clear understanding of the boundaries of confidentiality and work within these. |
| CAR-KD-03 | Staff respond promptly and kindly to residents expressing distress, pain or discomfort | "Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way. This protects their rights and dignity and staff learn to understand the causes of people's distress to avoid it happening again in the future." | ✏️ Revise — "kindly" and "pain" are not CQC language; misses "in a positive way," "emotions," "urgent needs," and learning about causes of distress | Staff promptly respond to people's emotions, discomfort, distress and urgent needs in a positive way that protects their rights and dignity; staff learn the causes of distress to prevent recurrence. |

---

### CAR-PC — Person-Centred Care

**KLOE:** Do people receive personalised care, which ensures they are at the centre of their care, support and treatment choices?

**CQC Good characteristics (verbatim extracts):**
- "People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused."
- "People receive the most appropriate and personalised care, support and treatment as the service makes reasonable adjustments where necessary."
- "Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met."
- "People and those close to them (including representatives, advocates and where appropriate dependents) are regularly involved in planning, making and updating shared decisions about their care, support and treatment."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| CAR-PC-01 | Nursing care plans are individualised, not generic, and reflect resident preferences alongside clinical needs | "People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused." | ✏️ Revise — "not generic" paraphrases "not task-focused"; "resident preferences alongside clinical needs" is not CQC language; CQC says care is centred on people and tailored | Care is tailored to the individual and is not task-focused; nursing care plans are person-centred and regularly updated with the involvement of residents and those close to them. |
| CAR-PC-02 | Cultural, religious and spiritual needs are identified and met | "Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met." | ✏️ Revise — omits "personal," "social," "understood," and "protected equality characteristics" from CQC's exact wording | Staff treat people as individuals, ensuring their personal, cultural, social, spiritual and religious needs are understood and met, with due regard for protected equality characteristics. |

---

### CAR-IC — Independence, Choice and Control

**KLOE:** Are people supported and empowered to maintain their independence, relationships, and choice over their care and plans for the future?

**CQC Good characteristics (verbatim extracts):**
- "People have choice and control over their own care and are empowered to make decisions about their care, support, treatment and wellbeing."
- "People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation."
- "If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices."
- "People are supported to make decisions about end of life preferences and advance decisions if they wish to. People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided."
- "If people do not wish to discuss the end of their life, steps are taken to establish what to do in an emergency medical situation."
- "There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| CAR-IC-01 | Meaningful activities programme is in place, adapted for residents with clinical or mobility limitations | "If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices." | ✏️ Revise — "activities programme is in place" is operational; CQC focuses on residents being encouraged and enabled to access activities in a personalised way | Residents are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way, with genuine choices offered and adaptations made for clinical or mobility needs. |
| CAR-IC-02 | Visiting policy supports open access for family and friends | "People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation." | ✏️ Revise — "visiting policy supports open access" omits the CQC's specific phrase about visiting restrictions being limited to exceptional circumstances | People are supported to maintain access to family, friends and cultural connections; when applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation. |
| CAR-IC-03 | DNACPR and ReSPECT forms are in place where appropriate, reviewed and accessible to clinical staff | "People are supported to make decisions about end of life preferences and advance decisions if they wish to." | ✏️ Revise — "forms are in place, reviewed and accessible" is operational; CQC focuses on people being supported to make decisions | People are supported to make decisions about end of life preferences and advance decisions if they wish to; DNACPR and ReSPECT decisions are clearly recorded and accessible to clinical staff. |
| CAR-IC-04 | End of life and palliative nursing care plans are in place, reflecting resident wishes and clinical needs | "People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided." / "There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies." | ✏️ Revise — "care plans are in place" is operational; CQC focuses on identifying people approaching end of life and meeting needs in line with preferences | People approaching the end of their life are identified and their needs are met in line with their preferences and choices; there is a compassionate and supportive approach before and after a person dies. |
| CAR-IC-05 | Advance care planning discussions, including clinical treatment preferences, are offered and documented | "People are supported to make decisions about end of life preferences and advance decisions if they wish to." / "If people do not wish to discuss the end of their life, steps are taken to establish what to do in an emergency medical situation." | ✏️ Revise — "including clinical treatment preferences, are offered and documented" is operational; CQC focuses on supporting people to make decisions and taking steps even when they do not wish to discuss it | People are supported to plan for the future and make advance decisions if they wish to; where people do not wish to discuss end of life, steps are taken to establish what to do in an emergency. |

---

## Key question: RESPONSIVE

### RES-CC — Care Provision, Integration and Continuity

**KLOE:** Is care co-ordinated and delivered in a flexible, joined-up way that reflects diverse needs and promotes choice and continuity?

**CQC Good characteristics (verbatim extracts):**
- "The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care."
- "The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care."
- "Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs."
- "Staff can identify and take appropriate action when there is a gap in care provision."
- "People receive the care, support and treatment they are entitled to from the service."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| RES-CC-01 | Multi-disciplinary team input (GP, tissue viability, dietitian, physiotherapy) is sought and recorded for residents with complex clinical needs | "Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs." | ✏️ Revise — lists specific MDT professionals not in CQC text; CQC language is about planned, coordinated working with other services | Where support is provided by more than one service, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets residents' needs. |
| RES-CC-02 | Key worker / named nurse system is in place so residents have a consistent clinical point of contact | "People experience continuity of care, support and treatment." | ✏️ Revise — "key worker/named nurse system" is an operational approach not in CQC language; CQC's phrase is about people experiencing continuity | People experience continuity of care, support and treatment; a key worker or named nurse system ensures residents have a consistent point of contact throughout their stay. |
| RES-CC-03 | Transitions between levels of care within the home (e.g. residential to nursing bed) are planned with the resident and family | "The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment." | ✏️ Revise — internal transitions within a home are not specifically addressed in CQC Good characteristics; the item is operationally specific; CQC's language on continuity is the closest match | Internal transitions in care level are planned collaboratively with residents and those close to them; people experience continuity of care and a smooth process throughout. |

---

### RES-LF — Listening to and Responding to Feedback

**KLOE:** Are people supported to give feedback and raise concerns, and are they confident that action will be taken as a result?

**CQC Good characteristics (verbatim extracts):**
- "People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs."
- "The service supports people to give their feedback, share ideas or make a complaint. This includes supporting access to independent advocacy."
- "People feel confident that their views or concerns will be taken seriously and they will be treated compassionately, without negative repercussions."
- "The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice."
- "The service keeps people informed about how their feedback has been addressed and any action taken including a full explanation when it has not been acted on. It does this in line with established processes, and people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| RES-LF-01 | Complaints policy is in place, accessible, and complaints are responded to within set timescales | "People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs." | ✏️ Revise — "policy is in place, accessible, responded to within timescales" is operational; CQC focuses on people understanding how to give feedback and being supported to do so in a way that meets their needs | People and those close to them understand how to give feedback, make suggestions or complain about care and treatment; they can do so in a way that meets their needs, including with access to independent advocacy. |
| RES-LF-02 | Resident and relative meetings are held regularly and feedback is acted on | "The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice." | ✏️ Revise — "meetings held regularly" is operational; CQC language is about welcoming feedback as an opportunity and incorporating learning into practice | The service welcomes feedback, concerns and complaints as an opportunity to improve; learning from feedback is incorporated into practice and people feel confident their concerns will be taken seriously. |
| RES-LF-03 | Resident or relative satisfaction survey is conducted at least annually with results published | "The service keeps people informed about how their feedback has been addressed and any action taken." / "The service involves and works collaboratively with each person to develop solutions to the concerns they raise." | ✏️ Revise — "annual survey with results published" is operational; CQC does not specify surveys as a requirement; CQC focuses on actively seeking feedback and keeping people informed of how it has been addressed | The service actively seeks feedback and keeps people informed about how it has been addressed and any action taken; people are given information on how to escalate complaints to the relevant Ombudsman. |

---

### RES-TA — Timely and Equitable Access

**KLOE:** Does the service ensure that everyone can access equitable and timely care, support and treatment?

**CQC Good characteristics (verbatim extracts):**
- "People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights."
- "Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services."
- "The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed."
- "Leaders and staff are alert to discrimination and inequality that disadvantage different groups of people in accessing their service."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| RES-TA-01 | Admission process, including clinical pre-assessment, is clear, timely and non-discriminatory | "The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed." | ✏️ Revise — "clear, timely and non-discriminatory" is operational; CQC language focuses on being accessible at the point of need and removing barriers | The service is designed to be accessible and available at the point of need; barriers that prevent equitable access to the admission process are identified and removed. |
| RES-TA-02 | Premises are accessible, including step-free access and adapted clinical/bathing facilities | "Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services." | ✏️ Revise — "step-free access and adapted bathing facilities" is operational; CQC language is about reasonable adjustments being understood and made | Reasonable adjustments are understood and made to ensure equal access to the service for all; premises are accessible and adapted to meet the needs of people who find it hard to access services. |
| RES-TA-03 | Information is available in accessible formats for residents with sensory or communication needs | "The service appropriately identifies people's individual communication needs to make sure up-to-date information is routinely provided in an accessible way." (from EFF-EE Good) | ✏️ Revise — "available in accessible formats" paraphrases CQC's "up-to-date information is routinely provided in an accessible way"; omits the identification step | People's individual communication and information needs are appropriately identified and up-to-date information is routinely provided in an accessible way. |

---

### RES-EE — Equity in Experiences

**KLOE:** Does the service tailor people's care, support and treatment effectively, to ensure equity in experiences?

**CQC Good characteristics (verbatim extracts):**
- "Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this."
- "The service complies with legal, equality and human rights requirements, including avoiding discrimination, considering the needs of people with different protected equality characteristics and making reasonable adjustments to support equity in experience and outcomes."
- "Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language."
- "The service identifies and meets the information and communication needs of people with a disability, impairment or sensory loss. These needs are recorded, flagged, shared and reviewed appropriately. Where applicable, the requirements of the Accessible Information Standard are met."
- "Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| RES-EE-01 | Equality monitoring data is collected and used to identify and address gaps in experience | "Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this." | ✏️ Revise — "monitoring data collected to identify gaps" paraphrases; CQC language includes recognising barriers, collecting evidence including people's experiences, and allocating resources | Leaders and staff work collaboratively to achieve equity by recognising barriers, collecting and acting on evidence including people's experiences, and allocating resources to reduce barriers. |
| RES-EE-02 | Interpreting and translation services are available for residents and families who need them | "Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language." | ✏️ Revise — "available for residents and families who need them" paraphrases; CQC names specific populations (non-English speakers and BSL users) | Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language. |
| RES-EE-03 | Staff receive training on equality, diversity and the Accessible Information Standard | "Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support." / "Where applicable, the requirements of the Accessible Information Standard are met." | ✏️ Revise — "receive training on equality, diversity and AIS" is operational and more limited than CQC's language about removing barriers to effective communication | Staff are supported to develop the skills they need to remove barriers to effective communication; where applicable, the requirements of the Accessible Information Standard are met. |

---

## Key question: WELL-LED

### WEL-SD — Strategic Direction

**KLOE:** Is there a clear vision and strategy to support the current and future needs of people and promote a positive culture?

**CQC Good characteristics (verbatim extracts):**
- "The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality."
- "Leaders promote a shared vision and strategy that staff and people understand and support."
- "The vision, values, and strategy have been developed through structured planning and co-production with people who use the service, staff and partners."
- "Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements."
- "The strategy supports the stability and operational sustainability of the service."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-SD-01 | Service has a clear, documented vision and values, understood by nursing and care staff | "The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service." | ✏️ Revise — "documented vision and values, understood by nursing and care staff" paraphrases; CQC says "clear, understood and supported by staff" and "demonstrated through behaviour of leaders and in practices" | The values of the service are clear, understood and supported by staff, demonstrated through the behaviour of leaders and in day-to-day practices within the service. |
| WEL-SD-02 | Staff feedback (e.g. surveys) is collected and used to shape strategic priorities | "Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements." | ✏️ Revise — "surveys collected to shape strategic priorities" is operational; CQC language includes learning from staff, building trust and using feedback to track progress | Leaders learn from staff who work directly with people; feedback is valued and used to track progress, shape priorities and drive improvements. |
| WEL-SD-03 | Registered manager and clinical lead succession / sustainability plan is in place | "The strategy supports the stability and operational sustainability of the service." / "High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning." (from WEL-CL Good) | ✏️ Revise — "succession/sustainability plan" paraphrases; CQC language ties sustainability to strategy | The strategy supports the stability and operational sustainability of the service; succession planning ensures high-quality leadership is sustained. |

---

### WEL-WE — Workforce Equity and Culture

**KLOE:** Is there an inclusive and compassionate culture that values diversity, supports staff wellbeing and speaking up, and tackles workforce inequalities?

**CQC Good characteristics (verbatim extracts):**
- "The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion."
- "Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so."
- "Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work. This has a positive impact on the care they deliver to people."
- "The service identifies workforce inequalities against relevant equality, diversity and inclusion objectives. Interventions to address these are monitored to evaluate their impact."
- "Experiences of staff are listened to with compassion and effective action is taken to ensure continuous improvement and maximise staff equity, inclusion and wellbeing."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-WE-01 | Equality, diversity and inclusion policy is in place and applied to recruitment, training and promotion | "The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion." | ✏️ Revise — "policy is in place and applied to recruitment, training and promotion" is operational; CQC language focuses on commitment and proactive promotion | The service is committed to workforce equality and proactively works to promote equality, diversity and inclusion, applied to recruitment, development and progression. |
| WEL-WE-02 | Speak-up / whistleblowing arrangements are in place and staff are confident to use them | "Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so." | ✏️ Revise — "arrangements are in place and staff are confident" truncates CQC's fuller language about active encouragement and no negative repercussions | Staff are actively encouraged to raise concerns through formal speaking up processes and are confident they will be treated with compassion and will not be blamed or treated negatively for doing so. |
| WEL-WE-03 | Staff wellbeing support is available, including for nursing staff managing clinical and emotional demands | "Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work." | ✏️ Revise — "support is available for nursing staff managing clinical and emotional demands" is narrower than CQC's language; CQC specifies reasonable adjustments, flexible working, adequate rest | Staff wellbeing is promoted through personalised support, including reasonable adjustments, flexible working and ensuring adequate rest; there is support when staff are struggling at work. |

---

### WEL-CL — Capable and Compassionate Leaders

**KLOE:** Do leaders at all levels have the capability and experience to lead effectively and deliver high-quality care, with accountability, integrity and empathy?

**CQC Good characteristics (verbatim extracts):**
- "Leaders have the experience, capacity, capability and integrity to ensure that the service's vision is delivered."
- "Leaders are visible and available. They lead by example, demonstrating integrity, modelling inclusive behaviours, and open and co-operative relationships."
- "Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role."
- "High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning."
- "Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care."
- "When something goes wrong, people receive a sincere and timely apology and are told about any actions being taken to prevent the same thing happening again."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-CL-01 | Registered manager is in post, with clinical lead / senior nurse support structure | "Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care." | ✏️ Revise — "clinical lead/senior nurse support structure" is not CQC language; CQC specifies the registered manager understanding responsibilities and being supported by directors/managers | Where required, there is a registered manager in post who understands their responsibilities and is supported by directors and other managers to deliver good, effective, high-quality care. |
| WEL-CL-02 | Fit and Proper Person Requirement checks are completed for the registered manager and directors | "High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning." (FPPR is named in scope of KLOE) | ✏️ Revise — FPPR is correctly named (CQC uses this exact term in scope), but the item doesn't connect it to CQC's language about safe and effective leadership recruitment | High-quality leadership is sustained through safe and effective recruitment; Fit and Proper Person Requirement checks are completed for the registered manager and all directors. |
| WEL-CL-03 | Leadership development and support is available to managers and senior nurses | "Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required." | ✏️ Revise — "leadership development and support is available" is passive and operational; CQC says leaders are knowledgeable and have access to appropriate development | Leaders are knowledgeable about priorities that affect quality and have access to appropriate development in their role; they seek support or independent scrutiny where required. |

---

### WEL-GM — Governance and Management

**KLOE:** Are there clear roles, responsibilities and systems of accountability to support good governance and manage risks, performance and issues?

**CQC Good characteristics (verbatim extracts):**
- "There are clear and effective governance, management and accountability arrangements. Staff understand their roles and responsibilities. Managers can account for the actions, behaviours and performance of staff."
- "Data or notifications are consistently submitted to external partners as required."
- "There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care."
- "The service has an accurate statement of purpose that clearly reflects current service provision."
- "There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service."
- "There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-GM-01 | Statement of purpose is current and accurately reflects nursing provision | "The service has an accurate statement of purpose that clearly reflects current service provision." | ✏️ Revise — "is current and accurately reflects nursing provision" paraphrases; CQC says "accurate... that clearly reflects current service provision" | The service has an accurate statement of purpose that clearly reflects current service provision, including the nursing care it provides. |
| WEL-GM-02 | Quality assurance audit schedule covers care plans, medicines, clinical procedures, environment and infection control | "There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service." | ✏️ Revise — listing specific audit areas is operational; CQC language is about effective systems for monitoring performance, risk and learning | There are effective systems for monitoring and managing service performance, risk and learning from incidents, including a quality assurance audit programme across all key care areas. |
| WEL-GM-03 | Data Security and Protection Toolkit (DSPT) is submitted and cyber security arrangements are reviewed | "There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems." (DSPT and cyber security listed in scope) | ✏️ Revise — "DSPT submitted and cyber security reviewed" is operational; CQC language is about secure and reliable arrangements for data; DSPT is appropriate to name as it is in the KLOE scope | There are secure and reliable arrangements for the availability, integrity and confidentiality of data and records; the Data Security and Protection Toolkit is submitted and cyber security arrangements are reviewed. |
| WEL-GM-04 | Business continuity plan is in place for emergencies, including clinical continuity (e.g. medicines supply, nurse staffing) | "There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice." | ✏️ Revise — "plan is in place for emergencies" misses "thorough" and "staff know how to put these into practice"; "clinical continuity" is an appropriate nursing home addition | There are thorough business continuity plans in place for emergencies, and staff know how to put these into practice, including continuity of medicines supply and nurse staffing. |
| WEL-GM-05 | Notifications and statutory data are submitted to CQC and other bodies as required | "Data or notifications are consistently submitted to external partners as required." | ✏️ Revise — "statutory data" and "CQC and other bodies" are not CQC's exact words; CQC says "data or notifications" and "external partners" | Data and notifications are consistently submitted to external partners as required; regulatory requirements are understood and consistently met. |

---

### WEL-PC — Partnerships and Communities

**KLOE:** Is the service working effectively and collaboratively with people who use the service and partners to support care provision and service development?

**CQC Good characteristics (verbatim extracts):**
- "Staff and leaders are open and transparent, and they work collaboratively with all relevant external stakeholders and agencies."
- "Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people."
- "The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service. They understand that they cannot solve everything on their own and reach out to others, using these networks to identify new or innovative ideas that can lead to better outcomes for people."
- "The service maintains positive relationships with the local community and works well with community partners."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-PC-01 | Service engages with the local community | "The service maintains positive relationships with the local community and works well with community partners." | ✏️ Revise — "engages with the local community" is too brief and vague; CQC's exact phrase should be used | The service maintains positive relationships with the local community and works well with community partners. |
| WEL-PC-02 | Partnership working with local health and clinical services (community nursing, hospital, palliative care teams) is evidenced | "Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people." | ✏️ Revise — "local health and clinical services" lists specific organisations not in CQC text; CQC language is about working in partnership so services work seamlessly | Staff and leaders work in partnership with other organisations, including local health services, so that care works as seamlessly as possible for people. |
| WEL-PC-03 | Good practice and clinical learning are shared with other providers or sector networks | "The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service." | ✏️ Revise — "good practice and clinical learning shared with providers/networks" paraphrases; CQC emphasises the result (continuous improvements) and breadth of engagement | Staff and leaders engage with people, communities and partners to share learning with each other, which results in continuous improvements to the service. |

---

### WEL-IL — Improvement, Innovation and Learning

**KLOE:** Does the service enable and embed continuous improvement, innovation and learning, using evidence and lived experience?

**CQC Good characteristics (verbatim extracts):**
- "Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact."
- "Staff are supported to prioritise time to develop their skills around improvement and innovation. There is a clear strategy for how to develop these capabilities."
- "Staff are consistently encouraged to contribute to improvement and innovation initiatives."
- "Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage."
- "Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service."
- "Learning is a continuous part of improvement and innovation, including good and poor outcomes for people and the impact. Learning is used to inform future processes."
- "Leaders encourage collective problem-solving and innovation to achieve consistency in the quality of care."

| Ref | Current text | CQC source wording | Assessment | Revised text |
|-----|-------------|-------------------|------------|--------------|
| WEL-IL-01 | Service has identified at least one active clinical quality improvement project with measurable outcomes | "Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact." | ✏️ Revise — "at least one active QI project" is operational and sets a floor not in CQC text; CQC focuses on consistent approaches that measure outcomes and impact | Staff and leaders drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact; quality improvement projects demonstrate measurable results. |
| WEL-IL-02 | Staff are supported and encouraged to contribute ideas for improvement | "Staff are consistently encouraged to contribute to improvement and innovation initiatives." / "Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation." | ✏️ Revise — "supported and encouraged" diverges slightly from CQC's "consistently encouraged"; also misses "innovation initiatives"; close but not exact | Staff are consistently encouraged to contribute to improvement and innovation initiatives; leaders foster a culture of trust by actively investing time to listen to ideas for improvement. |
| WEL-IL-03 *(evidence notes corrected)* | Service engages with clinical research, pilots or sector innovation where relevant | "Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service." | ✏️ Revise — "clinical research, pilots or sector innovation where relevant" paraphrases; CQC says "engage with external work, including research, and embed evidence-based good practice" | Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service. |

---

## GAPS — Topics CQC Covers with No Corresponding Checklist Item

The following CQC Good-level characteristics and KLOE scope topics have no dedicated Nursing Home checklist item. Suggested new items use CQC's exact language.

### SAF-SC — Safety Culture

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Closed cultures | "Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse. There are systems and processes in place to identify concerns and prevent closed cultures from developing, and appropriate action is taken when needed." | Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse; systems are in place to identify concerns and prevent closed cultures from developing. |

### SAF-MR — Managing Risks

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Positive risk-taking | "There is a balanced and proportionate approach to risk. People's rights and choices about their care and their lives are respected. People are supported to take carefully managed risks to live fulfilling lives." | There is a balanced and proportionate approach to risk; people's rights and choices are respected and people are supported to take carefully managed risks to live fulfilling lives. |
| Restrictive practices | "The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity." / "Restraint is only ever used as a last resort and there is a clear commitment from all staff to minimising the use of restrictive interventions in the service." | The service has a process to ensure restrictions on people's freedom, choice and control are necessary, proportionate and safe; restraint is only used as a last resort with a clear commitment to minimising restrictive interventions. |
| Deterioration recognition | "Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm." (No NEWS2 mentioned by CQC but implied by good practice in the scope) | Clinical deterioration is anticipated and managed using validated assessment tools, with a clear escalation process to reduce the potential for harm. |

### SAF-SG — Safeguarding

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Deprivation of Liberty | "People are deprived of their liberty lawfully. Any potential deprivation of liberty is recognised promptly and appropriate authorisation is sought. Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person. The service regularly reviews care arrangements and makes adjustments to ensure any DoLS conditions are met." | People are deprived of their liberty lawfully; any potential deprivation of liberty is recognised promptly and appropriate DoLS authorisation is sought; conditions are regularly reviewed and met. |
| Sexual safety | "People are empowered to develop and maintain safe intimate relationships, where they choose to, in accordance with their rights." | People are empowered to develop and maintain safe intimate relationships, where they choose to, in accordance with their rights; staff are trained to support this appropriately. |
| Online safety | "Online safety is considered and people are supported to understand how they can protect themselves when online." | Online safety is considered and people are supported to understand how they can protect themselves when using the internet or digital devices. |

### SAF-EI — Safe Environments

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Equipment alerts and recalls | "The service monitors and acts on equipment alerts, recalls and safety information." | The service monitors and acts on equipment alerts, recalls and safety information in a timely way. |
| Digital/technology assurance | (In KLOE scope: "Digital systems and technology assurance") CQC Good: "secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems." | Digital systems and technology used to deliver care are secure, reliable and appropriate to individual people's needs; data records are available, accurate and confidential. |

### SAF-SS — Safe Staffing

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Staff fatigue | "Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services." | Actions are taken to protect staff from fatigue and leaders understand its impact on the safety of people who use services; working patterns are monitored. |
| Allegations against people in positions of trust | "The service has systems for investigating any allegations against people in positions of trust that it employs, and actions are taken to address any risk to people." | The service has systems for investigating allegations against people in positions of trust; actions are taken to address any risk to people using the service. |

### SAF-MT — Safe Medicines

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| STOMP/STAMP | "The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable." | The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable. |
| PRN medicines protocols | "The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews." | The administration of PRN medicines (medicines taken when required) is guided by clear protocols; protocols are reviewed in a timely way. |
| Self-medication | "People and their representatives are involved in assessments, reviews and decisions, including the level of support needed and self-medication. This is clearly documented in care records." | People's capacity and preference for self-medication is assessed and clearly documented in care records; involvement in decisions about medicines is supported. |
| Covert administration | "People receiving their medicines covertly are supported in line with the Mental Capacity Act 2005. Staff fully understand any risk associated with mixing medicines with different foods." | Where covert administration of medicines is used, this is supported in line with the Mental Capacity Act 2005 and clearly documented with a best interests decision. |

### EFF-AN — Assessing Needs

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Trauma-informed approach | "Assessments focus on people's strengths, and there is a trauma-informed approach to understanding people's needs." | Assessments focus on people's strengths and there is a trauma-informed approach to understanding people's needs. |

### EFF-EB — Evidence-Based Care

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Equitable outcomes | "The service empowers people to understand their legal rights to equity of care and outcomes. Staff recognise barriers that prevent equity. Information is collected and acted on, and resources are allocated, to reduce these barriers and improve people's outcomes." | The service empowers people to understand their legal rights to equity of care; staff recognise barriers that prevent equity and resources are allocated to reduce these barriers and improve outcomes. |

### EFF-HL — Supporting Healthier Lives

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Avoidable hospital admissions | "The service progresses any relevant advice or recommendations made by other professionals or commissioners to prevent deterioration in health and well-being and avoidable hospital admissions." | The service progresses advice and recommendations from other professionals or commissioners to prevent deterioration in health and wellbeing and avoidable hospital admissions. |

### EFF-CT — Consent

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Best interests decisions | "The service makes lawful decisions in people's best interests when required. People are involved and their feelings, beliefs and values are considered. Those close to the person and their advocates are involved and kept informed of any changes as appropriate." | The service makes lawful decisions in people's best interests when required; people are involved and their feelings, beliefs and values are considered, with those close to them kept informed. |

### CAR-KD — Kindness, Compassion and Dignity

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Anticipating comfort needs | "Staff prioritise and anticipate people's comfort and wellbeing needs. They use appropriate tools and communication to meet needs effectively and to avoid any preventable discomfort, concern or distress." | Staff prioritise and anticipate people's comfort and wellbeing needs, using appropriate tools and communication to avoid preventable discomfort, concern or distress. |

### CAR-PC — Person-Centred Care

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Reasonable adjustments for care delivery | "People receive the most appropriate and personalised care, support and treatment as the service makes reasonable adjustments where necessary." | People receive the most appropriate and personalised care as the service makes reasonable adjustments where necessary, including for communication, accessibility and cultural preferences. |

### CAR-IC — Independence, Choice and Control

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Intimate relationships | "People's right to privacy and a personal life is appropriately considered and respected, including supporting them to have close and intimate relationships." | People's right to a personal life is appropriately considered and respected, including supporting them to have close and intimate relationships where they choose. |
| Equipment and technology for independence | "Equipment and technology are used to support and maximise people's independence and experiences of their care and support. People are helped to make choices about adaptive equipment." | Equipment and technology are used to support and maximise people's independence; people are helped to make choices about adaptive equipment appropriate to their needs. |

### RES-LF — Listening to Feedback

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Ombudsman escalation pathway | "people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process." | At the end of the complaints process, people are given information on how to escalate their complaint to the relevant Ombudsman. |
| Advocacy for complaints | "The service supports people to give their feedback, share ideas or make a complaint. This includes supporting access to independent advocacy." | The service supports people to give their feedback or make a complaint, including supporting access to independent advocacy. |

### WEL-SD — Strategic Direction

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Co-production of vision and values | "The vision, values, and strategy have been developed through structured planning and co-production with people who use the service, staff and partners." | The vision, values and strategy have been developed through structured planning and co-production with people who use the service, staff and partners. |

### WEL-WE — Workforce Equity and Culture

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Workforce inequality monitoring | "The service identifies workforce inequalities against relevant equality, diversity and inclusion objectives. Interventions to address these are monitored to evaluate their impact." | The service identifies workforce inequalities against equality, diversity and inclusion objectives; interventions to address these are monitored to evaluate their impact. |
| Support for staff facing discrimination | "The service supports staff who face discrimination, whether from managers, colleagues, people using the service or those close to them. Action is taken against people who discriminate against staff, supported by policies and processes." | The service supports staff who face discrimination and takes action against those who discriminate, supported by clear policies and processes. |

### WEL-CL — Capable and Compassionate Leaders

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Sincere and timely apology | "When something goes wrong, people receive a sincere and timely apology and are told about any actions being taken to prevent the same thing happening again." | When something goes wrong, people receive a sincere and timely apology and are told about the actions being taken to prevent the same thing happening again. |

### WEL-GM — Governance and Management

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Workforce planning | (In KLOE scope: "Workforce planning") CQC Good: "There are clear and effective governance, management and accountability arrangements." | There are effective workforce planning arrangements to ensure appropriate staffing levels, skill mix and succession; risks to staffing capacity are identified and managed. |
| Records management / GDPR | (In KLOE scope: "Data security, data protection and General Data Protection Regulation (GDPR)") CQC Good: "There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems." | Records and data management systems meet data protection and GDPR requirements; records are complete, accurate, stored securely and staff understand their data protection responsibilities. |

### WEL-PC — Partnerships and Communities

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Co-production in service design | "People who use services and communities are meaningfully involved as equal partners in the design, delivery, and evaluation of services." (Outstanding) / Good: "Staff and leaders work in partnership with people and other organisations." | People who use the service are meaningfully involved in how it is designed, delivered and evaluated, including through co-production with residents and families. |

### WEL-IL — Improvement, Innovation and Learning

| Gap | CQC source | Suggested new item |
|-----|-----------|-------------------|
| Collective problem-solving | "Leaders encourage collective problem-solving and innovation to achieve consistency in the quality of care." | Leaders encourage collective problem-solving and innovation; staff at all levels are involved in identifying and addressing problems to achieve consistency in the quality of care. |

---

## Summary Statistics

| Key Question | Items reviewed | ✅ Exact match | ✏️ Revise | Major gaps identified |
|-------------|---------------|--------------|----------|----------------------|
| Safe (SAF) | 29 | 0 | 29 | 9 |
| Effective (EFF) | 13 | 0 | 13 | 6 |
| Caring (CAR) | 10 | 0 | 10 | 3 |
| Responsive (RES) | 12 | 0 | 12 | 4 |
| Well-Led (WEL) | 20 | 0 | 20 | 7 |
| **Total** | **84** | **0** | **84** | **29** |

**Key findings:**

1. **Zero items use CQC's exact Good-level wording.** Every item paraphrases to some degree. The most common pattern is adding operational specificity (monthly, named tools, specific staff grades) that has no basis in the CQC framework.

2. **Highest-risk divergences** are in SAF-SC, EFF-AN and CAR-KD, where CQC's Good characteristics use holistic, culture-focused language that the checklist has translated into operational tasks.

3. **The 2026-07-19 corrections** were improvements but still did not adopt CQC's exact language. EFF-EB-03 especially needs further revision to lead with CQC's phrase "rigorous approach to monitoring the effectiveness of people's care."

4. **29 gaps** have been identified. The most significant for nursing homes are: closed cultures (SAF-SC), restrictive practices (SAF-MR), DoLS (SAF-SG), STOMP/STAMP (SAF-MT), PRN protocols (SAF-MT), trauma-informed assessments (EFF-AN), best interests decisions (EFF-CT), and intimate relationships (CAR-IC).

5. **EFF-EB-02 and EFF-EB-04 overlap** significantly in the CQC framework — both map to the same Good characteristic. Consider merging into one item or providing a clearer distinction (e.g. EFF-EB-02 = individual outcome monitoring; EFF-EB-04 = service-level outcome trends).

