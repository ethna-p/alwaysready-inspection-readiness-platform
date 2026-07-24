'use client'

/**
 * /login/mfa — TOTP verification page.
 *
 * Reached automatically by middleware when a user has a TOTP factor enrolled
 * but their session is only aal1 (password verified, MFA not yet verified).
 *
 * Flow:
 *   1. On mount: list factors to get factorId, create a challenge
 *   2. User enters 6-digit code from their authenticator app
 *   3. Verify code → session upgrades to aal2
 *   4. Redirect to dashboard (or superadmin for superadmin email)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function MfaVerifyPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [code, setCode]           = useState('')
  const [factorId, setFactorId]   = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    async function init() {
      // Get the enrolled TOTP factor
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError || !factors?.totp?.length) {
        // No factor found — send back to login
        router.replace('/login')
        return
      }

      const factor = factors.totp[0]
      setFactorId(factor.id)

      // Create a challenge immediately so the code is valid when the user submits
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (challengeError || !challenge) {
        setError('Could not start verification. Please try signing in again.')
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

    // Flush the upgraded aal2 session to cookies BEFORE navigating.
    // Without this, the middleware may still read the old aal1 cookie on the
    // next request and redirect back here, causing an infinite loop.
    await supabase.auth.refreshSession()

    // Session is now aal2 — redirect based on role
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL) {
      router.replace('/superadmin')
    } else {
      router.replace('/dashboard')
    }
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

            {initialising ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">Setting up verification…</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#014D4E]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#014D4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Two-step verification</h1>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleVerify} noValidate>
                  {error && (
                    <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mb-6">
                    <label htmlFor="code" className="block text-sm font-medium text-[#1a1a1a] mb-1">
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
                        w-full rounded-lg border border-gray-300 px-3 py-2
                        text-[#1a1a1a] text-sm bg-white text-center tracking-widest text-lg font-mono
                        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                      "
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
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

                <div className="mt-4 text-center">
                  <a
                    href="/login"
                    className="text-xs text-gray-500 hover:text-[#014D4E] hover:underline"
                  >
                    ← Sign in with a different account
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
