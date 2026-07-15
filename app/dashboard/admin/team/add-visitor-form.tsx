'use client'

/**
 * AddVisitorForm — creates a time-limited visitor (viewer) login.
 *
 * The admin enters a name and how many days access to grant.
 * On success, shows the username + temporary password to hand over.
 */

import { useActionState } from 'react'
import { createVisitorLogin } from './actions'
import type { TeamActionState } from './actions'

export default function AddVisitorForm() {
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    createVisitorLogin,
    null
  )

  if (state?.success && state.credentials) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          {state.message}
        </div>

        <div className="bg-[#faf9f6] border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-[#014D4E] uppercase tracking-wide">
            Login credentials — share these now
          </p>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Login ID</p>
            <p
              className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 select-all cursor-text"
              onClick={e => {
                const range = document.createRange()
                range.selectNodeContents(e.currentTarget)
                window.getSelection()?.removeAllRanges()
                window.getSelection()?.addRange(range)
              }}
            >
              {state.credentials.username}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Temporary password</p>
            <p
              className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 select-all cursor-text"
              onClick={e => {
                const range = document.createRange()
                range.selectNodeContents(e.currentTarget)
                window.getSelection()?.removeAllRanges()
                window.getSelection()?.addRange(range)
              }}
            >
              {state.credentials.password}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Click either field to select all. These credentials will not be shown again.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
        >
          Create another visitor login →
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
          <label htmlFor="visitor_full_name" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Visitor name
          </label>
          <input
            id="visitor_full_name"
            name="full_name"
            type="text"
            required
            placeholder="e.g. Sarah Thompson"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
        </div>

        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium text-[#1a1a1a] mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Login will stop working automatically after this many days.
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
        {isPending ? 'Creating…' : 'Create visitor login'}
      </button>
    </form>
  )
}
