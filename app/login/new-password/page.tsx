'use client'

/**
 * New password page — landed on after clicking a password-reset link.
 *
 * The reset email link goes to /auth/callback?next=/login/new-password,
 * which exchanges the code for a session and redirects here.
 * The user is then authenticated with a short-lived recovery session,
 * which allows exactly one supabase.auth.updateUser({ password }) call.
 *
 * After setting the new password:
 *   1. Send a notification email (same as the password-change notification).
 *   2. Sign out so they log in fresh with the new credentials.
 *   3. Redirect to /login.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function NewPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Check that the user actually has a recovery session — if they landed here
  // without a valid link, bounce them back to login.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasSession === false) {
      router.replace('/login')
    }
  }, [hasSession, router])

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
      setError(
        'Could not set your new password. Your reset link may have expired — please go back and request a new one.'
      )
      setLoading(false)
      return
    }

    // Sign out so they log in fresh with the new password
    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
  }

  // Still checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* Top bar with logo */}
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

            {/* ── Success state ──────────────────────────────────────────── */}
            {done && (
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#014D4E] mb-2">Password updated</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Your new password has been saved. You can now sign in with it.
                </p>
                <a
                  href="/login"
                  className="
                    inline-block w-full rounded-lg bg-[#014D4E] text-white text-center
                    font-semibold py-2.5 text-sm
                    hover:bg-[#013a3b]
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                    transition-colors
                  "
                >
                  Go to sign in
                </a>
              </div>
            )}

            {/* ── New password form ──────────────────────────────────────── */}
            {!done && (
              <>
                <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Set new password</h1>
                <p className="text-sm text-gray-600 mb-6">
                  Choose a new password for your account.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {error && (
                    <div
                      role="alert"
                      className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  <div className="mb-4">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-[#1a1a1a] mb-1"
                    >
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                    <p className="text-xs text-gray-600 mt-1">At least 8 characters.</p>
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-[#1a1a1a] mb-1"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full rounded-lg bg-[#014D4E] text-white font-semibold
                      py-2.5 text-sm
                      hover:bg-[#013a3b]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {loading ? 'Saving…' : 'Set new password'}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#faf9f6] px-6 py-6 text-center">
      <p className="text-xs text-[#1a1a1a]">
        © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
        Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
      </p>
      <p className="text-xs text-[#1a1a1a] mt-1 max-w-2xl mx-auto">
        Our tools are designed to support providers in preparing for CQC inspection.
        They do not constitute official CQC guidance and do not guarantee any
        particular inspection outcome.
      </p>
    </footer>
  )
}
