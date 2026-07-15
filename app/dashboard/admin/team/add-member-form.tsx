'use client'

/**
 * AddMemberForm — admin creates a new staff account.
 *
 * On success, displays the generated username + temporary password
 * so the admin can hand credentials to the staff member directly.
 */

import { useActionState } from 'react'
import { createTeamMember } from './actions'
import type { TeamActionState } from './actions'

const ROLE_OPTIONS = [
  { value: 'user',  label: 'User — can edit their assigned KLOEs' },
  { value: 'admin', label: 'Admin — full access, can assign KLOEs and manage team' },
]

export default function AddMemberForm() {
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    createTeamMember,
    null
  )

  // After success, show credentials prominently
  if (state?.success && state.credentials?.username) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h3 className="font-semibold text-green-900 mb-1">{state.message}</h3>
        <p className="text-sm text-green-800 mb-4">
          Give these credentials to the team member. The password cannot be shown again — if lost, use Reset Password.
        </p>
        <dl className="space-y-3">
          <div className="bg-white rounded-lg border border-green-200 px-4 py-3">
            <dt className="text-xs text-gray-500 mb-1">Login ID (username)</dt>
            <dd className="font-mono text-sm font-semibold text-[#014D4E] select-all">
              {state.credentials.username}
            </dd>
          </div>
          <div className="bg-white rounded-lg border border-green-200 px-4 py-3">
            <dt className="text-xs text-gray-500 mb-1">Temporary password</dt>
            <dd className="font-mono text-sm font-semibold text-[#014D4E] select-all">
              {state.credentials.password}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-gray-500 mt-3">
          Staff log in at the AlwaysReady login page using their Login ID and this password.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-medium text-[#014D4E] hover:underline"
        >
          ← Add another team member
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-[#1a1a1a] mb-1">
          Full name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          placeholder="e.g. Sarah Jones"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Used to generate their login ID and shown in the audit trail.
        </p>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-[#1a1a1a] mb-1">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="user"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
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
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
