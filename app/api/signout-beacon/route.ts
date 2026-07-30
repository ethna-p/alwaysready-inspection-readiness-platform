/**
 * POST /api/signout-beacon
 *
 * Called via navigator.sendBeacon() when the user closes their browser tab.
 * Signs the session out server-side so the Supabase refresh token is revoked.
 *
 * sendBeacon is fire-and-forget — we return 204 with no body.
 * Browsers process Set-Cookie headers from beacon responses, so the auth
 * cookies are cleared even though the JS caller never sees the response.
 */
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Silently swallow errors — beacon is best-effort and the tab is closing anyway.
  }

  return new Response(null, { status: 204 })
}
