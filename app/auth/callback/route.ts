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
 *
 * A THIRD format exists and is NOT handled here at all: any link minted via
 * the Admin API (auth.admin.generateLink, auth.admin.inviteUserByEmail — the
 * latter is exactly how inviteTeamMember sends real team member invites) never
 * carries a `code`, because PKCE needs a code_verifier that only ever exists
 * in the browser that initiated the request — an admin-triggered link has no
 * such browser. Those links deliver the session as a URL FRAGMENT instead
 * (#access_token=...&refresh_token=...), which never reaches this server at
 * all (browsers strip fragments before the request is sent) — so neither
 * `code` nor `token_hash` will ever be present here for that case. The
 * fallback below hands off to a client page that can actually see it.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'recovery' | 'signup' | 'email' | 'magiclink' | null

  // Validate `next` to prevent open-redirect attacks.
  // It must be a relative path: starts with '/', no protocol, no double-slash.
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next    = /^\/(?!\/)[^:]*$/.test(rawNext) ? rawNext : '/dashboard'

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

  // Neither `code` nor `token_hash` was present — this is exactly what an
  // Admin-API-minted link looks like when it reaches the server (see the
  // file comment above), so it's not necessarily a genuine failure yet.
  // Hand off to a client page that can read the URL fragment directly: a
  // same-origin redirect whose own Location has no fragment still carries
  // the ORIGINAL request's fragment forward (standard browser behavior,
  // confirmed against this app's own dev server), so #access_token=...
  // survives this hop intact and is still there when that page mounts.
  return NextResponse.redirect(`${origin}/auth/callback/complete?next=${encodeURIComponent(next)}`)
}
