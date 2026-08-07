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

export const RATING_STRIP: Record<CqcRating, string> = {
  outstanding:          'bg-purple-500',
  good:                 'bg-green-500',
  requires_improvement: 'bg-amber-500',
  inadequate:           'bg-red-500',
  not_rated:            'bg-gray-300',
}
