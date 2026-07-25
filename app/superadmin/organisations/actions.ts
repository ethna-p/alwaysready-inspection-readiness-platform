'use server'

/**
 * Superadmin org actions.
 *
 * generateImpersonationLink — generates a one-time Supabase magic link for
 *   any org's admin user so you can log in as them without knowing their password.
 *
 * setCharityStatus — toggles is_charity on an org, which controls whether the
 *   20% charity discount is applied automatically at Stripe checkout.
 *
 * Uses the service-role admin client — server-side only.
 */
import { revalidatePath } from 'next/cache'
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

// ── Charity status ─────────────────────────────────────────────────────────

export type SetCharityResult =
  | { success: true }
  | { error: string }

export async function setCharityStatus(
  orgId: string,
  isCharity: boolean
): Promise<SetCharityResult> {
  if (!orgId) return { error: 'No organisation ID provided.' }

  const supabase = createAdminClient()

  const { error } = await (supabase as any)
    .from('organisations')
    .update({ is_charity: isCharity })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/organisations')
  return { success: true }
}
