/**
 * Auth proxy (Next.js 16 — renamed from middleware.ts).
 * Runs on every request to refresh the Supabase session cookie,
 * and redirects unauthenticated users away from protected routes.
 *
 * Protected routes:
 *   /dashboard/*       — requires auth + onboarding complete
 *   /superadmin/*      — requires auth + SUPERADMIN_EMAIL match
 *
 * Public routes: /login, /auth/callback, /upgrade, static assets.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  // ── Unauthenticated guards ──────────────────────────────────────────────

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Superadmin guard ───────────────────────────────────────────────────
  // Only the SUPERADMIN_EMAIL env var holder may access /superadmin/*
  if (pathname.startsWith('/superadmin')) {
    const superadminEmail = process.env.SUPERADMIN_EMAIL
    if (!superadminEmail || user?.email !== superadminEmail) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── First-login onboarding redirect ───────────────────────────────────
  // If the user hasn't completed onboarding, send them to /dashboard/welcome.
  // Skip if they're already on /dashboard/welcome (avoid loop).
  if (
    user &&
    pathname.startsWith('/dashboard') &&
    pathname !== '/dashboard/welcome'
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

  // ── Redirect authenticated users away from /login and /signup ──────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
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
