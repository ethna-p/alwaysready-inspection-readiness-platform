/**
 * StaffReplyForm — client component for the superadmin ticket reply UI.
 * Needs to be a client component to use useActionState.
 */
'use client'

import { useActionState } from 'react'
import { staffReply, updateTicketStatus, type ReplyState } from './actions'

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
]

interface Props {
  ticketId: string
  currentStatus: string
}

export default function StaffReplyForm({ ticketId, currentStatus }: Props) {
  // Bind ticketId into the reply action
  const boundReply = staffReply.bind(null, ticketId)
  const [state, action, pending] = useActionState<ReplyState, FormData>(
    boundReply,
    { status: 'idle' }
  )

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Update status</p>
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
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1a1a1a]'
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
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Reply to customer</p>

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
            placeholder="Type your reply here…"
            className="
              w-full bg-white border border-gray-300 rounded-lg
              px-4 py-3 text-sm text-[#1a1a1a] placeholder-gray-400
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
