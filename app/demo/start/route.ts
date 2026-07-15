/**
 * GET /demo — Demo session bootstrap
 *
 * Flow:
 *   1. Generate a unique email + password for this demo visitor
 *   2. Create a Supabase auth user (email_confirm: true → skips verification)
 *   3. Call create_demo_session(user_id) to create the shadow org + seed data
 *   4. Sign the user in so the session cookie is set
 *   5. Redirect to /dashboard
 *
 * This is a Route Handler (server-only). The service role key never
 * leaves the server — it is only used in createAdminClient().
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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
      return NextResponse.redirect(new URL('/demo?error=create', getBaseUrl()))
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
      return NextResponse.redirect(new URL('/demo?error=seed', getBaseUrl()))
    }

    // ── 4. Sign in so the session cookie is set ──────────────
    const serverClient = await createClient()
    const { error: signInError } = await serverClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('[demo] signIn failed:', signInError)
      return NextResponse.redirect(new URL('/demo?error=signin', getBaseUrl()))
    }

    // ── 5. Redirect to dashboard ─────────────────────────────
    return NextResponse.redirect(new URL('/dashboard', getBaseUrl()))

  } catch (err) {
    console.error('[demo] Unexpected error:', err)
    return NextResponse.redirect(new URL('/demo?error=unexpected', getBaseUrl()))
  }
}

/** Base URL for redirects — works in both local dev and production. */
function getBaseUrl(): string {
  // NEXT_PUBLIC_SITE_URL should be set in production (e.g. https://app.alwaysready.co.uk)
  // Falls back to localhost for local development.
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
