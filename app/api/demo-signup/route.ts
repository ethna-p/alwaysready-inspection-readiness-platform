/**
 * GET /api/demo-signup
 *
 * Signs the current demo user out, then redirects to /signup.
 * Used by the demo banner "SIGN UP HERE" button so authenticated
 * demo users can register for a real account.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/signup', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
}
