'use client'

/**
 * VisitorRow — displays a single visitor (viewer) login in the team page table.
 * Shows name, login ID, expiry, and a Revoke button.
 */

import { useActionState } from 'react'
import { revokeVisitorLogin } from './actions'
import type { TeamActionState } from './actions'

interface Visitor {
  id: string
  full_name: string | null
  username: string | null
  email: string
  viewer_expires_at: string | null
}

interface Props {
  visitor: Visitor
}

function formatExpiry(iso: string | null): { label: string; isExpired: boolean; isExpiringSoon: boolean } {
  if (!iso) return { label: '—', isExpired: false, isExpiringSoon: false }
  const expiry = new Date(iso)
  const now    = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const label = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (diffMs < 0) return { label: `${label} (expired)`, isExpired: true, isExpiringSoon: false }
  if (diffDays <= 2) return { label: `${label} (${diffDays}d left)`, isExpired: false, isExpiringSoon: true }
  return { label, isExpired: false, isExpiringSoon: false }
}

export default function VisitorRow({ visitor }: Props) {
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    revokeVisitorLogin,
    null
  )

  const displayName = visitor.full_name ?? visitor.email
  const expiry = formatExpiry(visitor.viewer_expires_at)

  return (
    <tr className="hover:bg-[#faf9f6] transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-[#1a1a1a]">{displayName}</p>
        {visitor.username && (
          <p className="text-xs font-mono text-gray-500 mt-0.5">{visitor.username}</p>
        )}
      </td>

      <td className="px-4 py-3">
        <span
          className={`text-sm ${
            expiry.isExpired
              ? 'text-red-600 font-medium'
              : expiry.isExpiringSoon
              ? 'text-amber-600 font-medium'
              : 'text-gray-600'
          }`}
        >
          {expiry.label}
        </span>
      </td>

      <td className="px-4 py-3">
        {state?.success ? (
          <span className="text-xs text-green-700 font-medium">Revoked</span>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="user_id" value={visitor.id} />
            <input type="hidden" name="full_name" value={displayName} />
            <button
              type="submit"
              disabled={isPending}
              className="
                text-xs font-medium text-red-600
                border border-red-200 rounded-lg px-3 py-1.5
                hover:bg-red-50
                focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isPending ? 'Revoking…' : 'Revoke'}
            </button>
            {state && !state.success && (
              <p className="text-xs text-red-600 mt-1">{state.error}</p>
            )}
          </form>
        )}
      </td>
    </tr>
  )
}
