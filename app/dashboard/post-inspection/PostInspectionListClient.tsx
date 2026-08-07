'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { type PostInspectionReview } from './page'
import { type CqcRating, type ReviewStatus } from './post-inspection-actions'

// ── Rating helpers ────────────────────────────────────────────────────────────

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

const STATUS_LABEL: Record<ReviewStatus, string> = {
  draft_received:     'Draft received',
  fac_submitted:      'FAC submitted',
  final_report:       'Final report',
  action_plan_active: 'Action plan active',
  closed:             'Closed',
}

const KEY_QUESTIONS: Array<{ key: keyof PostInspectionReview; label: string }> = [
  { key: 'safe_rating',        label: 'Safe' },
  { key: 'effective_rating',   label: 'Effective' },
  { key: 'caring_rating',      label: 'Caring' },
  { key: 'responsive_rating',  label: 'Responsive' },
  { key: 'well_led_rating',    label: 'Well-led' },
]

const CQC_RATINGS: CqcRating[] = ['outstanding', 'good', 'requires_improvement', 'inadequate', 'not_rated']

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toInputDate(iso: string): string {
  return iso.split('T')[0]
}

/** Days remaining in the 10-working-day FAC window (calendar days approximation: 14 days) */
function facDaysRemaining(draftReceived: string): number {
  const deadline = new Date(draftReceived)
  deadline.setDate(deadline.getDate() + 14) // 10 working days ≈ 14 calendar days
  const now = new Date()
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ── New review form ───────────────────────────────────────────────────────────

function RatingSelect({ name, defaultValue }: { name: string; defaultValue?: CqcRating }) {
  const cls = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  return (
    <select name={name} defaultValue={defaultValue ?? 'not_rated'} className={cls}>
      {CQC_RATINGS.map(r => (
        <option key={r} value={r}>{RATING_LABEL[r]}</option>
      ))}
    </select>
  )
}

function NewReviewForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (fd: FormData) => Promise<{ error?: string }>
  onCancel: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  const inp = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  const ta  = `${inp} resize-y`
  const lbl = 'block text-xs font-semibold text-ink-dim mb-1'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await onSubmit(fd)
      if (result?.error) setError(result.error)
      // on success, server action calls redirect() — navigation is automatic
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className={lbl}>Inspection date *</label>
          <input name="inspection_date" type="date" required
            max={new Date().toISOString().split('T')[0]} className={inp} />
        </div>

        <div>
          <label className={lbl}>Draft report received</label>
          <input name="draft_received_date" type="date"
            max={new Date().toISOString().split('T')[0]} className={inp} />
        </div>

        <div>
          <label className={lbl}>Inspector name (optional)</label>
          <input name="inspector_name" placeholder="e.g. J. Smith" className={inp} />
        </div>

        <div>
          <label className={lbl}>Status</label>
          <select name="status" defaultValue="draft_received" className={inp}>
            {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Overall rating */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-ink-dim mb-3">Overall and key question ratings</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className={lbl}>Overall rating</label>
              <RatingSelect name="overall_rating" />
            </div>
            {KEY_QUESTIONS.map(({ label }) => (
              <div key={label}>
                <label className={lbl}>{label}</label>
                <RatingSelect name={`${label.toLowerCase().replace('-', '_')}_rating`} />
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Key findings (summary)</label>
          <textarea name="key_findings" rows={4}
            placeholder="Main points raised by the inspector…" className={ta} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50">
          {pending ? 'Saving…' : 'Save and open'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: PostInspectionReview }) {
  const daysLeft = review.draft_received_date && review.status === 'draft_received'
    ? facDaysRemaining(review.draft_received_date)
    : null

  const facBanner = daysLeft !== null
    ? daysLeft <= 0
      ? { cls: 'bg-red-100 border-red-300 text-red-800', msg: 'FAC window has closed' }
      : daysLeft <= 3
      ? { cls: 'bg-red-50 border-red-300 text-red-700', msg: `FAC deadline: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining — urgent` }
      : daysLeft <= 7
      ? { cls: 'bg-amber-50 border-amber-300 text-amber-700', msg: `FAC deadline: ${daysLeft} days remaining` }
      : { cls: 'bg-green-50 border-green-300 text-green-700', msg: `FAC deadline: ${daysLeft} days remaining` }
    : null

  return (
    <Link href={`/dashboard/post-inspection/${review.id}`} className="block group">
      <div className="bg-card border border-line rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Rating strip */}
        <div className={`h-1.5 w-full ${RATING_STRIP[review.overall_rating]}`} />

        <div className="px-5 py-4 space-y-3">
          {/* Header row */}
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${RATING_COLOURS[review.overall_rating]}`}>
                  {RATING_LABEL[review.overall_rating]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-fill-dim text-ink-dim">
                  {STATUS_LABEL[review.status]}
                </span>
                {review.fac_count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700">
                    {review.fac_count} FAC item{review.fac_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-ink">
                Inspection {formatDate(review.inspection_date)}
              </p>
              {review.inspector_name && (
                <p className="text-xs text-ink-dim">Inspector: {review.inspector_name}</p>
              )}
            </div>
            <span className="text-ink-dim text-sm shrink-0 group-hover:text-brand transition-colors">→</span>
          </div>

          {/* FAC deadline banner */}
          {facBanner && (
            <div className={`text-xs px-3 py-2 rounded-lg border font-semibold ${facBanner.cls}`}>
              ⏱ {facBanner.msg}
            </div>
          )}

          {/* Per-KQ ratings */}
          <div className="flex flex-wrap gap-2">
            {KEY_QUESTIONS.map(({ key, label }) => {
              const rating = review[key] as CqcRating
              return (
                <div key={label} className="text-center">
                  <div className={`text-xs px-2 py-0.5 rounded font-medium border ${RATING_COLOURS[rating]}`}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PostInspectionListClient({
  reviews,
  isAdmin,
  createReview,
}: {
  reviews: PostInspectionReview[]
  isAdmin: boolean
  createReview: (fd: FormData) => Promise<{ error?: string }>
}) {
  const [showForm, setShowForm] = useState(false)

  const openFac = reviews.filter(r =>
    r.draft_received_date && r.status === 'draft_received' && facDaysRemaining(r.draft_received_date) > 0
  )

  return (
    <div className="space-y-6">

      {/* Urgent FAC banner if any reviews have an open window */}
      {openFac.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-800 font-semibold">
          ⚠ You have {openFac.length} inspection{openFac.length !== 1 ? 's' : ''} with an open FAC window. Check deadlines below.
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-dim">{reviews.length} inspection{reviews.length !== 1 ? 's' : ''} recorded</p>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90">
            + Log inspection
          </button>
        )}
      </div>

      {/* New inspection form */}
      {showForm && (
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-brand mb-4">Log CQC inspection</h2>
          <NewReviewForm
            onSubmit={createReview}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-ink-dim">
          <p className="text-sm">No inspections recorded yet.</p>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-brand hover:underline">
              Log your first inspection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  )
}
