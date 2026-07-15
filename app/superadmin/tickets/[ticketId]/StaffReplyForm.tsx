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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
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
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Reply to customer</p>

        {state.status === 'error' && (
          <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 text-sm text-red-300 mb-4">
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
              w-full bg-gray-800 border border-gray-700 rounded-lg
              px-4 py-3 text-sm text-white placeholder-gray-500
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
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2 focus:ring-offset-gray-900
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
