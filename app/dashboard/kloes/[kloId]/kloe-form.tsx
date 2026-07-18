'use client'

/**
 * KloeForm — the edit form for a single KLOE.
 *
 * Client component so we can use useActionState for pending/success/error states.
 * The form uses a server action (updateKloCompliance) — no JSON API needed.
 *
 * Props:
 *   isAdmin — when false, priority and review frequency fields are hidden.
 *             Non-admins can only update status, review date, evidence, and notes.
 */

import Link from 'next/link'
import { useActionState } from 'react'
import { updateKloCompliance } from '../actions'
import type { ActionState } from '../actions'
import type { ComplianceRecord } from '@/lib/types'
import Tooltip from '@/components/Tooltip'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed',   label: 'Completed'   },
]

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 — Critical (most serious if non-compliant)' },
  { value: '2', label: '2 — High' },
  { value: '3', label: '3 — Medium' },
  { value: '4', label: '4 — Low' },
  { value: '5', label: '5 — Minimal' },
]

const FREQUENCY_OPTIONS = [
  { value: '30',  label: 'Monthly (every 30 days)' },
  { value: '60',  label: 'Every 2 months (60 days)' },
  { value: '90',  label: 'Quarterly (every 90 days)' },
  { value: '180', label: 'Every 6 months (180 days)' },
  { value: '365', label: 'Annually (365 days)' },
]

/** Format an ISO timestamp to YYYY-MM-DD for date inputs */
function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.substring(0, 10)
}

interface Props {
  kloItemId: string
  currentRecord: ComplianceRecord | null
  /** When false, priority and review frequency controls are hidden */
  isAdmin: boolean
}

export default function KloeForm({ kloItemId, currentRecord, isAdmin }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateKloCompliance,
    null
  )

  // Current values (or sensible defaults)
  const defaultStatus    = currentRecord?.status              ?? 'not_started'
  const defaultPriority  = String(currentRecord?.priority     ?? 3)
  const defaultFrequency = String(currentRecord?.review_frequency_days ?? 90)
  const defaultDate      = toDateInput(currentRecord?.date_reviewed ?? null)
  const defaultNotes     = currentRecord?.notes               ?? ''

  // Get today's date as YYYY-MM-DD for the date input max attribute
  const todayStr = new Date().toISOString().substring(0, 10)

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="klo_item_id" value={kloItemId} />

      <div className="space-y-5">

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Status
            <Tooltip text="Use this to track where you are with this KLOE. Set to In progress once you've started gathering evidence, and Completed once a formal review is recorded. CQC will look for evidence of active, ongoing compliance — not just a completed date." />
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultStatus}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Priority — admins only */}
        {isAdmin && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Priority
              <span className="ml-1 text-xs text-gray-600 font-normal">(how serious if non-compliant)</span>
              <Tooltip text="How serious would it be if this KLOE was found non-compliant during an inspection? Priority 1 means the consequences are most severe (e.g. a safeguarding failure). Priority 5 means the risk is minimal. Set by the manager — staff cannot change this." />
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={defaultPriority}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
            >
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date reviewed */}
        <div>
          <label htmlFor="date_reviewed" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Date of this review
            <span className="ml-1 text-xs text-gray-600 font-normal">(when you actually completed the review, not today's date)</span>
            <Tooltip text="The date you actually completed the review — not today's date unless you reviewed it today. This date is used to calculate when the next review is due, and is permanently recorded in your audit trail." />
          </label>
          <input
            type="date"
            id="date_reviewed"
            name="date_reviewed"
            defaultValue={defaultDate}
            max={todayStr}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
          <p className="text-xs text-gray-600 mt-1">
            Leave blank if you are only updating status{isAdmin ? ' or priority' : ''} without completing a review.
          </p>
        </div>

        {/* Review frequency — admins only */}
        {isAdmin && (
          <div>
            <label htmlFor="review_frequency_days" className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Review frequency
              <span className="ml-1 text-xs text-gray-600 font-normal">(how often this KLOE should be reviewed)</span>
              <Tooltip text="How often this KLOE needs to be reviewed. Some KLOEs (e.g. medication management) may need monthly attention; others (e.g. premises checks) may be fine quarterly. You can change this at any time — all changes are logged." />
            </label>
            <select
              id="review_frequency_days"
              name="review_frequency_days"
              defaultValue={FREQUENCY_OPTIONS.some(o => o.value === defaultFrequency)
                ? defaultFrequency
                : '90'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
            >
              {FREQUENCY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Changes to review frequency are logged in your audit trail.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Notes
            <span className="ml-1 text-xs text-gray-600 font-normal">(optional context for this entry)</span>
            <Tooltip text="Any context about this update — what you reviewed, actions you've taken, or anything an inspector or your team should know. Notes are permanent and cannot be edited once saved." />
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={defaultNotes}
            placeholder="Any context about this review entry — actions taken, issues noted, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] resize-y"
          />
        </div>

        {/* Success / error feedback */}
        {state && (
          <div
            role="alert"
            aria-live="polite"
            className={`rounded-lg px-4 py-3 text-sm ${
              state.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {state.success ? state.message : state.error}
          </div>
        )}

        {/* Submit + back link */}
        <div className="flex items-center gap-4 pt-1 flex-wrap">
          <button
            type="submit"
            disabled={isPending}
            className="
              bg-[#014D4E] text-white text-sm font-medium
              px-5 py-2.5 rounded-lg
              hover:bg-[#013838]
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isPending ? 'Saving…' : 'Save to audit trail'}
          </button>
          {isPending && (
            <span className="text-sm text-gray-600" aria-live="polite">
              Saving your update…
            </span>
          )}
          <Link
            href="/dashboard/kloes"
            className="
              text-sm font-medium text-[#014D4E]
              hover:underline
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              rounded
            "
          >
            ← Back to all KLOEs
          </Link>
        </div>
      </div>
    </form>
  )
}
