'use server'

/**
 * Superadmin impersonation action.
 *
 * Generates a one-time Supabase magic link for any org's admin user.
 * This lets you log in as them without knowing their password.
 *
 * The link is returned to the client, which opens it in a new tab so
 * your own superadmin session remains intact.
 *
 * Uses the service-role admin client — server-side only.
 */
import { createAdminClient } from '@/lib/supabase/admin'

export type ImpersonationResult =
  | { url: string }
  | { error: string }

export async function generateImpersonationLink(
  adminEmail: string
): Promise<ImpersonationResult> {
  if (!adminEmail) {
    return { error: 'No admin email provided.' }
  }

  const supabase = createAdminClient()

  // Resolve the site URL for the post-login redirect.
  // NEXT_PUBLIC_SITE_URL should be set in Vercel env vars.
  // VERCEL_URL is auto-set by Vercel (no https:// prefix) — use as fallback.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://alwaysready-inspection-readiness-pl-three.vercel.app')

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
    options: {
      redirectTo: `${siteUrl}/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  const actionLink = data?.properties?.action_link
  if (!actionLink) {
    return { error: 'Supabase did not return a login link. Try again.' }
  }

  return { url: actionLink }
}
