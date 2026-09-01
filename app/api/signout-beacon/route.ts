/**
 * POST /api/signout-beacon
 *
 * Called via navigator.sendBeacon() when the user closes their browser tab.
 * Revokes the Supabase refresh token server-side so the session cannot be
 * resumed from another device or by replaying the refresh token.
 *
 * Two-step approach for reliability:
 *   1. Extract the current access token (JWT) from the user-scoped SSR client.
 *   2. Revoke it via the admin client using the service role key, which works
 *      even if the access token has already expired (the admin API accepts
 *      expired JWTs for revocation — it just needs to identify the session).
 *
 * The user-scoped signOut() alone is insufficient: if the access token has
 * expired mid-session, the SSR client cannot refresh it during a beacon
 * request (there is nowhere to write the new cookie), so the call fails
 * silently and the refresh token is never invalidated on Supabase's side.
 *
 * sendBeacon is fire-and-forget — we return 204 with no body.
 */
import 'server-only'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    // Step 1: Read the current session from the request cookies.
    // We use getSession() rather than getUser() because we only need the
    // token string; we do not need to re-verify it with Supabase's server.
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      // Step 2: Revoke via the admin client.
      // admin.signOut(jwt, 'global') invalidates all sessions for this user
      // (same behaviour as the default scope of the user-scoped signOut()).
      // Using the admin client means we are not relying on the user's
      // (potentially expired) token to authenticate the revocation call.
      const admin = createAdminClient()
      await admin.auth.admin.signOut(session.access_token, 'global')
    }
  } catch {
    // Silently swallow errors — beacon is best-effort and the tab is closing.
  }

  return new Response(null, { status: 204 })
}
