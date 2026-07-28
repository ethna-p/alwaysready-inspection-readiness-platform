/**
 * StaffReplyForm — client component for the superadmin ticket reply UI.
 * Needs to be a client component to use useActionState.
 */
'use client'

import { useActionState, useState } from 'react'
import { staffReply, updateTicketStatus, regenerateDraft, type ReplyState } from './actions'

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
]

interface Props {
  ticketId: string
  currentStatus: string
  draftReply?: string | null
}

export default function StaffReplyForm({ ticketId, currentStatus, draftReply }: Props) {
  // Bind ticketId into the reply action
  const boundReply = staffReply.bind(null, ticketId)
  const [state, action, pending] = useActionState<ReplyState, FormData>(
    boundReply,
    { status: 'idle' }
  )

  // Pre-fill from AI draft; user can edit freely
  const [message, setMessage] = useState(draftReply ?? '')

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="bg-card border border-line rounded-xl p-4">
        <p className="text-xs text-ink-muted uppercase tracking-wide mb-3">Update status</p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <form key={opt.value} action={updateTicketStatus.bind(null, ticketId, opt.value)}>
              <button
                type="submit"
                disabled={opt.value === currentStatus}
                className={`
                  text-xs font-semibold px-3 py-1.5 rounded-lg
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                  ${opt.value === currentStatus
                    ? 'bg-[#00b8a6] text-white cursor-default'
                    : 'bg-fill-dim text-ink-muted hover:bg-fill-dim hover:text-ink'
                  }
                `}
              >
                {opt.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Reply form */}
      <div className="bg-card border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-ink-muted uppercase tracking-wide">Reply to customer</p>
          {draftReply && (
            <form action={regenerateDraft.bind(null, ticketId)}>
              <button
                type="submit"
                className="text-xs text-[#00b8a6] hover:text-[#009d8e] font-medium transition-colors"
              >
                ↺ Regenerate AI draft
              </button>
            </form>
          )}
        </div>

        {draftReply && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-ink-muted">AI suggested · edit before sending</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-700 mb-4">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <textarea
            name="message"
            required
            rows={6}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your reply here…"
            className="
              w-full bg-card border border-line rounded-lg
              px-4 py-3 text-sm text-ink placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              resize-y
            "
          />
          <button
            type="submit"
            disabled={pending}
            className="
              bg-[#00b8a6] text-white font-semibold text-sm
              px-5 py-2.5 rounded-lg
              hover:bg-[#009d8e]
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2 focus:ring-offset-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {pending ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      </div>
    </div>
  )
}
