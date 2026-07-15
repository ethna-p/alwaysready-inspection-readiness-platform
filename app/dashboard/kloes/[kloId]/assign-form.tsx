'use client'

/**
 * AssignForm — lets an admin assign (or unassign) a KLOE to a team member.
 *
 * Shown only to admins; hidden from users and viewers.
 * Uses the assignKloe server action.
 */

import { useActionState } from 'react'
import { assignKloe } from '../actions'
import type { ActionState } from '../actions'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Props {
  kloItemId: string
  currentAssignedTo: string | null
  teamMembers: TeamMember[]
}

export default function AssignForm({ kloItemId, currentAssignedTo, teamMembers }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    assignKloe,
    null
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="klo_item_id" value={kloItemId} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="assigned_to" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Assigned to
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            defaultValue={currentAssignedTo ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
          >
            <option value="">— Unassigned —</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? m.email}{m.role === 'admin' ? ' (Admin)' : ''}
              </option>
            ))}
          </select>
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
            transition-colors whitespace-nowrap
          "
        >
          {isPending ? 'Saving…' : 'Save assignment'}
        </button>
      </div>

      {state && (
        <div
          role="alert"
          aria-live="polite"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {state.success ? state.message : state.error}
        </div>
      )}
    </form>
  )
}
