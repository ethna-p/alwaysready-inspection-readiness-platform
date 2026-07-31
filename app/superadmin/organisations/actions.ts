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
import { assertSuperadmin } from '@/lib/assert-superadmin'

export type ImpersonationResult =
  | { url: string }
  | { error: string }

export async function generateImpersonationLink(
  adminEmail: string
): Promise<ImpersonationResult> {
  await assertSuperadmin()

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

// ── Delete organisation ────────────────────────────────────────────────────

export type DeleteOrgResult =
  | { success: true }
  | { error: string }

export async function deleteOrganisation(orgId: string): Promise<DeleteOrgResult> {
  await assertSuperadmin()
  if (!orgId) return { error: 'No organisation ID provided.' }

  const supabase = createAdminClient()

  // Delete in dependency order to handle any FK constraints without CASCADE.
  // Each step is best-effort — we proceed even if a table has no rows.
  const tables = [
    'mock_inspection_checklist_responses',
    'mock_inspection_findings',
    'mock_inspections',
    'compliance_record_history',
    'compliance_records',
    'review_frequency_history',
    'priority_history',
    'kloe_evidence',
    'support_ticket_replies',
    'support_tickets',
    'peoples_voice',
    'hr_records',
    'notification_log',
    'organisation_sub_services',
  ]

  for (const table of tables) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('organisation_id', orgId)
    if (error) return { error: `Failed to delete from ${table}: ${error.message}` }
  }

  // Delete the org's users from auth (so their accounts are fully removed)
  const { data: orgUsers } = await supabase
    .from('users')
    .select('id')
    .eq('organisation_id', orgId)

  for (const u of orgUsers ?? []) {
    await supabase.auth.admin.deleteUser(u.id)
  }

  // Delete users table rows
  const { error: usersError } = await supabase
    .from('users')
    .delete()
    .eq('organisation_id', orgId)
  if (usersError) return { error: `Failed to delete users: ${usersError.message}` }

  // Finally delete the org itself
  const { error: orgError } = await (supabase as any)
    .from('organisations')
    .delete()
    .eq('id', orgId)
  if (orgError) return { error: `Failed to delete organisation: ${orgError.message}` }

  revalidatePath('/superadmin/organisations')
  return { success: true }
}

// ── Charity status ─────────────────────────────────────────────────────────

export type SetCharityResult =
  | { success: true }
  | { error: string }

export async function setCharityStatus(
  orgId: string,
  isCharity: boolean
): Promise<SetCharityResult> {
  await assertSuperadmin()

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
