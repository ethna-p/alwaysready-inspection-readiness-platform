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

  // ── Step 1: Delete mock inspection children via parent IDs ────────────────
  const { data: mockInspections } = await (supabase as any)
    .from('mock_inspections')
    .select('id')
    .eq('organisation_id', orgId)

  const mockIds = (mockInspections ?? []).map((m: any) => m.id)

  if (mockIds.length > 0) {
    const { error: e1 } = await (supabase as any)
      .from('mock_inspection_checklist_responses')
      .delete()
      .in('mock_inspection_id', mockIds)
    if (e1) return { error: `Failed to delete mock checklist responses: ${e1.message}` }

    const { error: e2 } = await (supabase as any)
      .from('mock_inspection_findings')
      .delete()
      .in('mock_inspection_id', mockIds)
    if (e2) return { error: `Failed to delete mock findings: ${e2.message}` }
  }

  const { error: e3 } = await (supabase as any)
    .from('mock_inspections')
    .delete()
    .eq('organisation_id', orgId)
  if (e3) return { error: `Failed to delete mock inspections: ${e3.message}` }

  // ── Step 2: Delete support ticket replies via parent IDs ──────────────────
  const { data: tickets } = await (supabase as any)
    .from('support_tickets')
    .select('id')
    .eq('organisation_id', orgId)

  const ticketIds = (tickets ?? []).map((t: any) => t.id)

  if (ticketIds.length > 0) {
    const { error: e4 } = await (supabase as any)
      .from('support_ticket_replies')
      .delete()
      .in('ticket_id', ticketIds)
    if (e4) return { error: `Failed to delete ticket replies: ${e4.message}` }
  }

  const { error: e5 } = await (supabase as any)
    .from('support_tickets')
    .delete()
    .eq('organisation_id', orgId)
  if (e5) return { error: `Failed to delete support tickets: ${e5.message}` }

  // ── Step 3: Delete remaining org-scoped tables ────────────────────────────
  const directTables = [
    'compliance_record_history',
    'compliance_records',
    'review_frequency_history',
    'priority_history',
    'kloe_evidence',
    'peoples_voice',
    'hr_records',
    'notification_log',
    'organisation_sub_services',
  ]

  for (const table of directTables) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('organisation_id', orgId)
    if (error) return { error: `Failed to delete from ${table}: ${error.message}` }
  }

  // ── Step 4: Delete users (auth + table rows) ──────────────────────────────
  const { data: orgUsers } = await supabase
    .from('users')
    .select('id')
    .eq('organisation_id', orgId)

  for (const u of orgUsers ?? []) {
    await supabase.auth.admin.deleteUser(u.id)
  }

  const { error: usersError } = await supabase
    .from('users')
    .delete()
    .eq('organisation_id', orgId)
  if (usersError) return { error: `Failed to delete users: ${usersError.message}` }

  // ── Step 5: Delete the organisation ──────────────────────────────────────
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
