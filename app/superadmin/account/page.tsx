'use client'

/**
 * /superadmin/account — MFA management for the superadmin user.
 *
 * The superadmin has no row in the users table and bypasses the normal
 * dashboard, so this is a dedicated lightweight account page covering
 * only what the superadmin needs: two-factor authentication.
 *
 * The enrollment flow is inlined here rather than linking to
 * /dashboard/account/mfa/setup, because the dashboard layout tries to
 * fetch a users profile row and redirects the superadmin away when it
 * finds none.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Factor = {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
}

export default function SuperadminAccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}

function AccountContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()
  const justEnrolled = searchParams.get('mfa') === 'enrolled'

  const [factors, setFactors]   = useState<Factor[]>([])
  const [loading, setLoading]   = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // ── Enrollment state ──────────────────────────────────────────────────
  const [enrolling, setEnrolling]       = useState(false)
  const [factorId, setFactorId]         = useState<string | null>(null)
  const [qrCode, setQrCode]             = useState<string | null>(null)
  const [secret, setSecret]             = useState<string | null>(null)
  const [showSecret, setShowSecret]     = useState(false)
  const [totpCode, setTotpCode]         = useState('')
  const [enrollError, setEnrollError]   = useState<string | null>(null)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollIniting, setEnrollIniting] = useState(false)

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
    if (!confirm('Remove two-factor authentication? Your account will be less secure.')) return

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
    router.refresh()
  }

  async function handleStartEnroll() {
    setEnrollError(null)
    setEnrolling(true)
    setEnrollIniting(true)

    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
    })

    if (err || !data) {
      setEnrollError('Could not start setup. Please refresh and try again.')
      setEnrolling(false)
      setEnrollIniting(false)
      return
    }

    setFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setEnrollIniting(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return

    setEnrollError(null)
    setEnrollLoading(true)

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: totpCode.replace(/\s/g, ''),
    })

    if (verifyError) {
      setEnrollError('Incorrect code. Check your authenticator app and try again.')
      setEnrollLoading(false)
      return
    }

    // Hard-navigate so middleware reads fresh aal2 cookies.
    window.location.replace('/superadmin/account?mfa=enrolled')
  }

  const hasFactor = factors.length > 0

  // ── Session timeout preference ────────────────────────────────────────
  const STORAGE_KEY = 'superadmin_idle_timeout'
  const [timeoutMins, setTimeoutMins] = useState<number>(15)
  const [timeoutSaved, setTimeoutSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const mins = parseInt(stored, 10)
        if ([15, 30, 60].includes(mins)) setTimeoutMins(mins)
      }
    } catch { /* ignore */ }
  }, [])

  function handleTimeoutChange(mins: number) {
    setTimeoutMins(mins)
    try {
      localStorage.setItem(STORAGE_KEY, String(mins))
      setTimeoutSaved(true)
      setTimeout(() => setTimeoutSaved(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand mb-1">Account</h1>
        <p className="text-sm text-ink-dim">Security settings for your superadmin account.</p>
      </div>

      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-base font-semibold text-brand">Two-factor authentication</h2>
          {hasFactor && (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <p className="text-sm text-ink-dim mb-4">
          Uses a one-time code from your authenticator app each time you sign in.
        </p>

        {justEnrolled && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Two-factor authentication is now active on your account.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : hasFactor ? (
          // ── Enrolled: show factors + remove button ──────────────────────
          <div className="space-y-3">
            {factors.map(factor => (
              <div key={factor.id} className="flex items-center justify-between bg-fill rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-ink">{factor.friendly_name ?? 'Authenticator app'}</span>
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
        ) : enrolling ? (
          // ── Enrollment flow (inlined — avoids dashboard layout redirect) ─
          <div>
            {enrollIniting ? (
              <p className="text-sm text-ink-muted">Preparing setup…</p>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-brand mb-1">Step 1 — Scan the QR code</h3>
                  <p className="text-sm text-ink-dim mb-4">
                    Open your authenticator app (Google Authenticator, Authy, or similar) and scan this code.
                  </p>

                  {qrCode && (
                    <div className="flex justify-center mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="MFA QR code" className="w-48 h-48 border border-line rounded-lg p-1" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-xs text-brand hover:underline"
                  >
                    {showSecret ? 'Hide' : "Can't scan? Enter code manually"}
                  </button>

                  {showSecret && secret && (
                    <div className="mt-2 bg-fill rounded-lg px-3 py-2">
                      <p className="text-xs text-ink-muted mb-1">Manual entry key:</p>
                      <p className="font-mono text-sm text-ink break-all">{secret}</p>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-xs text-sky-900">
                    <p className="font-semibold mb-1">No smartphone?</p>
                    <p>Use <strong>Authy</strong> (desktop app) or the <strong>Authenticator</strong> browser extension for Chrome/Firefox.</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-brand mb-1">Step 2 — Enter the code</h3>
                  <p className="text-sm text-ink-dim mb-4">
                    Enter the 6-digit code shown in your authenticator app to confirm setup.
                  </p>

                  <form onSubmit={handleVerify} noValidate>
                    {enrollError && (
                      <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {enrollError}
                      </div>
                    )}

                    <div className="mb-4">
                      <label htmlFor="totp-code" className="block text-sm font-medium text-ink mb-1">
                        Verification code
                      </label>
                      <input
                        id="totp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full rounded-lg border border-line px-3 py-2 text-ink text-sm bg-card text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={enrollLoading || totpCode.length !== 6}
                      className="w-full rounded-lg bg-[#014D4E] text-white font-semibold py-2.5 text-sm hover:bg-[#013a3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {enrollLoading ? 'Activating…' : 'Activate two-factor authentication'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : (
          // ── Not enrolled: show setup button ────────────────────────────
          <button
            type="button"
            onClick={handleStartEnroll}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Set up two-factor authentication
          </button>
        )}
      </div>
      {/* ── Session timeout ─────────────────────────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm mt-6">
        <h2 className="text-base font-semibold text-brand mb-1">Session timeout</h2>
        <p className="text-sm text-ink-dim mb-4">
          How long you can be inactive before being automatically logged out. Applies to your superadmin session only.
        </p>

        <fieldset>
          <legend className="sr-only">Session timeout duration</legend>
          <div className="flex gap-3">
            {([15, 30, 60] as const).map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => handleTimeoutChange(mins)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${timeoutMins === mins
                    ? 'bg-[#014D4E] text-white border-[#014D4E]'
                    : 'bg-card text-ink border-line hover:border-[#014D4E] hover:text-[#014D4E]'}
                `}
                aria-pressed={timeoutMins === mins}
              >
                {mins} min
              </button>
            ))}
          </div>
        </fieldset>

        {timeoutSaved && (
          <p className="mt-3 text-xs text-green-700" role="status">
            Saved. Takes effect on your next login or page refresh.
          </p>
        )}
      </div>
    </div>
  )
}
