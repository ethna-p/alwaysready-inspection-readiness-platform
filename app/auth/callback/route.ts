/**
 * Auth callback route.
 *
 * Handles two formats Supabase may use when redirecting back to the app:
 *
 *   1. PKCE `code` — used for sign-in, OAuth, and password reset (modern flow).
 *      `exchangeCodeForSession(code)` completes the exchange.
 *
 *   2. `token_hash` + `type` — used in some email-link flows (legacy / non-PKCE).
 *      `verifyOtp({ token_hash, type })` completes the verification.
 *
 * After a successful exchange, redirects to `next` (defaults to /dashboard).
 * Password reset links set next=/login/new-password via the redirectTo param.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'recovery' | 'signup' | 'email' | 'magiclink' | null
  const next       = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // ── PKCE code exchange ────────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error)
  }

  // ── Token hash verification (legacy email links) ─────────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] verifyOtp error:', error)
  }

  // Something went wrong — send back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
