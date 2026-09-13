'use client'

/**
 * MfaVerifyStep — the actual "enter your 6-digit code" challenge/verify
 * mechanic, shared between:
 *
 *   - app/login/mfa/page.tsx — normal login, session is aal1 after password
 *     verification, this upgrades it to aal2 then hard-navigates on.
 *   - app/login/new-password/page.tsx — password-reset recovery flow. A
 *     recovery-link session is also only ever aal1 (it proves control of the
 *     inbox, nothing more), and Supabase's own updateUser({password}) will
 *     not complete a password change once the account has MFA enrolled
 *     until the session reaches aal2 -- exactly the same gate as a normal
 *     login. Verifying here upgrades the *same* recovery session to aal2 in
 *     place, so the page can then call updateUser() for real. (See
 *     https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/28.)
 *
 * The two callers differ only in what "verified" means next (navigate away
 * vs. reveal another form on the same page) and in their surrounding copy --
 * everything about the challenge/verify call itself, error handling, and
 * retry-on-wrong-code lives here once, so a fix to one never silently
 * diverges from the other.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MfaVerifyStepProps {
  /** Called once the code is verified and the session is genuinely aal2. */
  onVerified: () => void | Promise<void>
  /**
   * Called if this account unexpectedly has no TOTP factor to verify against
   * (the caller should already know MFA is required before rendering this,
   * so this is a defensive fallback, not the normal path). Defaults to
   * showing the inline error below with no navigation.
   */
  onNoFactor?: () => void
  heading?: string
  description?: string
  /** Optional content rendered below the form (e.g. a "different account" link). */
  footer?: React.ReactNode
}

export default function MfaVerifyStep({
  onVerified,
  onNoFactor,
  heading = 'Two-step verification',
  description = 'Enter the 6-digit code from your authenticator app.',
  footer,
}: MfaVerifyStepProps) {
  const supabase = createClient()

  const [code, setCode]               = useState('')
  const [factorId, setFactorId]       = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError || !factors?.totp?.length) {
        setError('Could not verify your account. Please try again.')
        setInitialising(false)
        onNoFactor?.()
        return
      }

      const factor = factors.totp[0]
      setFactorId(factor.id)

      // Create a challenge immediately so the code is valid when submitted.
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (challengeError || !challenge) {
        setError('Could not start verification. Please try again.')
        setInitialising(false)
        return
      }

      setChallengeId(challenge.id)
      setInitialising(false)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || !challengeId) return

    setError(null)
    setLoading(true)

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.replace(/\s/g, ''),
    })

    if (verifyError) {
      setError('Incorrect code. Please check your authenticator app and try again.')
      setLoading(false)
      // Re-create challenge for next attempt
      const { data: newChallenge } = await supabase.auth.mfa.challenge({ factorId })
      if (newChallenge) setChallengeId(newChallenge.id)
      return
    }

    // Flush the upgraded aal2 session. Callers that hard-navigate need this
    // in cookies before the next request; callers that just reveal more UI
    // on the same page don't strictly need it (the client's in-memory
    // session is already upgraded), but doing it unconditionally here means
    // no caller has to remember to.
    await supabase.auth.refreshSession()
    await onVerified()
  }

  return (
    <>
      {initialising ? (
        <div className="text-center py-6">
          <p className="text-sm text-ink-muted">Setting up verification…</p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#014D4E]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-brand mb-1">{heading}</h1>
            <p className="text-sm text-ink-dim">{description}</p>
          </div>

          <form onSubmit={handleVerify} noValidate>
            {error && (
              <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="code" className="block text-sm font-medium text-ink mb-1">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="
                  w-full rounded-lg border border-line px-3 py-2
                  text-ink text-sm bg-card text-center tracking-widest text-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || !factorId || !challengeId}
              className="
                w-full rounded-lg bg-[#014D4E] text-white font-semibold
                py-2.5 text-sm
                hover:bg-[#013a3b]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>

          {footer}
        </>
      )}
    </>
  )
}
