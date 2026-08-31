/**
 * Shared types, constants, and pure helpers for the Report Builder.
 * No React imports — safe to use in server and client components alike.
 */

import type { SortColumnDef } from '../kloes/KloeTableHeader'

// ── Column definitions for the KLOE Summary sort header ──────────────────────

export const REPORT_KLOE_COLUMNS: SortColumnDef[] = [
  { key: 'kq',       label: 'Key Question', classes: '' },
  { key: 'title',    label: 'KLOE',         classes: '' },
  { key: 'status',   label: 'Status',       classes: '' },
  { key: 'rag',      label: 'RAG',          classes: '' },
  { key: 'date',     label: 'Next Review',  classes: '' },
  { key: 'priority', label: 'Priority',     classes: '' },
  { key: 'assigned', label: 'Assigned To',  classes: '' },
]

export const REPORT_KLOE_COLUMNS_PRE: SortColumnDef[] = [
  ...REPORT_KLOE_COLUMNS,
  { key: 'evidence', label: 'Evidence', classes: '' },
]

// ─── Data types ───────────────────────────────────────────────────────────────

export type KloeRow = {
  id: string
  klo_item_id: string
  title: string
  key_question_name: string
  status: string
  rag: 'green' | 'amber' | 'red' | 'grey'
  next_review_due: string | null
  priority: number
  assigned_to_name: string | null
}

export type ActionRow = {
  id: string
  klo_item_id: string
  klo_title: string
  key_question_name: string
  title: string
  status: 'open' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  assigned_to_name: string | null
  completion_notes: string | null
  completed_at: string | null
}

export type HrRow = {
  user_id: string
  full_name: string | null
  job_title: string | null
  dbs_next_review_due: string | null
  supervision_next_due: string | null
  appraisal_next_due: string | null
  mandatory_training_complete: boolean
}

export type MockInspectionYear = {
  id: string
  type: 'full' | 'partial'
  started_at: string
  completed_at: string | null
  conducted_by_name: string | null
  key_question_name: string | null   // for partial inspections
  ratings: { name: string; worstRating: string }[]
}

export interface SnapshotData {
  green: number; amber: number; red: number; grey: number; total: number
  open_actions: number; overdue_actions: number; captured_at: string
}

// ─── View definitions ─────────────────────────────────────────────────────────

export type ViewKey = 'governance' | 'attention-needed' | 'evidence-gaps' | 'hr-compliance' | 'kloe-with-actions' | 'pre-inspection'

export const SYSTEM_VIEWS: { key: ViewKey; label: string; description: string; adminOnly?: boolean }[] = [
  {
    key:         'governance',
    label:       'Governance Summary',
    description: 'Full picture — all KLOEs, open and completed actions, HR compliance, and annual review. For board packs and management meetings.',
  },
  {
    key:         'attention-needed',
    label:       'Attention Needed',
    description: 'Unassessed, Red, and Amber KLOEs only, plus open actions. Green KLOEs are excluded. Ordered by urgency: Unassessed → Red → Amber.',
  },
  {
    key:         'evidence-gaps',
    label:       'Evidence Gaps',
    description: 'KLOEs with no evidence uploaded, ordered Unassessed → Red → Amber. Use this to find where compliance is claimed but proof is missing.',
  },
  {
    key:         'kloe-with-actions',
    label:       'KLOEs with Actions',
    description: 'Each KLOE followed by its linked action items. Useful for team briefings and progress reviews.',
  },
  {
    key:         'pre-inspection',
    label:       'Inspection Readiness',
    description: 'Ordered by urgency with evidence count per KLOE. Shows open actions and HR compliance. Formatted for CQC inspection day.',
  },
  {
    key:         'hr-compliance',
    label:       'HR Compliance',
    description: 'Staff DBS checks, mandatory training, supervision, and appraisal status. Admin only.',
    adminOnly:   true,
  },
]

// Sort order: Unassessed → Red → Amber → Green
export const GAP_RAG_ORDER: Record<string, number> = { grey: 0, red: 1, amber: 2, green: 99 }

// ─── Colour/label maps ────────────────────────────────────────────────────────

export const RAG_COLOURS: Record<string, string> = {
  green: '#15803d',
  amber: '#b45309',
  red:   '#b91c1c',
  grey:  '#6b7280',
}

export const RAG_LABELS: Record<string, string> = {
  green: 'Green',
  amber: 'Amber',
  red:   'Red',
  grey:  'Not reviewed',
}

export const HR_STATUS_LABELS: Record<string, string> = {
  overdue:  'Overdue',
  due_soon: 'Due soon',
  ok:       'Current',
  not_set:  'Not set',
}

export const HR_STATUS_PILL: Record<string, { bg: string; color: string }> = {
  overdue:  { bg: '#fee2e2', color: '#b91c1c' },
  due_soon: { bg: '#fef3c7', color: '#b45309' },
  ok:       { bg: '#dcfce7', color: '#15803d' },
  not_set:  { bg: '#f3f4f6', color: '#6b7280' },
}

export const MOCK_RATING_LABELS: Record<string, string> = {
  outstanding:          'Outstanding',
  good:                 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate:           'Inadequate',
}

export const MOCK_RATING_COLOURS: Record<string, string> = {
  outstanding:          '#7e22ce',
  good:                 '#15803d',
  requires_improvement: '#b45309',
  inadequate:           '#b91c1c',
}

export const RATING_ORDER: Record<string, number> = {
  inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3,
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dateStatus(iso: string | null): 'overdue' | 'due_soon' | 'ok' | 'not_set' {
  if (!iso) return 'not_set'
  const now = new Date()
  const due = new Date(iso)
  if (due < now) return 'overdue'
  const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return days <= 30 ? 'due_soon' : 'ok'
}

export function trendArrow(prev: string | undefined, curr: string): { symbol: string; colour: string } | null {
  if (!prev) return null
  const diff = (RATING_ORDER[curr] ?? 0) - (RATING_ORDER[prev] ?? 0)
  if (diff > 0)  return { symbol: '↑', colour: '#15803d' }
  if (diff < 0)  return { symbol: '↓', colour: '#b91c1c' }
  return { symbol: '→', colour: '#6b7280' }
}
