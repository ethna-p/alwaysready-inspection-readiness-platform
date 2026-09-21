'use client'

/**
 * AddVisitorForm — creates a time-limited visitor (viewer) login.
 *
 * The admin enters a name, real email address, and how many days access to grant.
 * The visitor is emailed a link to set their own password (same as a team invite);
 * the admin never sees a credential.
 */

import { useActionState } from 'react'
import { createVisitorLogin } from './team-actions'
import type { TeamActionState } from './team-actions'

export default function AddVisitorForm() {
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    createVisitorLogin,
    null
  )

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="font-semibold text-green-900 mb-1">Invitation sent</p>
        <p className="text-sm text-green-800">{state.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
        >
          ← Invite another visitor
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.success && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="visitor_full_name" className="block text-sm font-medium text-ink mb-1">
            Visitor name
          </label>
          <input
            id="visitor_full_name"
            name="full_name"
            type="text"
            required
            placeholder="e.g. Sarah Thompson"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-card text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
        </div>

        <div>
          <label htmlFor="visitor_email" className="block text-sm font-medium text-ink mb-1">
            Email address
          </label>
          <input
            id="visitor_email"
            name="email"
            type="email"
            required
            placeholder="e.g. sarah@example.com"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-card text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
        </div>

        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium text-ink mb-1">
            Access duration (days)
          </label>
          <input
            id="duration_days"
            name="duration_days"
            type="number"
            required
            min={1}
            max={365}
            placeholder="e.g. 7"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-card text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
          <p className="text-sm text-ink-dim mt-1">
            Access stops working automatically this many days after you send the invite.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="
          bg-[#014D4E] text-white text-sm font-medium
          px-4 py-2 rounded-lg
          hover:bg-[#013838]
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isPending ? 'Sending…' : 'Send visitor invite'}
      </button>
    </form>
  )
}
