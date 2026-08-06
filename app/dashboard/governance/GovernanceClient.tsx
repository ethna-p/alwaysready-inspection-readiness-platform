'use client'

import { useState, useTransition } from 'react'
import {
  createMeeting,
  updateMeeting,
  signOffMeeting,
  deleteMeeting,
  type MeetingStatus,
} from './governance-actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GovernanceMeeting = {
  id: string
  title: string
  meeting_date: string
  attendees: string | null
  agenda: string | null
  key_decisions: string | null
  actions_arising: string | null
  status: MeetingStatus
  signed_off_by_name: string | null
  signed_off_at: string | null
  created_by: string | null
  created_at: string
}

type Props = {
  meetings: GovernanceMeeting[]
  isAdmin: boolean
  isViewer: boolean
  currentUserId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function toInputDate(iso: string): string {
  return iso.split('T')[0]
}

// ── Shared form fields ────────────────────────────────────────────────────────

function MeetingForm({
  defaults,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaults?: Partial<GovernanceMeeting>
  onSubmit: (fd: FormData) => Promise<{ error?: string }>
  onCancel: () => void
  submitLabel: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await onSubmit(fd)
      if (result.error) setError(result.error)
    })
  }

  const input    = 'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  const textarea = `${input} resize-y`
  const label    = 'block text-xs font-semibold text-ink-dim mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={label}>Meeting title *</label>
          <input name="title" required defaultValue={defaults?.title ?? ''}
            placeholder="e.g. Monthly Quality Assurance Meeting"
            className={input} />
        </div>

        <div>
          <label className={label}>Date *</label>
          <input name="meeting_date" type="date" required
            defaultValue={defaults?.meeting_date ? toInputDate(defaults.meeting_date) : ''}
            max={new Date().toISOString().split('T')[0]}
            className={input} />
        </div>

        <div>
          <label className={label}>Attendees</label>
          <input name="attendees" defaultValue={defaults?.attendees ?? ''}
            placeholder="Names and roles present"
            className={input} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Agenda</label>
          <textarea name="agenda" rows={3} defaultValue={defaults?.agenda ?? ''}
            placeholder="Items discussed at the meeting…"
            className={textarea} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Key decisions</label>
          <textarea name="key_decisions" rows={3} defaultValue={defaults?.key_decisions ?? ''}
            placeholder="Decisions made and outcomes agreed…"
            className={textarea} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Actions arising</label>
          <textarea name="actions_arising" rows={3} defaultValue={defaults?.actions_arising ?? ''}
            placeholder="Follow-up actions agreed, and who is responsible…"
            className={textarea} />
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

// ── Meeting card ──────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  isAdmin,
  currentUserId,
}: {
  meeting: GovernanceMeeting
  isAdmin: boolean
  currentUserId: string
}) {
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSignOff, setShowSignOff] = useState(false)
  const [pending, startTransition]  = useTransition()

  const isSigned  = meeting.status === 'signed_off'
  const canEdit   = !isSigned && (isAdmin || meeting.created_by === currentUserId)

  function handleSignOff() {
    startTransition(async () => {
      await signOffMeeting(meeting.id)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMeeting(meeting.id)
    })
  }

  return (
    <div className="bg-card border border-line rounded-xl shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-fill-dim transition-colors"
        onClick={() => { setExpanded(e => !e); setEditing(false) }}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{meeting.title}</span>
            {isSigned ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-700">
                Signed off
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700">
                Draft
              </span>
            )}
          </div>
          <p className="text-xs text-ink-dim">
            {formatDate(meeting.meeting_date)}
            {meeting.attendees && <> · {meeting.attendees}</>}
          </p>
        </div>
        <span className="text-ink-dim text-xs shrink-0 mt-0.5">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && !editing && (
        <div className="px-5 pb-5 border-t border-line pt-4 space-y-4">

          {meeting.agenda && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Agenda</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{meeting.agenda}</p>
            </div>
          )}

          {meeting.key_decisions && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Key decisions</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{meeting.key_decisions}</p>
            </div>
          )}

          {meeting.actions_arising && (
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1">Actions arising</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{meeting.actions_arising}</p>
            </div>
          )}

          {isSigned && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
              Signed off {formatDate(meeting.signed_off_at)}
              {meeting.signed_off_by_name && <> by {meeting.signed_off_by_name}</>}
            </div>
          )}

          {/* Actions */}
          {(canEdit || (isAdmin && !isSigned)) && !showDelete && !showSignOff && (
            <div className="flex flex-wrap gap-3 pt-1">
              {canEdit && (
                <button onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-brand hover:underline">
                  Edit
                </button>
              )}
              {isAdmin && !isSigned && (
                <button onClick={() => setShowSignOff(true)}
                  className="text-xs font-semibold text-green-700 hover:underline">
                  Sign off
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

          {showSignOff && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold mb-2">Sign off this meeting record?</p>
              <p className="text-xs mb-3">This confirms the record is accurate and complete. It cannot be edited after signing off.</p>
              <div className="flex gap-3">
                <button onClick={handleSignOff} disabled={pending}
                  className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50">
                  {pending ? 'Signing off…' : 'Yes, sign off'}
                </button>
                <button onClick={() => setShowSignOff(false)}
                  className="px-3 py-1.5 text-xs font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">Delete this meeting record?</p>
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
          <MeetingForm
            defaults={meeting}
            onSubmit={fd => updateMeeting(meeting.id, fd)}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GovernanceClient({ meetings, isAdmin, isViewer, currentUserId }: Props) {
  const [showForm, setShowForm]         = useState(false)
  const [filterStatus, setFilterStatus] = useState<'' | MeetingStatus>('')

  const filtered = meetings.filter(m => !filterStatus || m.status === filterStatus)
  const hasFilters = filterStatus !== ''

  const draftCount    = meetings.filter(m => m.status === 'draft').length
  const signedCount   = meetings.filter(m => m.status === 'signed_off').length

  const select = 'border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <div className="space-y-6">

      {/* Summary pills */}
      {meetings.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {draftCount > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-amber-50 text-amber-700">
              {draftCount} draft{draftCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-50 text-green-700">
            {signedCount} signed off
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as '' | MeetingStatus)} className={select}>
          <option value="">All meetings</option>
          <option value="draft">Drafts only</option>
          <option value="signed_off">Signed off only</option>
        </select>
        {hasFilters && (
          <button onClick={() => setFilterStatus('')}
            className="text-xs text-ink-dim hover:text-ink underline">
            Clear filter
          </button>
        )}
        <span className="text-xs text-ink-dim ml-auto">
          {filtered.length} of {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </span>
        {!isViewer && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90">
            + Record meeting
          </button>
        )}
      </div>

      {/* New meeting form */}
      {showForm && (
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-brand mb-4">Record a governance meeting</h2>
          <MeetingForm
            onSubmit={async fd => {
              const result = await createMeeting(fd)
              if (!result.error) setShowForm(false)
              return result
            }}
            onCancel={() => setShowForm(false)}
            submitLabel="Save meeting record"
          />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-dim">
          {meetings.length === 0
            ? <p className="text-sm">No governance meetings recorded yet.</p>
            : (
              <>
                <p className="text-sm">No meetings match the current filter.</p>
                <button onClick={() => setFilterStatus('')}
                  className="mt-2 text-xs text-brand hover:underline">
                  Clear filter
                </button>
              </>
            )
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(meeting => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
