'use client'

/**
 * MemberRow — a single team member row with inline role change and MFA reset.
 * (Team members reset their own password from the login page with "Forgot your password?".)
 */

import { useActionState } from 'react'
import { resetTeamMemberMfa, changeTeamMemberRole } from './team-actions'
import type { TeamActionState } from './team-actions'

const ROLE_LABELS: Record<string, string> = {
  admin:  'Admin',
  user:   'User',
  viewer: 'Viewer',
}

interface Props {
  member: {
    id: string
    full_name: string | null
    email: string
    role: string
  }
  isSelf: boolean
}

export default function MemberRow({ member, isSelf }: Props) {
  const [roleState, roleAction, rolePending] = useActionState<TeamActionState, FormData>(
    changeTeamMemberRole,
    null
  )
  const [mfaState, mfaAction, mfaPending] = useActionState<TeamActionState, FormData>(
    resetTeamMemberMfa,
    null
  )

  const displayName = member.full_name ?? member.email

  return (
    <tr className="hover:bg-canvas transition-colors align-top">
      {/* Name */}
      <td className="px-4 py-4">
        <p className="font-medium text-ink">
          {displayName}
          {isSelf && (
            <span className="ml-2 text-xs bg-[#014D4E] text-white px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </p>
        <p className="text-xs text-ink-dim mt-0.5">{member.email}</p>
      </td>

      {/* Role */}
      <td className="px-4 py-4">
        {isSelf ? (
          <span className="text-sm text-ink">{ROLE_LABELS[member.role] ?? member.role}</span>
        ) : (
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="user_id" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              disabled={rolePending}
              className="border border-line rounded-lg px-2 py-1.5 text-sm bg-card text-ink focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={rolePending}
              className="text-xs text-brand font-medium hover:underline disabled:opacity-50"
            >
              {rolePending ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
        {roleState && (
          <p className={`text-xs mt-1 ${roleState.success ? 'text-green-700' : 'text-red-600'}`}>
            {roleState.success ? roleState.message : roleState.error}
          </p>
        )}
      </td>

      {/* MFA reset — recovery path for a teammate locked out of a lost
          authenticator device; see team-actions.ts's own doc comment. */}
      <td className="px-4 py-4">
        {isSelf ? (
          <span className="text-xs text-ink-dim">—</span>
        ) : (
          <>
            <form action={mfaAction}>
              <input type="hidden" name="user_id" value={member.id} />
              <input type="hidden" name="full_name" value={displayName} />
              <button
                type="submit"
                disabled={mfaPending}
                className="text-xs text-brand font-medium hover:underline disabled:opacity-50"
              >
                {mfaPending ? 'Resetting…' : 'Reset MFA'}
              </button>
            </form>
            {mfaState && (
              <p className={`text-xs mt-1 ${mfaState.success ? 'text-green-700' : 'text-red-600'}`}>
                {mfaState.success ? mfaState.message : mfaState.error}
              </p>
            )}
          </>
        )}
      </td>
    </tr>
  )
}
