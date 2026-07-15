/**
 * /dashboard/support/new — submit a new support ticket.
 */
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitTicket, type SubmitTicketState } from './actions'

export default function NewTicketPage() {
  const [state, action, pending] = useActionState<SubmitTicketState, FormData>(
    submitTicket,
    { status: 'idle' }
  )

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/support" className="hover:text-[#014D4E] underline">Support</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">New ticket</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-[#014D4E] mb-2">Get in touch</h1>
      <p className="text-sm text-[#1a1a1a] mb-8">
        We aim to respond within one business day. You can track your ticket here once it&apos;s submitted.
      </p>

      {state.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="subject">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. I can't update my KLOE status"
            className="
              w-full border border-gray-300 rounded-lg
              px-4 py-2.5 text-sm text-[#1a1a1a]
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="message">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={7}
            placeholder="Please describe what you need help with, including any steps you've already tried."
            className="
              w-full border border-gray-300 rounded-lg
              px-4 py-2.5 text-sm text-[#1a1a1a]
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
              border border-gray-300 text-sm font-medium text-[#1a1a1a]
              px-6 py-2.5 rounded-lg
              hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              transition-colors
            "
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
