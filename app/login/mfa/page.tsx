'use client'

/**
 * /login/mfa — TOTP verification page.
 *
 * Reached automatically by middleware when a user has a TOTP factor enrolled
 * but their session is only aal1 (password verified, MFA not yet verified).
 * The actual challenge/verify mechanic lives in components/MfaVerifyStep.tsx,
 * shared with app/login/new-password/page.tsx's own embedded MFA step (see
 * that file's doc comment for why the recovery flow needs the same gate).
 *
 * Flow:
 *   1. MfaVerifyStep lists factors, creates a challenge, verifies the code.
 *   2. On success: session upgrades to aal2.
 *   3. Redirect to dashboard (or superadmin for superadmin email).
 */

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MfaVerifyStep from '@/components/MfaVerifyStep'
import { getPostMfaDestination } from './actions'

export default function MfaVerifyPage() {
  const router = useRouter()

  // "Sign in with a different account" used to be a plain <a href="/login">
  // -- but middleware redirected any authenticated session (including one
  // stuck right here, aal1-only) straight back to /dashboard, which its own
  // MFA guard then bounced right back to /login/mfa. A real, reproduced
  // production incident: no click, hard refresh, or new tab could ever
  // reach a real sign-in form again, because this page's own aal1 session
  // was never actually cleared. Middleware no longer redirects an aal1
  // session away from /login (see its own comment), which already breaks
  // the loop -- but signing out here too means this link does what it
  // says immediately, rather than depending on that fix alone.
  async function handleDifferentAccount() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleVerified() {
    // Hard-navigate so the browser sends the fresh aal2 cookies in the HTTP
    // request. A soft client-side nav can race with the cookie write (already
    // flushed by MfaVerifyStep's own refreshSession() call), causing the
    // middleware to still see aal1 and loop back here.
    // Destination is resolved server-side to keep SUPERADMIN_EMAIL out of the bundle.
    const destination = await getPostMfaDestination()
    window.location.replace(destination)
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
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
            <MfaVerifyStep
              onVerified={handleVerified}
              onNoFactor={() => router.replace('/login')}
              footer={
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDifferentAccount}
                    className="text-xs text-ink-muted hover:text-brand hover:underline"
                  >
                    ← Sign in with a different account
                  </button>
                </div>
              }
            />
          </div>
        </div>
      </main>
    </div>
  )
}
