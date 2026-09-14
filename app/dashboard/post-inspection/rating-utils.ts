import type { CqcRating } from './post-inspection-actions'

export const RATING_LABEL: Record<CqcRating, string> = {
  outstanding:          'Outstanding',
  good:                 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate:           'Inadequate',
  not_rated:            'Not yet rated',
}

export const RATING_COLOURS: Record<CqcRating, string> = {
  outstanding:          'bg-purple-100 text-purple-800 border-purple-300',
  good:                 'bg-green-100 text-green-800 border-green-300',
  requires_improvement: 'bg-amber-100 text-amber-800 border-amber-300',
  inadequate:           'bg-red-100 text-red-800 border-red-300',
  not_rated:            'bg-gray-100 text-gray-600 border-gray-300',
}

// Hex values match CQC's official colour system — see PROJECT_BRIEF.md § CQC Rating Colours
export const RATING_STRIP: Record<CqcRating, string> = {
  outstanding:          'bg-[#6D276A]',
  good:                 'bg-[#458F00]',
  requires_improvement: 'bg-[#F47738]',
  inadequate:           'bg-[#DA291C]',
  not_rated:            'bg-gray-300',
}

/** Adds `n` working days (Mon-Fri) to a date, skipping weekends. */
function addWorkingDays(start: Date, n: number): Date {
  const d = new Date(start)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

/**
 * Days remaining in the 10-working-day Factual Accuracy Challenge window
 * from the draft-received date -- a real CQC regulatory deadline, not a
 * soft internal reminder.
 *
 * This used to be duplicated in both PostInspectionListClient.tsx and
 * PostInspectionDetailClient.tsx as `deadline.setDate(+14)` ("10 working
 * days ≈ 14 calendar days"). That approximation is mathematically exact
 * for a draft received on any weekday (confirmed directly), but silently
 * wrong -- always in the provider's favour, giving them *more* time than
 * they actually have -- when the logged received date falls on a Saturday
 * or Sunday: 1 day too late for a Saturday, 2 days too late for a Sunday.
 * A real, reachable case (an admin logging the calendar date a report
 * literally arrived, e.g. by email, not restricted to weekdays by the
 * date picker), and a real consequence on a genuine deadline, not a
 * cosmetic display bug. Fixed with an actual working-days calculation,
 * consolidated here once instead of two independently-drifting copies.
 */
export function facDaysRemaining(draftReceived: string): number {
  const deadline = addWorkingDays(new Date(draftReceived), 10)
  const now = new Date()
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
