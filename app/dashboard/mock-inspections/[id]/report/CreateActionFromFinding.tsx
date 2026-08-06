'use client'

import { useState, useTransition } from 'react'
import { createActionItem } from '@/app/dashboard/kloes/[kloId]/action-plan-actions'

type TeamMember = { id: string; name: string }

type Props = {
  kloItemId: string
  kloTitle: string
  suggestedAction: string
  teamMembers: TeamMember[]
}

export default function CreateActionFromFinding({
  kloItemId,
  kloTitle,
  suggestedAction,
  teamMembers,
}: Props) {
  const [open, setOpen]         = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('klo_item_id', kloItemId)
    startTransition(async () => {
      const result = await createActionItem(fd)
      if (!result.success) { setError(result.error); return }
      setDone(true)
      setOpen(false)
    })
  }

  if (done) {
    return (
      <span className="text-xs font-semibold text-green-700">
        ✓ Action item created
      </span>
    )
  }

  const input = 'w-full border border-line rounded-lg px-3 py-1.5 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand'
  const label = 'block text-xs font-semibold text-ink-dim mb-1'

  return (
    <div className="mt-3 print:hidden">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-brand hover:underline"
        >
          + Create action item
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-1 bg-white border border-brand/30 rounded-lg p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-brand">New action item — {kloTitle}</p>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div>
            <label className={label}>Title *</label>
            <input
              name="title"
              required
              defaultValue={`Address findings: ${kloTitle}`}
              className={input}
            />
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={suggestedAction}
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Priority</label>
              <select name="priority" className={input} defaultValue="high">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className={label}>Due date</label>
              <input name="due_date" type="date" className={input} />
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div>
              <label className={label}>Assign to</label>
              <select name="assigned_to" className={input} defaultValue="">
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Create action item'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="px-3 py-1.5 text-xs font-medium text-ink-dim border border-line rounded-lg hover:bg-fill-dim"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
