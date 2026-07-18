/**
 * Auth middleware.
 * Runs on every request to refresh the Supabase session cookie,
 * and redirects unauthenticated users away from protected routes.
 *
 * Protected routes:
 *   /dashboard/*       — requires auth + onboarding complete
 *   /superadmin/*      — requires auth + SUPERADMIN_EMAIL match
 *
 * Public routes: /login, /auth/callback, /upgrade, static assets.
 *
 * MFA:
 *   - If user has a TOTP factor enrolled (nextLevel === aal2) but session is
 *     only aal1, redirect to /login/mfa to complete verification.
 *   - Admin users with no factor enrolled are redirected to
 *     /dashboard/account/mfa/setup to force enrolment.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
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

  const { pathname } = request.nextUrl
  const superadminEmail = process.env.SUPERADMIN_EMAIL

  // ── Unauthenticated guards ──────────────────────────────────────────────

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
  const isMfaVerifyPage = pathname === '/login/mfa'
  const isMfaSetupPage  = pathname.startsWith('/dashboard/account/mfa')

  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin'))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aal) {
      // 1. User has a factor enrolled but hasn't verified this session → /login/mfa
      if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2' && !isMfaVerifyPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login/mfa'
        return NextResponse.redirect(url)
      }

      // 2. Admin with no factor enrolled → force enrolment
      // (Only for /dashboard routes — superadmin has no profile row so skip for them)
      if (
        aal.nextLevel !== 'aal2' &&
        user.email !== superadminEmail &&
        pathname.startsWith('/dashboard') &&
        !isMfaSetupPage &&
        pathname !== '/dashboard/welcome'
      ) {
        // Fetch role to check if admin
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/account/mfa/setup'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // ── First-login onboarding redirect ───────────────────────────────────
  // If the user hasn't completed onboarding, send them to /dashboard/welcome.
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
      .select('onboarding_complete, organisations(is_demo)')
      .eq('id', user.id)
      .single()

    const isDemo = (profile?.organisations as { is_demo?: boolean } | null)?.is_demo === true

    if (!isDemo && profile && profile.onboarding_complete === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/welcome'
      return NextResponse.redirect(url)
    }
  }

  // ── Redirect authenticated users away from /login ──────────────────────
  // Superadmin goes to /superadmin; everyone else goes to /dashboard.
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = user.email === superadminEmail ? '/superadmin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

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
