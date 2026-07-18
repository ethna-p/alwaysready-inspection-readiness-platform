'use client'

/**
 * MfaSection — manages TOTP factors on the Account page.
 *
 * Shows:
 *   - Enrolled: factor name, option to remove
 *   - Not enrolled (admin): warning + setup link (mandatory)
 *   - Not enrolled (other roles): nudge + setup link (optional)
 */

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Factor = {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
}

type Props = {
  role: string | null
}

export default function MfaSection({ role }: Props) {
  const router   = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [factors, setFactors]   = useState<Factor[]>([])
  const [loading, setLoading]   = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [, startTransition]     = useTransition()

  const justEnrolled = searchParams.get('mfa') === 'enrolled'

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.mfa.listFactors()
      setFactors(data?.totp ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRemove(factorId: string) {
    if (!confirm('Are you sure you want to remove two-factor authentication? Your account will be less secure.')) return

    setError(null)
    setRemoving(factorId)

    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId })

    if (removeError) {
      setError('Could not remove. Please try again.')
      setRemoving(null)
      return
    }

    setFactors(prev => prev.filter(f => f.id !== factorId))
    setRemoving(null)

    // For admins, middleware will redirect to setup on next navigation
    startTransition(() => {
      router.refresh()
    })
  }

  const isAdmin   = role === 'admin'
  const hasFactor = factors.length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-base font-semibold text-[#014D4E]">Two-factor authentication</h2>
        {hasFactor && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {isAdmin
          ? 'Required for manager accounts. Uses a one-time code from your authenticator app each time you sign in.'
          : 'Adds a second layer of security. Uses a one-time code from your authenticator app each time you sign in.'}
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {justEnrolled && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Two-factor authentication is now active on your account.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : hasFactor ? (
        <div className="space-y-3">
          {factors.map(factor => (
            <div key={factor.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#014D4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-[#1a1a1a]">{factor.friendly_name ?? 'Authenticator app'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(factor.id)}
                disabled={removing === factor.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {removing === factor.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {isAdmin && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Two-factor authentication is required for your account. Please set it up.
            </div>
          )}
          <a
            href="/dashboard/account/mfa/setup"
            className="inline-flex items-center gap-2 rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Set up two-factor authentication
          </a>
        </div>
      )}
    </div>
  )
}
