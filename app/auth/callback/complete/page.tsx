'use client'

/**
 * Client-side fallback for Supabase's implicit (URL-fragment) auth flow.
 *
 * /auth/callback (route.ts) redirects here as its final fallback when a
 * request carries neither a `code` nor a `token_hash` — which is exactly
 * what happens for any link minted via the Admin API (auth.admin.generateLink,
 * and auth.admin.inviteUserByEmail — the real mechanism behind
 * inviteTeamMember's staff invites). Those links never carry a PKCE code
 * (there's no browser-side code_verifier to tie one to when an admin, not
 * the recipient's own browser, triggered the link), and instead deliver the
 * session directly in the URL fragment: #access_token=...&refresh_token=...
 *
 * A fragment is never sent to a server — the browser strips it before the
 * request goes out — so the only place it can ever be read is client-side
 * JS running on a page actually navigated to with that fragment still in
 * the address bar. This page is that page: the redirect that sent us here
 * had no fragment of its own, so the browser carried the ORIGINAL fragment
 * forward onto this URL (standard cross-redirect fragment behavior), and
 * it's still there in window.location.hash by the time this mounts.
 *
 * This deliberately does NOT rely on the Supabase browser client's own
 * automatic detectSessionInUrl handling — that sounds like the obvious fit,
 * but @supabase/ssr's createBrowserClient hardcodes flowType: 'pkce'
 * (see node_modules/@supabase/ssr/dist/main/createBrowserClient.js), and a
 * PKCE-flow client's URL auto-detection only ever looks for a `?code=`
 * param, not implicit-style #access_token=... fragments — confirmed
 * empirically: with detectSessionInUrl left to run on its own here, the
 * only state change it ever fired was INITIAL_SESSION with no session, and
 * nothing afterward completes it (verified with logging that reached this
 * exact point and no further before the 2026-09-12 fix). So this parses the
 * fragment by hand and calls setSession() directly instead, which works
 * regardless of flowType.
 */

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackCompletePage() {
  return (
    <Suspense>
      <CompleteInner />
    </Suspense>
  )
}

function CompleteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  useEffect(() => {
    async function run() {
      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      const params = new URLSearchParams(rawHash)

      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const hashError    = params.get('error')

      // No usable tokens — an expired/already-used link (Supabase returns
      // #error=access_denied&error_code=otp_expired in exactly that case),
      // or a stray hit with nothing in the fragment at all.
      if (hashError || !accessToken || !refreshToken) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      router.replace(error ? '/login?error=auth_callback_failed' : next)
    }

    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <p className="text-sm text-ink-dim">Signing you in…</p>
    </div>
  )
}
