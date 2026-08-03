'use client'

/**
 * AddMemberForm — invite a team member by email.
 *
 * Supabase sends the invite email; the recipient clicks through, sets
 * their own password on the /account/setup page, and is then active.
 */

import { useActionState } from 'react'
import { inviteTeamMember } from './team-actions'
import type { TeamActionState } from './team-actions'

const ROLE_OPTIONS = [
  { value: 'user',  label: 'User — can edit their assigned KLOEs' },
  { value: 'admin', label: 'Admin — full access (recommended for Registered Manager only)' },
]

const inputClass = `
  w-full border border-line rounded-lg px-3 py-2
  text-sm text-ink placeholder:text-ink-muted
  focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
  bg-card
`

export default function AddMemberForm() {
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    inviteTeamMember,
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
          className="mt-4 text-sm font-medium text-brand hover:underline"
        >
          ← Invite another team member
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-ink mb-1">
          Full name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          autoComplete="off"
          placeholder="e.g. Sarah Jones"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="e.g. sarah@example.com"
          className={inputClass}
        />
        <p className="text-sm text-ink-muted mt-1">
          The invite link will be sent to this address. It becomes their login email.
        </p>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-ink mb-1">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="user"
          className={inputClass}
        >
          {ROLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {state && !state.success && (
        <div role="alert" className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="
          bg-[#014D4E] text-white text-sm font-medium
          px-5 py-2.5 rounded-lg
          hover:bg-[#013838]
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isPending ? 'Sending invite…' : 'Send invite'}
      </button>
    </form>
  )
}
