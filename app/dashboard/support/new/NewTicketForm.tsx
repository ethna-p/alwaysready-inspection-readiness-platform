'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitTicket, type SubmitTicketState } from './actions'

export default function NewTicketForm({
  defaultSubject,
  messagePlaceholder,
}: {
  defaultSubject: string
  messagePlaceholder: string
}) {
  const [state, action, pending] = useActionState<SubmitTicketState, FormData>(
    submitTicket,
    { status: 'idle' }
  )

  return (
    <>
      {state.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="subject">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            defaultValue={defaultSubject}
            placeholder="e.g. I can't update my KLOE status"
            className="
              w-full border border-line rounded-lg
              px-4 py-2.5 text-sm text-ink
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="message">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={7}
            placeholder={messagePlaceholder}
            className="
              w-full border border-line rounded-lg
              px-4 py-2.5 text-sm text-ink
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              resize-y
            "
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="
              bg-[#014D4E] text-white font-semibold text-sm
              px-6 py-2.5 rounded-lg
              hover:bg-[#013636]
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {pending ? 'Submitting…' : 'Submit ticket'}
          </button>
          <Link
            href="/dashboard/support"
            className="
              border border-line text-sm font-medium text-ink
              px-6 py-2.5 rounded-lg
              hover:bg-fill
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              transition-colors
            "
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
