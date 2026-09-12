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
import SetPasswordForm from '@/components/SetPasswordForm'

export default function NewPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

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

  async function handleSetPassword(password: string): Promise<{ error?: string }> {
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      return {
        error: 'Could not set your new password. Your reset link may have expired — please go back and request a new one.',
      }
    }

    // Sign out so they log in fresh with the new password
    await supabase.auth.signOut()
    setDone(true)
    return {}
  }

  // Still checking session
  if (hasSession === null) {
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
            {!done && (
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
