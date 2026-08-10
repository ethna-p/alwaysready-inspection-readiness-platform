'use client'

/**
 * IStatementActionPanel — create, assign, and sign off action items for a
 * People's Voice "I" statement. Mirrors ActionPlanPanel for KLOEs.
 *
 * Permissions:
 *   admin  → full access: create, assign, sign off, delete
 *   user   → can create; can sign off items assigned to them
 *   viewer → read-only
 */

import { useState, useTransition } from 'react'
import {
  createIStatementAction,
  signOffIStatementAction,
  deleteIStatementAction,
} from './actions'
import type { IStatementAction } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamMember = {
  id: string
  full_name: string | null
  email: string
}

interface Props {
  statementId: string
  items: IStatementAction[]
  teamMembers: TeamMember[]
  currentUserId: string
  isAdmin: boolean
  isViewer: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: 'High',   className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    className: 'bg-blue-100 text-blue-700' },
}

function PriorityBadge({ priority }: { priority: IStatementAction['priority'] }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

// ─── Add item form ────────────────────────────────────────────────────────────

function AddActionForm({
  statementId,
  teamMembers,
  currentUserId,
  onDone,
}: {
  statementId: string
  teamMembers: TeamMember[]
  currentUserId: string
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('i_statement_id', statementId)
    startTransition(async () => {
      const result = await createIStatementAction(fd)
      if ('error' in result) { setError(result.error); return }
      onDone()
    })
  }

  const inputClass = `
    w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-card
    focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-canvas rounded-xl border border-line p-4">
      <p className="text-sm font-semibold text-ink">New action item</p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-ink-dim mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input name="title" required placeholder="e.g. Collect resident feedback on dignity" className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-dim mb-1">Description (optional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Add any additional detail…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-dim mb-1">Due date</label>
          <input name="due_date" type="date" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-dim mb-1">Priority</label>
          <select name="priority" defaultValue="medium" className={inputClass}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-dim mb-1">Assign to</label>
        <select name="assigned_to" defaultValue={currentUserId} className={inputClass}>
          <option value="">Unassigned</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name ?? m.email}{m.id === currentUserId ? ' (me)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="
            px-4 py-2 rounded-lg text-sm font-semibold text-white
            bg-[#014D4E] hover:bg-[#013636]
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
            disabled:opacity-50 transition-colors
          "
        >
          {isPending ? 'Adding…' : 'Add action'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-sm font-medium text-ink-dim hover:text-ink hover:bg-fill-dim transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Sign-off form ────────────────────────────────────────────────────────────

function SignOffForm({
  item,
  onDone,
}: {
  item: IStatementAction
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('id', item.id)
    startTransition(async () => {
      const result = await signOffIStatementAction(fd)
      if ('error' in result) { setError(result.error); return }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 bg-green-50 border border-green-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-green-800">Sign off this action</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <textarea
        name="completion_notes"
        rows={2}
        placeholder="Add completion notes (optional)…"
        className="
          w-full border border-green-200 rounded-lg px-3 py-2 text-sm text-ink bg-white
          focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none
        "
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="
            px-3 py-1.5 rounded-lg text-xs font-semibold text-white
            bg-green-600 hover:bg-green-700
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
            disabled:opacity-50 transition-colors
          "
        >
          {isPending ? 'Saving…' : 'Confirm sign-off'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-dim hover:text-ink hover:bg-fill-dim transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Single action item row ───────────────────────────────────────────────────

function ActionItemRow({
  item,
  teamMembers,
  currentUserId,
  isAdmin,
  isViewer,
}: {
  item: IStatementAction
  teamMembers: TeamMember[]
  currentUserId: string
  isAdmin: boolean
  isViewer: boolean
}) {
  const [showSignOff, setShowSignOff] = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const assignee       = teamMembers.find(m => m.id === item.assigned_to)
  const assigneeName   = assignee ? (assignee.full_name ?? assignee.email) : null
  const isAssignedToMe = item.assigned_to === currentUserId
  const canSignOff     = !isViewer && (isAdmin || isAssignedToMe)
  const overdue        = isOverdue(item.due_date)

  async function handleDelete() {
    if (!confirm('Delete this action item? This cannot be undone.')) return
    setDeleteError(null)
    const fd = new FormData()
    fd.set('id', item.id)
    startTransition(async () => {
      const result = await deleteIStatementAction(fd)
      if ('error' in result) setDeleteError(result.error)
    })
  }

  return (
    <div className="py-3 px-4 space-y-1.5">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-sm font-medium text-ink flex-1">{item.title}</span>
        <PriorityBadge priority={item.priority} />
      </div>

      {item.description && (
        <p className="text-xs text-ink-dim leading-relaxed">{item.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim">
        {item.due_date && (
          <span className={overdue ? 'text-red-600 font-medium' : ''}>
            Due {formatDate(item.due_date)}{overdue ? ' — overdue' : ''}
          </span>
        )}
        {assigneeName
          ? <span>Assigned to <span className="font-medium text-ink">{assigneeName}{isAssignedToMe ? ' (me)' : ''}</span></span>
          : <span>Unassigned</span>
        }
      </div>

      {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}

      {!isViewer && item.status !== 'completed' && (
        <div className="flex gap-2 pt-0.5">
          {canSignOff && !showSignOff && (
            <button
              type="button"
              onClick={() => setShowSignOff(true)}
              className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline focus:outline-none"
            >
              Sign off
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline focus:outline-none disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {showSignOff && (
        <SignOffForm item={item} onDone={() => setShowSignOff(false)} />
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function IStatementActionPanel({
  statementId,
  items,
  teamMembers,
  currentUserId,
  isAdmin,
  isViewer,
}: Props) {
  const [showAddForm, setShowAddForm]     = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const openItems      = items.filter(i => i.status !== 'completed')
  const completedItems = items.filter(i => i.status === 'completed')

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Action plan</p>

      {!isViewer && !showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="
            inline-flex items-center gap-1.5 text-sm font-medium
            text-[#014D4E] border border-[#014D4E] rounded-lg px-3 py-1.5
            hover:bg-[#014D4E] hover:text-white
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
            transition-colors
          "
        >
          <span aria-hidden="true">+</span> Add action item
        </button>
      )}

      {showAddForm && (
        <AddActionForm
          statementId={statementId}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {openItems.length === 0 && !showAddForm && (
        <p className="text-xs text-ink-dim">No open action items.</p>
      )}

      {openItems.length > 0 && (
        <div className="rounded-xl border border-line overflow-hidden divide-y divide-gray-100">
          {openItems.map(item => (
            <ActionItemRow
              key={item.id}
              item={item}
              teamMembers={teamMembers}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              isViewer={isViewer}
            />
          ))}
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-dim hover:text-ink transition-colors focus:outline-none"
          >
            <span aria-hidden="true">{showCompleted ? '▲' : '▼'}</span>
            {showCompleted ? 'Hide' : 'Show'} completed actions ({completedItems.length})
          </button>

          {showCompleted && (
            <div className="rounded-xl border border-line overflow-hidden divide-y divide-gray-100 bg-green-50/40">
              {completedItems.map(item => {
                const completedBy     = teamMembers.find(m => m.id === item.completed_by)
                const completedByName = completedBy ? (completedBy.full_name ?? completedBy.email) : 'Unknown'
                return (
                  <div key={item.id} className="py-3 px-4 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 text-sm mt-0.5" aria-hidden="true">✓</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-ink-dim line-through">{item.title}</p>
                        {item.completion_notes && (
                          <p className="text-xs text-ink-dim leading-relaxed">{item.completion_notes}</p>
                        )}
                        <p className="text-xs text-ink-dim">
                          Signed off by <span className="font-medium">{completedByName}</span> on {formatDate(item.completed_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
