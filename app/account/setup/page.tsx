'use client'

/**
 * /account/setup — Password setup for invited users.
 *
 * Reached after an admin sends an invite and the recipient clicks the link.
 * At this point the user is authenticated (aal1) via the invite magic link,
 * but has no password set. We prompt them to choose one so they can log in
 * normally on future visits.
 *
 * After setting a password, they go to /dashboard. The middleware then handles
 * any further requirements (MFA enrolment for admin accounts, welcome flow, etc.)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function AccountSetupPage() {
  const router    = useRouter()
  const supabase  = createClient()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      console.error('[account/setup] updateUser error:', updateError)
      setError('Failed to set password. Your invite link may have expired — ask your admin to resend it.')
      setLoading(false)
      return
    }

    setDone(true)
    // Small delay so the user sees the success state before redirect
    setTimeout(() => window.location.replace('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      <header className="px-6 py-4">
        <Image
          src="/alwaysready-logo.svg"
          alt="AlwaysReady"
          width={220}
          height={48}
          style={{ height: 'auto' }}
          priority
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            {done ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-[#014D4E]">Password set</p>
                <p className="text-sm text-gray-500 mt-1">Taking you to the platform…</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Welcome to AlwaysReady</h1>
                  <p className="text-sm text-gray-600">
                    Set a password to complete your account setup.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {error && (
                    <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-sm text-[#1a1a1a] bg-white
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-[#1a1a1a] mb-1">
                      Confirm password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-sm text-[#1a1a1a] bg-white
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full rounded-lg bg-[#014D4E] text-white font-semibold
                      py-2.5 text-sm mt-2
                      hover:bg-[#013a3b]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {loading ? 'Setting password…' : 'Set password and continue'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
