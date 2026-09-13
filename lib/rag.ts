/**
 * RAG (Red / Amber / Green / Grey) calculation.
 *
 * RAG is ALWAYS calculated from data — never a manually stored field.
 * Do not store this value; recalculate on every render.
 */
import type { ComplianceRecord } from './types'

/** Minimum fields needed to calculate RAG — allows partial selects */
export type RAGInput = Pick<ComplianceRecord, 'date_reviewed' | 'next_review_due'>

export type RAGStatus = 'grey' | 'red' | 'amber' | 'green'

/** Human-readable labels (also used as screen-reader text) */
export const RAG_LABELS: Record<RAGStatus, string> = {
  grey:  'Unassessed',
  red:   'Overdue',
  amber: 'Due Soon',
  green: 'Up to Date',
}

/**
 * Within this many days of next_review_due → Amber.
 *
 * Exported so every other "due soon" surface in the app (e.g. the Daily
 * Review Report) shares this single number rather than hardcoding its own —
 * the Daily Report used to hardcode 30 here, a real, live divergence from
 * this file that a real E2E test (e2e/daily-report.spec.ts) found and
 * proved, then AJ confirmed 14 is the correct "due soon" window and 30 is
 * too far out to call "due soon". Reconciled by having that page import
 * this constant instead of repeating its own.
 */
export const DUE_SOON_DAYS = 14

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
  record: RAGInput | null | undefined,
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
