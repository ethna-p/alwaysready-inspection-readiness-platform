/**
 * RAG (Red / Amber / Green / Grey) calculation.
 *
 * RAG is ALWAYS calculated from data — never a manually stored field.
 * Do not store this value; recalculate on every render.
 */
import type { ComplianceRecord } from './types'

export type RAGStatus = 'grey' | 'red' | 'amber' | 'green'

/** Human-readable labels (also used as screen-reader text) */
export const RAG_LABELS: Record<RAGStatus, string> = {
  grey:  'Unassessed',
  red:   'Overdue',
  amber: 'Due Soon',
  green: 'Up to Date',
}

/** Within this many days of next_review_due → Amber */
const DUE_SOON_DAYS = 14

/**
 * Calculate the RAG status for a compliance record.
 *
 * Priority order:
 *  1. Grey   — never reviewed (no date_reviewed set)
 *  2. Red    — next_review_due has passed (overdue takes priority over all else)
 *  3. Amber  — next review is within DUE_SOON_DAYS
 *  4. Green  — reviewed and not due soon
 *
 * Note: status (in_progress / completed) alone does NOT affect RAG.
 * RAG is always date-driven — a KLOE with no review date is always grey,
 * regardless of whether it has been marked "in progress".
 */
export function calculateRAG(
  record: ComplianceRecord | null | undefined,
  now: Date = new Date()
): RAGStatus {
  // Grey: no review date ever recorded
  if (!record || !record.date_reviewed) {
    return 'grey'
  }

  // Red: overdue
  if (record.next_review_due && new Date(record.next_review_due) < now) {
    return 'red'
  }

  // Amber: due soon
  if (record.next_review_due) {
    const msUntilDue = new Date(record.next_review_due).getTime() - now.getTime()
    const daysUntilDue = msUntilDue / (1_000 * 60 * 60 * 24)
    if (daysUntilDue <= DUE_SOON_DAYS) {
      return 'amber'
    }
  }

  // Green: reviewed and not due soon
  return 'green'
}
