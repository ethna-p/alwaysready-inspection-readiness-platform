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
import { deleteStoragePrefix } from '@/lib/utils/storage-cleanup'

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

  // Route through /auth/callback, not straight to /dashboard. A magic link
  // is the implicit flow (no code_verifier exists for a link minted on
  // someone else's behalf) -- Supabase delivers the session as a URL
  // fragment (#access_token=...), which only /auth/callback (via
  // /auth/callback/complete) knows how to parse and exchange into a real
  // session. Pointed straight at /dashboard, that fragment token was never
  // read by anything: the new tab silently kept whatever session the
  // browser already had (the superadmin's own, since window.open shares
  // the same cookie jar) instead of ever becoming the target admin --
  // "View as admin" looked like it worked (a new tab opened) but never
  // actually impersonated anyone. Same category of bug already found and
  // fixed for staff invites (see inviteUserByEmail / commit 9596ee7).
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
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

  // The whole body is wrapped in try/catch so this function can never throw.
  // Every step below that returns a Postgrest {error} was already handled,
  // but supabase.auth.admin.deleteUser() (a real GoTrueAdminApi Promise, not
  // a Postgrest builder) was not -- a transient network failure there
  // rejected instead of resolving to {error}, which threw out of this server
  // action entirely. An uncaught throw from a server action crashes the
  // client's RSC tree with a generic "An unexpected response was received
  // from the server" error, taking the whole page down with it -- including
  // making the org's own card disappear, which looked like the delete had
  // succeeded even though the org row was never actually removed. Every
  // other action in this file (setCharityStatus, generateImpersonationLink)
  // already honours the DeleteOrgResult-style { error } contract for every
  // failure path; this one didn't for this one step. Fixed at the function
  // level rather than just around that one call, since any future step here
  // is one unguarded await away from the same failure mode.
  try {
    // ── Step 1: Delete mock inspection children via parent IDs ────────────────
    const { data: mockInspections } = await supabase
      .from('mock_inspections')
      .select('id')
      .eq('organisation_id', orgId)

    const mockIds = (mockInspections ?? []).map(m => m.id)

    if (mockIds.length > 0) {
      const { error: e1 } = await supabase
        .from('mock_inspection_checklist_responses')
        .delete()
        .in('mock_inspection_id', mockIds)
      if (e1) return { error: `Failed to delete mock checklist responses: ${e1.message}` }

      const { error: e2 } = await supabase
        .from('mock_inspection_findings')
        .delete()
        .in('mock_inspection_id', mockIds)
      if (e2) return { error: `Failed to delete mock findings: ${e2.message}` }
    }

    const { error: e3 } = await supabase
      .from('mock_inspections')
      .delete()
      .eq('organisation_id', orgId)
    if (e3) return { error: `Failed to delete mock inspections: ${e3.message}` }

    // ── Step 2: Delete support ticket replies via parent IDs ──────────────────
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('organisation_id', orgId)

    const ticketIds = (tickets ?? []).map(t => t.id)

    if (ticketIds.length > 0) {
      const { error: e4 } = await supabase
        .from('support_ticket_replies')
        .delete()
        .in('ticket_id', ticketIds)
      if (e4) return { error: `Failed to delete ticket replies: ${e4.message}` }
    }

    const { error: e5 } = await supabase
      .from('support_tickets')
      .delete()
      .eq('organisation_id', orgId)
    if (e5) return { error: `Failed to delete support tickets: ${e5.message}` }

    // ── Step 3: Delete remaining org-scoped tables ────────────────────────────
    const directTables = [
      'klo_checklist_completions',
      'compliance_record_history',
      'compliance_records',
      'review_frequency_history',
      'priority_history',
      'kloe_evidence',
      'i_statement_evidence',
      'hr_training_certificates',
      'hr_training_records',
      'hr_holiday_allowances',
      'hr_staff_profiles',
      'hr_training_types',
      'notification_log',
      'organisation_sub_services',
    ]

    for (const table of directTables) {

      const { error } = await supabase
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
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(u.id)
      if (deleteUserError) return { error: `Failed to delete user ${u.id}: ${deleteUserError.message}` }
    }

    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('organisation_id', orgId)
    if (usersError) return { error: `Failed to delete users: ${usersError.message}` }

    // ── Step 4b: Delete Storage files ─────────────────────────────────────────
    // The rows above only ever pointed at files in Storage — deleting them
    // never deletes the files themselves. Without this, every org deleted
    // through this tool leaves its uploaded evidence, HR certificates, and
    // logo permanently orphaned in Storage (they all live under org-scoped
    // path prefixes, evidence/i-statement/HR certs all under the 'evidence'
    // bucket's ${orgId}/ prefix, logos under their own bucket). The automated
    // GDPR-driven deletion cron (app/api/cron/data-deletion/route.ts) already
    // does this — this mirrors it via the shared helper rather than silently
    // relying on this tool being used only for orgs with nothing uploaded.
    // Non-fatal: log and continue with the org row deletion either way, same
    // as the cron does.
    try {
      await deleteStoragePrefix(supabase, 'evidence', orgId)
    } catch (storageErr) {
      console.error(`[deleteOrganisation] Storage evidence cleanup failed for org ${orgId}:`, storageErr)
    }
    try {
      const { data: logoFiles } = await supabase.storage.from('org-logos').list(orgId)
      if (logoFiles && logoFiles.length > 0) {
        await supabase.storage.from('org-logos').remove(logoFiles.map(f => `${orgId}/${f.name}`))
      }
    } catch (logoErr) {
      console.error(`[deleteOrganisation] Storage logo cleanup failed for org ${orgId}:`, logoErr)
    }

    // ── Step 5: Delete the organisation ──────────────────────────────────────
    const { error: orgError } = await supabase
      .from('organisations')
      .delete()
      .eq('id', orgId)
    if (orgError) return { error: `Failed to delete organisation: ${orgError.message}` }

    revalidatePath('/superadmin/organisations')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[deleteOrganisation] Unexpected error deleting org ${orgId}:`, err)
    return { error: `Unexpected error: ${message}` }
  }
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

  const { error } = await supabase
    .from('organisations')
    .update({ is_charity: isCharity })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/organisations')
  return { success: true }
}

type SetTesterResult = { success: true } | { error: string }

export async function setTesterStatus(
  orgId: string,
  isTester: boolean
): Promise<SetTesterResult> {
  await assertSuperadmin()

  if (!orgId) return { error: 'No organisation ID provided.' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('organisations')
    .update({ is_tester: isTester })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/organisations')
  return { success: true }
}
