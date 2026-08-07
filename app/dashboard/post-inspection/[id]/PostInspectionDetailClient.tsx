'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { type ReviewDetail, type FacItem } from './page'
import { RATING_LABEL, RATING_COLOURS, RATING_STRIP } from '../rating-utils'
import { type CqcRating, type ReviewStatus, type FacDisputeType, type FacStatus } from '../post-inspection-actions'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReviewStatus, string> = {
  draft_received:     'Draft received',
  fac_submitted:      'FAC submitted',
  final_report:       'Final report',
  action_plan_active: 'Action plan active',
  closed:             'Closed',
}

const FAC_DISPUTE_LABEL: Record<FacDisputeType, string> = {
  factual_error:       'Factual error',
  subjective_judgment: 'Subjective judgment',
}

const FAC_STATUS_LABEL: Record<FacStatus, string> = {
  pending:   'Pending',
  submitted: 'Submitted',
  upheld:    'Upheld',
  rejected:  'Rejected',
}

const FAC_STATUS_BADGE: Record<FacStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  upheld:    'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-700',
}

const CQC_RATINGS: CqcRating[] = ['outstanding', 'good', 'requires_improvement', 'inadequate', 'not_rated']
const KEY_QUESTIONS = ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'] as const

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toInputDate(iso: string): string {
  return iso.split('T')[0]
}

function facDaysRemaining(draftReceived: string): number {
  const deadline = new Date(draftReceived)
  deadline.setDate(deadline.getDate() + 14)
  const now = new Date()
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

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

// ── Edit review form ──────────────────────────────────────────────────────────

function EditReviewForm({
  review,
  onSubmit,
  onCancel,
}: {
  review: ReviewDetail
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
      if (result.error) setError(result.error)
      else onCancel()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Inspection date *</label>
          <input name="inspection_date" type="date" required
            defaultValue={toInputDate(review.inspection_date)}
            max={new Date().toISOString().split('T')[0]} className={inp} />
        </div>
        <div>
          <label className={lbl}>Draft report received</label>
          <input name="draft_received_date" type="date"
            defaultValue={review.draft_received_date ? toInputDate(review.draft_received_date) : ''}
            max={new Date().toISOString().split('T')[0]} className={inp} />
        </div>
        <div>
          <label className={lbl}>Final report received</label>
          <input name="final_report_date" type="date"
            defaultValue={review.final_report_date ? toInputDate(review.final_report_date) : ''}
            max={new Date().toISOString().split('T')[0]} className={inp} />
        </div>
        <div>
          <label className={lbl}>Inspector name</label>
          <input name="inspector_name" defaultValue={review.inspector_name ?? ''} className={inp} />
        </div>
        <div>
          <label className={lbl}>Status</label>
          <select name="status" defaultValue={review.status} className={inp}>
            {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Overall rating</label>
          <RatingSelect name="overall_rating" defaultValue={review.overall_rating} />
        </div>
        {KEY_QUESTIONS.map(kq => (
          <div key={kq}>
            <label className={lbl}>{kq}</label>
            <RatingSelect
              name={`${kq.toLowerCase().replace('-', '_')}_rating`}
              defaultValue={review[`${kq.toLowerCase().replace('-', '_')}_rating` as keyof ReviewDetail] as CqcRating}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className={lbl}>Key findings</label>
          <textarea name="key_findings" rows={4} defaultValue={review.key_findings ?? ''}
            placeholder="Main points raised by the inspector…" className={ta} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Staff briefing notes</label>
          <textarea name="staff_briefing" rows={4} defaultValue={review.staff_briefing ?? ''}
            placeholder="How you will communicate findings to the team…" className={ta} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── FAC item form ─────────────────────────────────────────────────────────────

function FacItemForm({
  defaults,
  onSubmit,
  onCancel,
  submitLabel,
  showStatus,
}: {
  defaults?: Partial<FacItem>
  onSubmit: (fd: FormData) => Promise<{ error?: string }>
  onCancel: () => void
  submitLabel: string
  showStatus?: boolean
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
      if (result.error) setError(result.error)
      else onCancel()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Key question *</label>
          <select name="key_question" required defaultValue={defaults?.key_question ?? ''} className={inp}>
            <option value="" disabled>Select…</option>
            {KEY_QUESTIONS.map(kq => <option key={kq} value={kq}>{kq}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Dispute type *</label>
          <select name="dispute_type" required defaultValue={defaults?.dispute_type ?? ''} className={inp}>
            <option value="" disabled>Select…</option>
            <option value="factual_error">Factual error — objectively wrong</option>
            <option value="subjective_judgment">Subjective judgment — we disagree</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>What the inspector wrote *</label>
          <textarea name="inspector_finding" required rows={3}
            defaultValue={defaults?.inspector_finding ?? ''}
            placeholder="Quote or paraphrase the relevant section of the draft report…"
            className={ta} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Our position *</label>
          <textarea name="our_position" required rows={3}
            defaultValue={defaults?.our_position ?? ''}
            placeholder="Why this is wrong and what the correct position is…"
            className={ta} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Evidence reference (optional)</label>
          <input name="evidence_reference"
            defaultValue={defaults?.evidence_reference ?? ''}
            placeholder="e.g. Care plan note 14 June, staffing rota week 24…"
            className={inp} />
        </div>
        {showStatus && (
          <div>
            <label className={lbl}>Status</label>
            <select name="status" defaultValue={defaults?.status ?? 'pending'} className={inp}>
              {(Object.keys(FAC_STATUS_LABEL) as FacStatus[]).map(s => (
                <option key={s} value={s}>{FAC_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50">
          {pending ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── FAC item card ─────────────────────────────────────────────────────────────

function FacItemCard({
  item,
  isAdmin,
  onUpdate,
  onDelete,
}: {
  item: FacItem
  isAdmin: boolean
  onUpdate: (fd: FormData) => Promise<{ error?: string }>
  onDelete: () => Promise<{ error?: string }>
}) {
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [pending, startTransition]  = useTransition()

  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-fill-dim transition-colors"
        onClick={() => { setExpanded(e => !e); setEditing(false) }}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand">{item.key_question}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">
              {FAC_DISPUTE_LABEL[item.dispute_type]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FAC_STATUS_BADGE[item.status]}`}>
              {FAC_STATUS_LABEL[item.status]}
            </span>
          </div>
          <p className="text-sm text-ink line-clamp-2">{item.inspector_finding}</p>
        </div>
        <span className="text-ink-dim text-xs shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && !editing && (
        <div className="px-4 pb-4 border-t border-line pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-ink-dim mb-1">Inspector finding</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{item.inspector_finding}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-dim mb-1">Our position</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{item.our_position}</p>
          </div>
          {item.evidence_reference && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Evidence reference</p>
              <p className="text-sm text-ink">{item.evidence_reference}</p>
            </div>
          )}

          {!showDelete && isAdmin && (
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(true)}
                className="text-xs font-semibold text-brand hover:underline">Edit</button>
              <button onClick={() => setShowDelete(true)}
                className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
            </div>
          )}

          {showDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">Delete this FAC item?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => startTransition(async () => { await onDelete() })}
                  disabled={pending}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {pending ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button onClick={() => setShowDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && editing && (
        <div className="px-4 pb-4 border-t border-line pt-3">
          <FacItemForm
            defaults={item}
            onSubmit={onUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
            showStatus
          />
        </div>
      )}
    </div>
  )
}

// ── Main detail component ─────────────────────────────────────────────────────

export default function PostInspectionDetailClient({
  review,
  facItems,
  isAdmin,
  updateReview,
  deleteReview,
  createFacItem,
  updateFacItem,
  deleteFacItem,
}: {
  review: ReviewDetail
  facItems: FacItem[]
  isAdmin: boolean
  updateReview: (fd: FormData) => Promise<{ error?: string }>
  deleteReview: () => Promise<{ error?: string }>
  createFacItem: (fd: FormData) => Promise<{ error?: string }>
  updateFacItem: (id: string, fd: FormData) => Promise<{ error?: string }>
  deleteFacItem: (id: string) => Promise<{ error?: string }>
}) {
  const [editing, setEditing]         = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [showFacForm, setShowFacForm] = useState(false)
  const [pending, startTransition]    = useTransition()
  const router                        = useRouter()

  const daysLeft = review.draft_received_date && review.status === 'draft_received'
    ? facDaysRemaining(review.draft_received_date)
    : null

  const facByKQ = KEY_QUESTIONS.reduce((acc, kq) => {
    acc[kq] = facItems.filter(f => f.key_question === kq)
    return acc
  }, {} as Record<string, FacItem[]>)

  const upheld  = facItems.filter(f => f.status === 'upheld').length
  const rejected = facItems.filter(f => f.status === 'rejected').length
  const pending_ = facItems.filter(f => f.status === 'pending').length
  const submitted = facItems.filter(f => f.status === 'submitted').length

  return (
    <div className="space-y-6">

      {/* ── Rating header card ── */}
      <div className="bg-card border border-line rounded-xl shadow-sm overflow-hidden">
        <div className={`h-2 w-full ${RATING_STRIP[review.overall_rating]}`} />
        <div className="px-6 py-5">
          {!editing ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${RATING_COLOURS[review.overall_rating]}`}>
                      {RATING_LABEL[review.overall_rating]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-fill-dim text-ink-dim font-semibold">
                      {STATUS_LABEL[review.status]}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-ink">
                    CQC Inspection — {formatDate(review.inspection_date)}
                  </p>
                  {review.inspector_name && (
                    <p className="text-sm text-ink-dim">Inspector: {review.inspector_name}</p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-ink-dim">
                    {review.draft_received_date && <span>Draft received: {formatDate(review.draft_received_date)}</span>}
                    {review.final_report_date   && <span>Final report: {formatDate(review.final_report_date)}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => setEditing(true)}
                      className="text-xs font-semibold text-brand hover:underline">Edit</button>
                    {!showDelete && (
                      <button onClick={() => setShowDelete(true)}
                        className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                    )}
                  </div>
                )}
              </div>

              {/* FAC deadline */}
              {daysLeft !== null && (
                <div className={`rounded-lg border px-4 py-3 text-sm font-semibold
                  ${daysLeft <= 0   ? 'bg-red-100 border-red-300 text-red-800' :
                    daysLeft <= 3   ? 'bg-red-50 border-red-300 text-red-700' :
                    daysLeft <= 7   ? 'bg-amber-50 border-amber-300 text-amber-700' :
                                      'bg-green-50 border-green-300 text-green-700'}`}>
                  {daysLeft <= 0
                    ? '⏱ The 10-working-day FAC window has now closed.'
                    : `⏱ Factual Accuracy Challenge deadline: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining (10 working days from draft received).`}
                </div>
              )}

              {/* Per-KQ ratings */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {KEY_QUESTIONS.map(kq => {
                  const ratingKey = `${kq.toLowerCase().replace('-', '_')}_rating` as keyof ReviewDetail
                  const rating = review[ratingKey] as CqcRating
                  return (
                    <div key={kq} className={`rounded-lg border px-3 py-2 text-center ${RATING_COLOURS[rating]}`}>
                      <p className="text-xs font-bold mb-0.5">{kq}</p>
                      <p className="text-xs">{RATING_LABEL[rating]}</p>
                    </div>
                  )
                })}
              </div>

              {/* Key findings */}
              {review.key_findings && (
                <div>
                  <p className="text-xs font-semibold text-ink-dim mb-1">Key findings</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{review.key_findings}</p>
                </div>
              )}

              {/* Staff briefing */}
              {review.staff_briefing && (
                <div>
                  <p className="text-xs font-semibold text-ink-dim mb-1">Staff briefing notes</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{review.staff_briefing}</p>
                </div>
              )}

              {/* Delete confirmation */}
              {showDelete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  <p className="font-semibold mb-1">Delete this inspection record?</p>
                  <p className="text-xs mb-3">All FAC items will also be deleted. This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startTransition(async () => {
                        const res = await deleteReview()
                        if (!res.error) router.push('/dashboard/post-inspection')
                      })}
                      disabled={pending}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                      {pending ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setShowDelete(false)}
                      className="px-3 py-1.5 text-xs font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EditReviewForm
              review={review}
              onSubmit={updateReview}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </div>

      {/* ── FAC section ── */}
      <div className="bg-card border border-line rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-line">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-brand">Factual Accuracy Challenge</h2>
              <p className="text-xs text-ink-dim mt-0.5">
                Log each point you wish to dispute in the draft report.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {facItems.length > 0 && (
                <>
                  {pending_ > 0  && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">{pending_} pending</span>}
                  {submitted > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700">{submitted} submitted</span>}
                  {upheld > 0    && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-700">{upheld} upheld</span>}
                  {rejected > 0  && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-700">{rejected} rejected</span>}
                </>
              )}
              {isAdmin && !showFacForm && (
                <button
                  onClick={() => setShowFacForm(true)}
                  className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand/90">
                  + Add FAC item
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">

          {/* New FAC form */}
          {showFacForm && (
            <div className="bg-fill-dim border border-line rounded-lg p-4">
              <h3 className="text-sm font-semibold text-brand mb-3">New FAC item</h3>
              <FacItemForm
                onSubmit={createFacItem}
                onCancel={() => setShowFacForm(false)}
                submitLabel="Save FAC item"
              />
            </div>
          )}

          {/* FAC items grouped by KQ */}
          {facItems.length === 0 && !showFacForm ? (
            <p className="text-sm text-ink-dim text-center py-8">
              No FAC items logged yet.
              {isAdmin && (
                <> <button onClick={() => setShowFacForm(true)} className="text-brand hover:underline">Add your first item.</button></>
              )}
            </p>
          ) : (
            KEY_QUESTIONS.map(kq => {
              const items = facByKQ[kq]
              if (!items || items.length === 0) return null
              return (
                <div key={kq}>
                  <p className="text-xs font-semibold text-ink-dim mb-2">{kq}</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <FacItemCard
                        key={item.id}
                        item={item}
                        isAdmin={isAdmin}
                        onUpdate={(fd) => updateFacItem(item.id, fd)}
                        onDelete={() => deleteFacItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── CAPA link ── */}
      <div className="bg-fill-dim border border-line rounded-xl px-6 py-4">
        <h2 className="text-sm font-semibold text-ink mb-1">Corrective Action Plan (CAPA)</h2>
        <p className="text-xs text-ink-dim mb-3">
          If the inspection identified areas for improvement, assign action items via the KLOE action plans.
          Each finding can be linked directly to the relevant KLOE for tracking and sign-off.
        </p>
        <Link href="/dashboard/kloes"
          className="text-xs font-semibold text-brand hover:underline">
          Go to KLOE action plans →
        </Link>
      </div>

    </div>
  )
}
