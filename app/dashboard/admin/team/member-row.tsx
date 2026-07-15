'use client'

/**
 * MemberRow — a single team member row with inline role change and password reset.
 */

import { useActionState } from 'react'
import { resetTeamMemberPassword, changeTeamMemberRole } from './actions'
import type { TeamActionState } from './actions'

const ROLE_LABELS: Record<string, string> = {
  admin:  'Admin',
  user:   'User',
  viewer: 'Viewer',
}

interface Props {
  member: {
    id: string
    full_name: string | null
    username: string | null
    email: string
    role: string
  }
  isSelf: boolean
}

export default function MemberRow({ member, isSelf }: Props) {
  const [resetState, resetAction, resetPending] = useActionState<TeamActionState, FormData>(
    resetTeamMemberPassword,
    null
  )
  const [roleState, roleAction, rolePending] = useActionState<TeamActionState, FormData>(
    changeTeamMemberRole,
    null
  )

  const displayName = member.full_name ?? member.email
  const isStaffAccount = member.email.endsWith('@staff.alwaysready.uk')

  return (
    <tr className="hover:bg-[#faf9f6] transition-colors align-top">
      {/* Name */}
      <td className="px-4 py-4">
        <p className="font-medium text-[#1a1a1a]">
          {displayName}
          {isSelf && (
            <span className="ml-2 text-xs bg-[#014D4E] text-white px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </p>
        {member.username && (
          <p className="text-xs text-gray-600 mt-0.5 font-mono">{member.username}</p>
        )}
        {!isStaffAccount && (
          <p className="text-xs text-gray-600 mt-0.5">{member.email}</p>
        )}
      </td>

      {/* Role */}
      <td className="px-4 py-4">
        {isSelf ? (
          <span className="text-sm text-[#1a1a1a]">{ROLE_LABELS[member.role] ?? member.role}</span>
        ) : (
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="user_id" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              disabled={rolePending}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={rolePending}
              className="text-xs text-[#014D4E] font-medium hover:underline disabled:opacity-50"
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

      {/* Password reset */}
      <td className="px-4 py-4">
        {isSelf ? (
          <span className="text-xs text-gray-600">—</span>
        ) : (
          <>
            <form action={resetAction}>
              <input type="hidden" name="user_id" value={member.id} />
              <input type="hidden" name="full_name" value={displayName} />
              <button
                type="submit"
                disabled={resetPending}
                className="text-xs text-[#014D4E] font-medium hover:underline disabled:opacity-50"
              >
                {resetPending ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
            {resetState?.success && resetState.credentials?.password && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800 font-medium mb-1">New temporary password:</p>
                <p className="font-mono text-sm text-[#014D4E] font-semibold select-all">
                  {resetState.credentials.password}
                </p>
                <p className="text-xs text-gray-600 mt-1">Give this to {displayName} directly.</p>
              </div>
            )}
            {resetState && !resetState.success && (
              <p className="text-xs text-red-600 mt-1">{resetState.error}</p>
            )}
          </>
        )}
      </td>
    </tr>
  )
}
