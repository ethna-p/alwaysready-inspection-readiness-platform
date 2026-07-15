/**
 * GET /api/demo-signup
 *
 * Signs the current demo user out (including clearing auth cookies),
 * then redirects to /signup so they can register for a real account.
 *
 * The Supabase client must be wired to write cookies directly onto the
 * redirect response — otherwise the session cookies aren't cleared before
 * the browser follows the redirect.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  // Build the redirect response first so we can attach cookie changes to it
  const redirectUrl = new URL('/signup', request.url)
  const response = NextResponse.redirect(redirectUrl)

  // Wire Supabase SSR client to read from the request and write to the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Sign out — clears auth cookies onto the response above
  await supabase.auth.signOut()

  return response
}
