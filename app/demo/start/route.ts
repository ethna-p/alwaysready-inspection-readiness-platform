/**
 * GET /demo/start — Demo session bootstrap
 *
 * Flow:
 *   1. Generate a unique email + password for this demo visitor
 *   2. Create a Supabase auth user (email_confirm: true → skips verification)
 *   3. Call create_demo_session(user_id) to create the shadow org + seed data
 *   4. Sign the user in — Supabase client wired directly to the response
 *      so the session cookie is set correctly
 *   5. Redirect to /dashboard
 *
 * This is a Route Handler (server-only). The service role key never
 * leaves the server — it is only used in createAdminClient().
 *
 * Note: base URL is derived from the incoming request, not NEXT_PUBLIC_SITE_URL,
 * so redirects work on any domain (Vercel preview, custom domain, localhost).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  try {
    const adminClient = createAdminClient()

    // ── 1. Generate unique demo credentials ─────────────────
    const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    const email    = `demo-${uid}@demo.alwaysready.co.uk`
    const password = crypto.randomUUID()   // strong, thrown away after sign-in

    // ── 2. Create the auth user ──────────────────────────────
    const { data: { user }, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,   // bypass email verification for demo
      })

    if (createError || !user) {
      console.error('[demo] createUser failed:', createError)
      return NextResponse.redirect(new URL('/demo?error=create', origin))
    }

    // ── 3. Seed the demo org and compliance data ─────────────
    const { error: seedError } = await adminClient.rpc(
      'create_demo_session',
      { p_user_id: user.id }
    )

    if (seedError) {
      // Clean up the orphaned auth user before bailing out
      await adminClient.auth.admin.deleteUser(user.id)
      console.error('[demo] create_demo_session failed:', seedError)
      return NextResponse.redirect(new URL('/demo?error=seed', origin))
    }

    // ── 4. Sign in — wire Supabase client to the response so cookies are set ──
    // createClient() from lib/supabase/server cannot set cookies in a Route Handler.
    // We must wire the SSR client directly to the response object here.
    const dashboardUrl = new URL('/dashboard', origin)
    const response = NextResponse.redirect(dashboardUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('[demo] signIn failed:', signInError)
      return NextResponse.redirect(new URL('/demo?error=signin', origin))
    }

    // ── 5. Return the response (redirect to /dashboard with session cookie) ──
    return response

  } catch (err) {
    console.error('[demo] Unexpected error:', err)
    return NextResponse.redirect(new URL('/demo?error=unexpected', origin))
  }
}
