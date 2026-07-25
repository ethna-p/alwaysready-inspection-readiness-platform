/**
 * CQC Evidence Categories — KLOE mapping
 *
 * The CQC Single Assessment Framework defines six evidence categories against
 * which each Quality Statement (and, under the KLOE framework, each KLOE) is
 * assessed. Source: CQC Review of the Single Assessment Framework, Oct 2024.
 * https://www.cqc.org.uk/publications/review-cqcs-single-assessment-framework-and-its-implementation/6-single-assessment-framework
 *
 * Each KLOE is assigned to its PRIMARY evidence category. The mapping is
 * hardcoded here because it is derived from CQC guidance, not user data.
 * KLOE title strings must match exactly what is stored in the klo_items table.
 */

export type EvidenceCategoryId =
  | 'peoples-experience'
  | 'staff-feedback'
  | 'partner-feedback'
  | 'observation'
  | 'processes'
  | 'outcomes'

export type EvidenceCategory = {
  id: EvidenceCategoryId
  label: string
  description: string
}

export const EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  {
    id: 'peoples-experience',
    label: "People's experience of health and care services",
    description:
      'Evidence of how people experience care at your service — their views, feedback, and the quality of interactions they have with staff.',
  },
  {
    id: 'staff-feedback',
    label: 'Feedback from staff and leaders',
    description:
      'Evidence from the people who work in your service — their views on culture, wellbeing, and how the service is led and managed.',
  },
  {
    id: 'partner-feedback',
    label: 'Feedback from partners',
    description:
      'Evidence from commissioners, other providers and external agencies about how your service works collaboratively to deliver joined-up care.',
  },
  {
    id: 'observation',
    label: 'Observation',
    description:
      'Evidence relating to what can be directly observed at your service — the physical environment, staff practice, and day-to-day care delivery.',
  },
  {
    id: 'processes',
    label: 'Processes',
    description:
      'Evidence of the policies, procedures, systems and governance arrangements that underpin safe and effective care at your service.',
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    description:
      "Evidence of the results your service achieves for people — their health, wellbeing, quality of life, and the service's track record of continuous improvement.",
  },
]

/**
 * Maps KLOE title (exact DB value) → evidence category ID.
 * All 24 KLOEs are covered with no overlap.
 */
export const KLOE_CATEGORY_MAP: Record<string, EvidenceCategoryId> = {
  // ── People's experience ──────────────────────────────────────────────────
  'Kindness, compassion and dignity':           'peoples-experience',
  'Person-centred care':                        'peoples-experience',
  'Independence, choice and control':           'peoples-experience',
  'Listening to and responding to feedback':    'peoples-experience',
  'Timely and equitable access':                'peoples-experience',
  'Equity in experiences':                      'peoples-experience',

  // ── Feedback from staff and leaders ─────────────────────────────────────
  'Safe staffing':                              'staff-feedback',
  'Strategic direction':                        'staff-feedback',
  'Workforce equity and culture':               'staff-feedback',
  'Capable and compassionate leaders':          'staff-feedback',

  // ── Feedback from partners ───────────────────────────────────────────────
  'Safe systems, pathways and transitions':     'partner-feedback',
  'Care provision, integration and continuity': 'partner-feedback',
  'Partnerships and communities':               'partner-feedback',

  // ── Observation ──────────────────────────────────────────────────────────
  'Managing risks during care and treatment':              'observation',
  'Safe environments and infection prevention and control': 'observation',

  // ── Processes ────────────────────────────────────────────────────────────
  'Safety culture':              'processes',
  'Safeguarding':                'processes',
  'Safe medicines and treatments': 'processes',
  'Assessing needs':             'processes',
  'Consent to care and treatment': 'processes',
  'Governance and management':   'processes',

  // ── Outcomes ─────────────────────────────────────────────────────────────
  'Evidence-based care and equitable outcomes': 'outcomes',
  'Supporting people to live healthier lives':  'outcomes',
  'Improvement, innovation and learning':       'outcomes',
}
