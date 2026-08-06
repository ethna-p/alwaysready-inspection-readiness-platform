'use client'

import { useState, useTransition } from 'react'
import {
  createIncident,
  updateIncidentStatus,
  deleteIncident,
  type IncidentType,
  type IncidentStatus,
} from './incident-actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Incident = {
  id: string
  title: string
  incident_type: IncidentType
  date_of_incident: string
  description: string
  immediate_action: string | null
  people_involved: string | null
  reported_externally: boolean
  external_ref: string | null
  status: IncidentStatus
  learning_outcome: string | null
  reported_by: string | null
  reported_by_name: string | null
  closed_at: string | null
  closed_by_name: string | null
  created_at: string
}

type Props = {
  incidents: Incident[]
  currentUserId: string
  isAdmin: boolean
  isViewer: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<IncidentType, string> = {
  safety:       'Safety incident',
  safeguarding: 'Safeguarding concern',
  near_miss:    'Near miss',
  complaint:    'Complaint',
  other:        'Other',
}

const TYPE_COLOURS: Record<IncidentType, string> = {
  safety:       '#dc2626',   // red
  safeguarding: '#7c3aed',   // purple
  near_miss:    '#d97706',   // amber
  complaint:    '#2563eb',   // blue
  other:        '#6b7280',   // grey
}

const STATUS_STYLES: Record<IncidentStatus, { bg: string; text: string; label: string }> = {
  open:         { bg: '#fef2f2', text: '#dc2626', label: 'Open' },
  under_review: { bg: '#fffbeb', text: '#d97706', label: 'Under review' },
  closed:       { bg: '#f0fdf4', text: '#16a34a', label: 'Closed' },
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Log form ──────────────────────────────────────────────────────────────────

function LogIncidentForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)
  const [reportedExternally, setReportedExternally] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('reported_externally', reportedExternally ? 'true' : 'false')
    startTransition(async () => {
      const result = await createIncident(fd)
      if (result.error) { setError(result.error); return }
      onDone()
    })
  }

  const input = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  const label = 'block text-xs font-semibold text-ink-dim mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={label}>Incident title *</label>
          <input name="title" required className={input} placeholder="Brief description of what happened" />
        </div>

        <div>
          <label className={label}>Type *</label>
          <select name="incident_type" required className={input}>
            <option value="">Select type…</option>
            {(Object.entries(TYPE_LABELS) as [IncidentType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Date of incident *</label>
          <input name="date_of_incident" type="date" required className={input}
            max={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Description *</label>
          <textarea name="description" required rows={4} className={input}
            placeholder="What happened? Include relevant context and any contributing factors." />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Immediate action taken</label>
          <textarea name="immediate_action" rows={2} className={input}
            placeholder="What was done straight away in response?" />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>People involved</label>
          <input name="people_involved" className={input}
            placeholder="Roles or initials only — avoid recording full names here" />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reportedExternally}
              onChange={e => setReportedExternally(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand"
            />
            <span className="text-sm text-ink">Reported externally (CQC / local authority / other)</span>
          </label>
        </div>

        {reportedExternally && (
          <div className="sm:col-span-2">
            <label className={label}>External reference number</label>
            <input name="external_ref" className={input} placeholder="e.g. CQC ref or LA case number" />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Log incident'}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 text-sm font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Close/review form ─────────────────────────────────────────────────────────

function CloseIncidentForm({
  incidentId,
  currentStatus,
  onDone,
}: {
  incidentId: string
  currentStatus: IncidentStatus
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)
  const [action, setAction]        = useState<'under_review' | 'closed'>(
    currentStatus === 'open' ? 'under_review' : 'closed'
  )
  const [learning, setLearning] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (action === 'closed' && !learning.trim()) {
      setError('A learning outcome is required before closing.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateIncidentStatus(incidentId, action, learning)
      if (result.error) { setError(result.error); return }
      onDone()
    })
  }

  const input = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-line pt-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-3">
        {currentStatus === 'open' && (
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" checked={action === 'under_review'} onChange={() => setAction('under_review')} />
            Mark as under review
          </label>
        )}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" checked={action === 'closed'} onChange={() => setAction('closed')} />
          Close incident
        </label>
      </div>
      {action === 'closed' && (
        <div>
          <label className="block text-xs font-semibold text-ink-dim mb-1">Learning outcome *</label>
          <textarea value={learning} onChange={e => setLearning(e.target.value)}
            rows={3} className={input}
            placeholder="What has the service learned? What changes have been or will be made?" />
        </div>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50">
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDone}
          className="px-3 py-1.5 text-xs font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Incident card ─────────────────────────────────────────────────────────────

function IncidentCard({
  incident,
  isAdmin,
  currentUserId,
}: {
  incident: Incident
  isAdmin: boolean
  currentUserId: string
}) {
  const [expanded, setExpanded]       = useState(false)
  const [showClose, setShowClose]     = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [pending, startTransition]    = useTransition()

  const status  = STATUS_STYLES[incident.status]
  const canEdit = isAdmin || (incident.reported_by === currentUserId && incident.status !== 'closed')

  function handleDelete() {
    startTransition(async () => {
      await deleteIncident(incident.id)
    })
  }

  return (
    <div className="bg-card border border-line rounded-xl shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-fill-dim transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {/* Type colour strip */}
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: TYPE_COLOURS[incident.incident_type] }} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{incident.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: status.bg, color: status.text }}>
              {status.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-dim">
            <span>{TYPE_LABELS[incident.incident_type]}</span>
            <span>{formatDate(incident.date_of_incident)}</span>
            {incident.reported_by_name && <span>Logged by {incident.reported_by_name}</span>}
            {incident.reported_externally && (
              <span className="text-purple-600 font-medium">Reported externally</span>
            )}
          </div>
        </div>

        <span className="text-ink-dim text-xs shrink-0 mt-0.5">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-line pt-4">

          <div>
            <p className="text-xs font-semibold text-ink-dim mb-1">Description</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{incident.description}</p>
          </div>

          {incident.immediate_action && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Immediate action taken</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{incident.immediate_action}</p>
            </div>
          )}

          {incident.people_involved && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">People involved</p>
              <p className="text-sm text-ink">{incident.people_involved}</p>
            </div>
          )}

          {incident.reported_externally && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">External report</p>
              <p className="text-sm text-ink">
                Reported externally
                {incident.external_ref && <> — ref: <strong>{incident.external_ref}</strong></>}
              </p>
            </div>
          )}

          {incident.status === 'closed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 mb-1">Learning outcome</p>
              <p className="text-sm text-green-900 whitespace-pre-wrap">
                {incident.learning_outcome ?? 'No learning outcome recorded.'}
              </p>
              {incident.closed_at && (
                <p className="text-xs text-green-700 mt-1">
                  Closed {formatDate(incident.closed_at)}
                  {incident.closed_by_name && <> by {incident.closed_by_name}</>}
                </p>
              )}
            </div>
          )}

          {/* Admin actions */}
          {canEdit && incident.status !== 'closed' && !showClose && (
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowClose(true)}
                className="text-xs font-semibold text-brand hover:underline">
                {isAdmin ? 'Review / close' : 'Edit'}
              </button>
              {isAdmin && (
                <button onClick={() => setShowDelete(true)}
                  className="text-xs font-semibold text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </div>
          )}

          {showClose && isAdmin && (
            <CloseIncidentForm
              incidentId={incident.id}
              currentStatus={incident.status}
              onDone={() => setShowClose(false)}
            />
          )}

          {showDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">Delete this incident record?</p>
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
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const FILTER_STATUS: { value: '' | IncidentStatus; label: string }[] = [
  { value: '',             label: 'All' },
  { value: 'open',         label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'closed',       label: 'Closed' },
]

const FILTER_TYPE: { value: '' | IncidentType; label: string }[] = [
  { value: '',             label: 'All types' },
  { value: 'safety',       label: 'Safety' },
  { value: 'safeguarding', label: 'Safeguarding' },
  { value: 'near_miss',    label: 'Near miss' },
  { value: 'complaint',    label: 'Complaint' },
  { value: 'other',        label: 'Other' },
]

export default function IncidentsClient({ incidents, currentUserId, isAdmin, isViewer }: Props) {
  const [showForm, setShowForm]               = useState(false)
  const [filterStatus, setFilterStatus]       = useState<'' | IncidentStatus>('')
  const [filterType, setFilterType]           = useState<'' | IncidentType>('')

  const filtered = incidents.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false
    if (filterType   && i.incident_type !== filterType) return false
    return true
  })

  const hasFilters = filterStatus !== '' || filterType !== ''

  const select = 'border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'

  // Summary counts
  const openCount   = incidents.filter(i => i.status === 'open').length
  const reviewCount = incidents.filter(i => i.status === 'under_review').length

  return (
    <div className="space-y-6">

      {/* Summary pills */}
      {incidents.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {openCount > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-50 text-red-700">
              {openCount} open
            </span>
          )}
          {reviewCount > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-amber-50 text-amber-700">
              {reviewCount} under review
            </span>
          )}
          {openCount === 0 && reviewCount === 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-50 text-green-700">
              All incidents closed ✓
            </span>
          )}
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as '' | IncidentStatus)} className={select}>
          {FILTER_STATUS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as '' | IncidentType)} className={select}>
          {FILTER_TYPE.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterStatus(''); setFilterType('') }}
            className="text-xs text-ink-dim hover:text-ink underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-ink-dim ml-auto">
          {filtered.length} of {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
        </span>
        {!isViewer && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90"
          >
            + Log incident
          </button>
        )}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-brand mb-4">Log a new incident</h2>
          <LogIncidentForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-dim">
          {incidents.length === 0
            ? <p className="text-sm">No incidents logged yet.</p>
            : (
              <>
                <p className="text-sm">No incidents match the current filters.</p>
                <button onClick={() => { setFilterStatus(''); setFilterType('') }}
                  className="mt-2 text-xs text-brand hover:underline">
                  Clear filters
                </button>
              </>
            )
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
