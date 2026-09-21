/**
 * Auth middleware.
 * Runs on every request to refresh the Supabase session cookie,
 * and redirects unauthenticated users away from protected routes.
 *
 * Protected routes:
 *   /dashboard/*       — requires auth + onboarding complete
 *   /superadmin/*      — requires auth + SUPERADMIN_EMAIL match
 *
 * Public routes: /login, /auth/callback, /upgrade, /unsubscribe, static assets.
 *
 * MFA:
 *   - If user has a TOTP factor enrolled (nextLevel === aal2) but session is
 *     only aal1, redirect to /login/mfa to complete verification.
 *   - Admin and User-role accounts with no factor enrolled are redirected
 *     to /dashboard/account/mfa/setup to force enrolment.
 *     Viewer accounts are intentionally exempt (time-limited, read-only).
 *
 * Rate limiting:
 *   - /login POST: max 10 attempts per IP per 10-minute window.
 *     Uses a module-level Map (in-memory, per function instance).
 *     This catches burst brute-force attacks within the same serverless instance.
 */
import { wrapMiddlewareWithSentry } from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Rate limiter (login brute-force protection) ────────────────────────────
//
// Vercel spins up a new function instance per cold start, so this Map resets
// on each cold start. That's acceptable — it still stops rapid burst attacks,
// which are the most common form of brute-forcing.

const LOGIN_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const LOGIN_MAX       = 10             // max POST attempts per IP per window

const loginAttempts = new Map<string, number[]>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Returns true if the request is allowed; false if it should be rate-limited. */
function checkLoginRateLimit(ip: string): boolean {
  const now    = Date.now()
  const window = (loginAttempts.get(ip) ?? []).filter(t => now - t < LOGIN_WINDOW_MS)

  if (window.length >= LOGIN_MAX) return false // blocked

  window.push(now)
  loginAttempts.set(ip, window)

  // Prune stale entries periodically to prevent unbounded Map growth
  if (loginAttempts.size > 5_000) {
    for (const [k, v] of loginAttempts) {
      if (v.every(t => now - t >= LOGIN_WINDOW_MS)) loginAttempts.delete(k)
    }
  }

  return true // allowed
}

// ── Middleware ─────────────────────────────────────────────────────────────

async function middlewareFn(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Forward the pathname to server components as a request header.
  // Server components read request headers (not response headers) via headers(),
  // so this must be set here, before NextResponse.next() is called.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  // ── Rate limit: login POST ────────────────────────────────────────────────
  if (pathname === '/login' && request.method === 'POST') {
    const ip = getClientIp(request)
    if (!checkLoginRateLimit(ip)) {
      return new NextResponse(
        'Too many sign-in attempts. Please wait 10 minutes and try again.',
        {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'Retry-After':  '600',
          },
        }
      )
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any redirect logic
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const superadminEmail = process.env.SUPERADMIN_EMAIL

  // ── Unauthenticated guards ──────────────────────────────────────────────

  // Public routes that never require authentication
  if (pathname === '/unsubscribe') return supabaseResponse

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Superadmin guard ───────────────────────────────────────────────────
  // Only the SUPERADMIN_EMAIL env var holder may access /superadmin/*
  if (pathname.startsWith('/superadmin')) {
    if (!superadminEmail || user?.email !== superadminEmail) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── MFA guard ─────────────────────────────────────────────────────────
  // Runs for authenticated users on protected routes only.
  // Skip the MFA pages themselves to avoid redirect loops.
  const isMfaVerifyPage        = pathname === '/login/mfa'
  const isMfaSetupPage         = pathname.startsWith('/dashboard/account/mfa')
  const isSuperadminAccountPage = pathname === '/superadmin/account'

  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin'))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aal) {
      // 1. User has a factor enrolled but hasn't verified this session → /login/mfa
      if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2' && !isMfaVerifyPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login/mfa'
        return NextResponse.redirect(url)
      }

      // 2a. Superadmin with no factor enrolled → force enrolment on /superadmin/account
      if (
        aal.nextLevel !== 'aal2' &&
        user.email === superadminEmail &&
        pathname.startsWith('/superadmin') &&
        !isSuperadminAccountPage
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin/account'
        return NextResponse.redirect(url)
      }

      // 2b. Admin/user with no factor enrolled → force enrolment
      // (dashboard routes only — superadmin handled above)
      // Deliberately NOT exempting /dashboard/welcome: that page renders inside
      // the full dashboard layout (nav, org branding, trial banner) and captures
      // onboarding/marketing consent, so it must not be reachable before MFA is
      // enrolled. A brand-new user is sent to MFA setup first; onboarding
      // ('/dashboard/welcome') follows once aal2 is satisfied.
      if (
        aal.nextLevel !== 'aal2' &&
        user.email !== superadminEmail &&
        pathname.startsWith('/dashboard') &&
        !isMfaSetupPage
      ) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin' || profile?.role === 'user') {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/account/mfa/setup'
          url.searchParams.set('required', '1')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // ── First-login onboarding redirect ─────────────────────────────────────
  // onboarding_complete === false: send them to /dashboard/welcome.
  // Skip if they're already on /dashboard/welcome (avoid loop).
  // Also skip for superadmin — they have no profile row.
  if (
    user &&
    user.email !== superadminEmail &&
    pathname.startsWith('/dashboard') &&
    pathname !== '/dashboard/welcome' &&
    !isMfaSetupPage
  ) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile && profile.onboarding_complete === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/welcome'
      return NextResponse.redirect(url)
    }
  }

  // ── Redirect authenticated users away from /login ──────────────────────
  // Superadmin goes to /superadmin; everyone else goes to /dashboard.
  //
  // BUT only once their session is actually done authenticating. This used
  // to fire for ANY session, including one that's only aal1 (password
  // verified, MFA not yet completed) -- which meant the MFA page's own
  // "Sign in with a different account" link (-> /login) walked straight
  // into a redirect loop: /login sent them to /dashboard (a session
  // exists), the MFA guard immediately sent them right back to
  // /login/mfa (that session isn't aal2 yet). No hard refresh, new tab, or
  // click could ever reach a real sign-in form again -- the only way out
  // was clearing cookies by hand, since Sign Out itself lives inside the
  // dashboard this loop never let them reach. Confirmed live (AJ got
  // trapped on /login/mfa for real, in production).
  if (user && pathname === '/login') {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const mfaStillPending = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2'

    if (!mfaStillPending) {
      const url = request.nextUrl.clone()
      url.pathname = user.email === superadminEmail ? '/superadmin' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const middleware = wrapMiddlewareWithSentry(middlewareFn)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (logo, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
