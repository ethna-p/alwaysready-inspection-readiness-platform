'use client'

import { useState, useTransition } from 'react'
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  type FeedbackType,
  type FeedbackSource,
  type FeedbackStatus,
} from './feedback-actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FeedbackRecord = {
  id: string
  feedback_type: FeedbackType
  received_date: string
  source: FeedbackSource
  source_detail: string | null
  summary: string
  action_taken: string | null
  outcome: string | null
  status: FeedbackStatus
  related_key_question: string | null
  reported_to_cqc: boolean
  created_by: string | null
  created_at: string
}

type Props = {
  records: FeedbackRecord[]
  isAdmin: boolean
  isViewer: boolean
  currentUserId: string
}

// ── Display helpers ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<FeedbackType, string> = {
  complaint:   'Complaint',
  compliment:  'Compliment',
  suggestion:  'Suggestion',
  concern:     'Concern',
}

const TYPE_COLOURS: Record<FeedbackType, string> = {
  complaint:  'bg-red-500',
  compliment: 'bg-green-500',
  suggestion: 'bg-blue-500',
  concern:    'bg-amber-500',
}

const TYPE_BADGE: Record<FeedbackType, string> = {
  complaint:  'bg-red-50 text-red-700',
  compliment: 'bg-green-50 text-green-700',
  suggestion: 'bg-blue-50 text-blue-700',
  concern:    'bg-amber-50 text-amber-700',
}

const STATUS_BADGE: Record<FeedbackStatus, string> = {
  open:     'bg-amber-50 text-amber-700',
  actioned: 'bg-blue-50 text-blue-700',
  closed:   'bg-gray-100 text-gray-600',
}

const SOURCE_LABELS: Record<FeedbackSource, string> = {
  person_using_service: 'Person using the service',
  family_or_carer:      'Family or carer',
  professional:         'Professional',
  anonymous:            'Anonymous',
  other:                'Other',
}

const KEY_QUESTIONS = ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led']

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toInputDate(iso: string): string {
  return iso.split('T')[0]
}

// ── Shared form ───────────────────────────────────────────────────────────────

function FeedbackForm({
  defaults,
  isAdmin,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaults?: Partial<FeedbackRecord>
  isAdmin: boolean
  onSubmit: (fd: FormData) => Promise<{ error?: string }>
  onCancel: () => void
  submitLabel: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)
  const [showSourceDetail, setShowSourceDetail] = useState<boolean>(
    !!(defaults?.source && defaults.source !== 'anonymous')
  )
  const [reportedToCqc, setReportedToCqc] = useState<boolean>(defaults?.reported_to_cqc ?? false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('reported_to_cqc', reportedToCqc ? 'true' : 'false')
    startTransition(async () => {
      const result = await onSubmit(fd)
      if (result.error) setError(result.error)
    })
  }

  const inp  = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  const ta   = `${inp} resize-y`
  const lbl  = 'block text-xs font-semibold text-ink-dim mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Type */}
        <div>
          <label className={lbl}>Type *</label>
          <select name="feedback_type" required defaultValue={defaults?.feedback_type ?? ''} className={inp}>
            <option value="" disabled>Select type…</option>
            <option value="complaint">Complaint</option>
            <option value="compliment">Compliment</option>
            <option value="suggestion">Suggestion</option>
            <option value="concern">Concern</option>
          </select>
        </div>

        {/* Date received */}
        <div>
          <label className={lbl}>Date received *</label>
          <input name="received_date" type="date" required
            defaultValue={defaults?.received_date ? toInputDate(defaults.received_date) : ''}
            max={new Date().toISOString().split('T')[0]}
            className={inp} />
        </div>

        {/* Source */}
        <div>
          <label className={lbl}>Source *</label>
          <select name="source" required
            defaultValue={defaults?.source ?? ''}
            onChange={e => setShowSourceDetail(e.target.value !== 'anonymous')}
            className={inp}>
            <option value="" disabled>Select source…</option>
            <option value="person_using_service">Person using the service</option>
            <option value="family_or_carer">Family or carer</option>
            <option value="professional">Professional</option>
            <option value="anonymous">Anonymous</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Source detail — optional unless anonymous */}
        {showSourceDetail && (
          <div>
            <label className={lbl}>Source detail (optional)</label>
            <input name="source_detail" defaultValue={defaults?.source_detail ?? ''}
              placeholder="e.g. 'Family member of Room 4' — avoid names"
              className={inp} />
          </div>
        )}
        {!showSourceDetail && <div />}

        {/* Summary */}
        <div className="sm:col-span-2">
          <label className={lbl}>Summary of feedback *</label>
          <textarea name="summary" rows={3} required defaultValue={defaults?.summary ?? ''}
            placeholder="What was said or raised…"
            className={ta} />
        </div>

        {/* Action taken */}
        <div className="sm:col-span-2">
          <label className={lbl}>Action taken</label>
          <textarea name="action_taken" rows={2} defaultValue={defaults?.action_taken ?? ''}
            placeholder="How the service responded…"
            className={ta} />
        </div>

        {/* Outcome */}
        <div className="sm:col-span-2">
          <label className={lbl}>Outcome</label>
          <textarea name="outcome" rows={2} defaultValue={defaults?.outcome ?? ''}
            placeholder="Result or resolution…"
            className={ta} />
        </div>

        {/* Related key question */}
        <div>
          <label className={lbl}>Related key question (optional)</label>
          <select name="related_key_question" defaultValue={defaults?.related_key_question ?? ''} className={inp}>
            <option value="">None selected</option>
            {KEY_QUESTIONS.map(kq => (
              <option key={kq} value={kq}>{kq}</option>
            ))}
          </select>
        </div>

        {/* Status — only admins can change status */}
        {isAdmin && defaults?.status && (
          <div>
            <label className={lbl}>Status</label>
            <select name="status" defaultValue={defaults.status} className={inp}>
              <option value="open">Open</option>
              <option value="actioned">Actioned</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}

        {/* Reported to CQC */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={reportedToCqc}
              onChange={e => setReportedToCqc(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
            <span className="text-sm text-ink">Reported to CQC</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
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

// ── Feedback card ─────────────────────────────────────────────────────────────

function FeedbackCard({
  record,
  isAdmin,
  currentUserId,
}: {
  record: FeedbackRecord
  isAdmin: boolean
  currentUserId: string
}) {
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [pending, startTransition]  = useTransition()

  const canEdit = isAdmin || (record.created_by === currentUserId && record.status === 'open')

  function handleDelete() {
    startTransition(async () => { await deleteFeedback(record.id) })
  }

  return (
    <div className="bg-card border border-line rounded-xl shadow-sm overflow-hidden">
      {/* Colour strip */}
      <div className={`h-1 w-full ${TYPE_COLOURS[record.feedback_type]}`} />

      {/* Header */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-fill-dim transition-colors"
        onClick={() => { setExpanded(e => !e); setEditing(false) }}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[record.feedback_type]}`}>
              {TYPE_LABELS[record.feedback_type]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[record.status]}`}>
              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </span>
            {record.related_key_question && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700">
                {record.related_key_question}
              </span>
            )}
          </div>
          <p className="text-sm text-ink line-clamp-2 mb-0.5">{record.summary}</p>
          <p className="text-xs text-ink-dim">
            {formatDate(record.received_date)} · {SOURCE_LABELS[record.source]}
            {record.reported_to_cqc && <> · <span className="text-red-600 font-semibold">Reported to CQC</span></>}
          </p>
        </div>
        <span className="text-ink-dim text-xs shrink-0 mt-0.5">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && !editing && (
        <div className="px-5 pb-5 border-t border-line pt-4 space-y-4">

          <div>
            <p className="text-xs font-semibold text-ink-dim mb-1">Summary</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{record.summary}</p>
          </div>

          {record.source_detail && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Source detail</p>
              <p className="text-sm text-ink">{record.source_detail}</p>
            </div>
          )}

          {record.action_taken && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Action taken</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{record.action_taken}</p>
            </div>
          )}

          {record.outcome && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Outcome</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{record.outcome}</p>
            </div>
          )}

          {/* Actions */}
          {!showDelete && (canEdit || isAdmin) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {canEdit && (
                <button onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-brand hover:underline">
                  Edit
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowDelete(true)}
                  className="text-xs font-semibold text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </div>
          )}

          {showDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">Delete this feedback record?</p>
              <p className="text-xs mb-3">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={pending}
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

      {/* Edit form */}
      {expanded && editing && (
        <div className="px-5 pb-5 border-t border-line pt-4">
          <FeedbackForm
            defaults={record}
            isAdmin={isAdmin}
            onSubmit={fd => updateFeedback(record.id, fd)}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FeedbackClient({ records, isAdmin, isViewer, currentUserId }: Props) {
  const [showForm, setShowForm]           = useState(false)
  const [filterType, setFilterType]       = useState<'' | FeedbackType>('')
  const [filterStatus, setFilterStatus]   = useState<'' | FeedbackStatus>('')

  const filtered = records.filter(r =>
    (!filterType   || r.feedback_type === filterType) &&
    (!filterStatus || r.status === filterStatus)
  )

  const hasFilters = filterType !== '' || filterStatus !== ''

  // Summary counts
  const counts = {
    complaint:  records.filter(r => r.feedback_type === 'complaint').length,
    compliment: records.filter(r => r.feedback_type === 'compliment').length,
    suggestion: records.filter(r => r.feedback_type === 'suggestion').length,
    concern:    records.filter(r => r.feedback_type === 'concern').length,
    open:       records.filter(r => r.status === 'open').length,
  }

  const select = 'border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <div className="space-y-6">

      {/* Summary pills */}
      {records.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.complaint > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-50 text-red-700">
              {counts.complaint} complaint{counts.complaint !== 1 ? 's' : ''}
            </span>
          )}
          {counts.compliment > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-50 text-green-700">
              {counts.compliment} compliment{counts.compliment !== 1 ? 's' : ''}
            </span>
          )}
          {counts.suggestion > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700">
              {counts.suggestion} suggestion{counts.suggestion !== 1 ? 's' : ''}
            </span>
          )}
          {counts.concern > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-amber-50 text-amber-700">
              {counts.concern} concern{counts.concern !== 1 ? 's' : ''}
            </span>
          )}
          {counts.open > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-orange-50 text-orange-700">
              {counts.open} open
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value as '' | FeedbackType)} className={select}>
          <option value="">All types</option>
          <option value="complaint">Complaints</option>
          <option value="compliment">Compliments</option>
          <option value="suggestion">Suggestions</option>
          <option value="concern">Concerns</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as '' | FeedbackStatus)} className={select}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="actioned">Actioned</option>
          <option value="closed">Closed</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterType(''); setFilterStatus('') }}
            className="text-xs text-ink-dim hover:text-ink underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-ink-dim ml-auto">
          {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
        </span>
        {!isViewer && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90">
            + Log feedback
          </button>
        )}
      </div>

      {/* New feedback form */}
      {showForm && (
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-brand mb-4">Log feedback received</h2>
          <FeedbackForm
            isAdmin={isAdmin}
            onSubmit={async fd => {
              const result = await createFeedback(fd)
              if (!result.error) setShowForm(false)
              return result
            }}
            onCancel={() => setShowForm(false)}
            submitLabel="Save feedback"
          />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-dim">
          {records.length === 0
            ? <p className="text-sm">No feedback logged yet. Use the button above to record your first entry.</p>
            : (
              <>
                <p className="text-sm">No records match the current filters.</p>
                <button onClick={() => { setFilterType(''); setFilterStatus('') }}
                  className="mt-2 text-xs text-brand hover:underline">
                  Clear filters
                </button>
              </>
            )
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => (
            <FeedbackCard
              key={record.id}
              record={record}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
