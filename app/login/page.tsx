'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { requestPasswordReset } from './actions'

/**
 * Login page.
 *
 * Accepts either:
 *   - A real email address (admin accounts)
 *   - A username (staff accounts, e.g. sarah.jones.f7a2e1)
 *     The login page appends @staff.alwaysready.uk before calling Supabase auth.
 *
 * After successful login, redirects based on role:
 *   admin / viewer → /dashboard
 *   user           → /dashboard/my-kloes
 *
 * "Forgot password?" flow:
 *   - Email users   → Supabase sends reset email directly
 *   - Staff users   → server action generates recovery link, sends to personal_email via Resend
 */

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  // ── Login state ─────────────────────────────────────────────────────────────
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // ── Reset state ─────────────────────────────────────────────────────────────
  const [showReset, setShowReset]       = useState(false)
  const [resetInput, setResetInput]     = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent]       = useState(false)
  const [resetError, setResetError]     = useState<string | null>(null)

  // Show an idle logout notice if redirected here with ?reason=idle
  const idleReason = searchParams.get('reason') === 'idle'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Resolve email — if no @ present, treat as staff username
    const email = login.includes('@')
      ? login.trim()
      : `${login.trim()}@staff.alwaysready.uk`

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect login ID or password. Please try again.')
      setLoading(false)
      return
    }

    // Fetch role to decide where to redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'user') {
        router.push('/dashboard/my-kloes')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }

    router.refresh()
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetLoading(true)

    const result = await requestPasswordReset(resetInput)

    if (!result.success) {
      setResetError(result.error)
      setResetLoading(false)
      return
    }

    setResetSent(true)
    setResetLoading(false)
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

      {/* Card — centred */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            {/* ── Idle logout notice ─────────────────────────────────────── */}
            {idleReason && !showReset && (
              <div
                role="status"
                className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
              >
                You were signed out after 15 minutes of inactivity.
              </div>
            )}

            {/* ── Login form ─────────────────────────────────────────────── */}
            {!showReset && (
              <>
                <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Sign in</h1>
                <p className="text-sm text-[#1a1a1a] mb-6">Inspection Readiness Platform</p>

                <form onSubmit={handleLogin} noValidate>
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
                      htmlFor="login"
                      className="block text-sm font-medium text-[#1a1a1a] mb-1"
                    >
                      Email or login ID
                    </label>
                    <input
                      id="login"
                      type="text"
                      autoComplete="username"
                      required
                      value={login}
                      onChange={e => setLogin(e.target.value)}
                      placeholder="e.g. sarah.jones.f7a2e1"
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white placeholder:text-gray-600
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Managers: use your email address. Staff: use the login ID given to you.
                    </p>
                  </div>

                  <div className="mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[#1a1a1a] mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                  </div>

                  {/* Forgot password link */}
                  <div className="mb-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setError(null) }}
                      className="text-xs text-[#014D4E] hover:underline focus:outline-none focus:underline"
                    >
                      Forgot your password?
                    </button>
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
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              </>
            )}

            {/* ── Password reset form ────────────────────────────────────── */}
            {showReset && !resetSent && (
              <>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetError(null); setResetInput('') }}
                  className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-[#014D4E] focus:outline-none focus:underline"
                  aria-label="Back to sign in"
                >
                  <span aria-hidden="true">←</span> Back to sign in
                </button>

                <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Reset password</h1>
                <p className="text-sm text-gray-600 mb-6">
                  Enter your email or login ID and we&apos;ll send you a reset link.
                </p>

                <form onSubmit={handleResetRequest} noValidate>
                  {resetError && (
                    <div
                      role="alert"
                      className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                    >
                      {resetError}
                    </div>
                  )}

                  <div className="mb-6">
                    <label
                      htmlFor="reset-login"
                      className="block text-sm font-medium text-[#1a1a1a] mb-1"
                    >
                      Email or login ID
                    </label>
                    <input
                      id="reset-login"
                      type="text"
                      autoComplete="username"
                      required
                      value={resetInput}
                      onChange={e => setResetInput(e.target.value)}
                      placeholder="e.g. hello@yourorg.com or sarah.jones.f7a2e1"
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white placeholder:text-gray-600
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Staff: if you don&apos;t have a personal email on your account, ask your manager to reset your password.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="
                      w-full rounded-lg bg-[#014D4E] text-white font-semibold
                      py-2.5 text-sm
                      hover:bg-[#013a3b]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {resetLoading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}

            {/* ── Sent confirmation ──────────────────────────────────────── */}
            {showReset && resetSent && (
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
                <h2 className="text-lg font-bold text-[#014D4E] mb-2">Check your inbox</h2>
                <p className="text-sm text-gray-600 mb-6">
                  If an account exists for that email or login ID, you&apos;ll receive a reset link shortly.
                  The link expires in 1 hour.
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Staff: check the personal email address on your account, not your work one.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); setResetInput('') }}
                  className="text-sm text-[#014D4E] hover:underline focus:outline-none focus:underline"
                >
                  ← Back to sign in
                </button>
              </div>
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
