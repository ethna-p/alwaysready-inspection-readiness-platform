'use client'

/**
 * New password page — landed on after clicking a password-reset link.
 *
 * The reset email link goes to /auth/callback?next=/login/new-password,
 * which exchanges the code for a session and redirects here.
 * The user is then authenticated with a short-lived recovery session,
 * which allows exactly one supabase.auth.updateUser({ password }) call --
 * but only once that session reaches aal2. A recovery-link session, like a
 * fresh password login, only ever proves aal1 (control of the inbox); if
 * the account has an MFA factor enrolled, Supabase's own updateUser()
 * correctly refuses the change until aal2 is satisfied. There was
 * previously no path here to ever reach aal2 mid-recovery at all, so every
 * account with MFA enrolled -- which per this app's own middleware is
 * eventually every real admin/user account -- silently could not
 * self-serve a password reset. Fixed by checking the session's AAL on
 * mount and, when required, running the same challenge/verify step used by
 * a normal login (components/MfaVerifyStep.tsx) before ever showing the
 * set-password form. See
 * https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/28.
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
import SetPasswordForm from '@/components/SetPasswordForm'
import MfaVerifyStep from '@/components/MfaVerifyStep'

type Step = 'loading' | 'no-session' | 'mfa' | 'password' | 'done'

export default function NewPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('loading')

  // Check for a valid recovery session, then whether this account needs an
  // MFA step before a password change can actually succeed.
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStep('no-session')
        return
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      // nextLevel === 'aal2' means a factor is enrolled; currentLevel !==
      // 'aal2' means this recovery session hasn't verified it yet -- exactly
      // the same check lib/session.ts's isAAL2Satisfied() uses server-side.
      if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        setStep('mfa')
      } else {
        setStep('password')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step === 'no-session') {
      router.replace('/login')
    }
  }, [step, router])

  async function handleSetPassword(password: string): Promise<{ error?: string }> {
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      return {
        error: 'Could not set your new password. Your reset link may have expired — please go back and request a new one.',
      }
    }

    // Sign out so they log in fresh with the new password
    await supabase.auth.signOut()
    setStep('done')
    return {}
  }

  // Still checking the session/AAL, or already bouncing to /login
  if (step === 'loading' || step === 'no-session') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top bar with logo */}
      <header className="px-6 py-4">
        <Image
          src="/alwaysready-logo.svg"
          alt="AlwaysReady"
          width={260}
          height={57}
          style={{ height: 'auto' }}
          priority
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-sm border border-line p-8">

            {/* ── MFA step (only when this account has a factor enrolled) ─── */}
            {step === 'mfa' && (
              <MfaVerifyStep
                onVerified={() => setStep('password')}
                heading="Verify it's you"
                description="Your account has extra security enabled. Enter the 6-digit code from your authenticator app before setting a new password."
              />
            )}

            {/* ── Success state ──────────────────────────────────────────── */}
            {step === 'done' && (
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
                <h2 className="text-lg font-bold text-brand mb-2">Password updated</h2>
                <p className="text-sm text-ink-dim mb-6">
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
            {step === 'password' && (
              <>
                <h1 className="text-2xl font-bold text-brand mb-1">Set new password</h1>
                <p className="text-sm text-ink-dim mb-6">
                  Choose a new password for your account.
                </p>

                <SetPasswordForm onSubmit={handleSetPassword} />
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
    <footer className="border-t border-line bg-canvas px-6 py-6 text-center">
      <p className="text-xs text-ink">
        © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services. |
        82A James Carter Road, Mildenhall, IP28 7DE
      </p>
      <p className="text-xs text-ink mt-1 max-w-2xl mx-auto">
        Our tools are designed to support providers in preparing for CQC inspection.
        They do not constitute official CQC guidance and do not guarantee any
        particular inspection outcome.
      </p>
    </footer>
  )
}
