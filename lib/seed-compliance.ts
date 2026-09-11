/**
 * ensureComplianceRecordsSeeded
 *
 * Self-heal: if an organisation has zero compliance_records (e.g. because the
 * seed step at trial signup failed transiently), seed them now from klo_items.
 *
 * Called once per dashboard layout render — the count query is cheap (index
 * scan on organisation_id) and short-circuits immediately when rows exist.
 *
 * Uses the admin client for the INSERT because compliance_records is normally
 * written via the compliance_record_history trigger. Direct seeding requires
 * bypassing RLS.
 *
 * Warm-instance cache: once we've confirmed (or performed) a seed for an org,
 * remember it for the lifetime of this server instance so every subsequent
 * dashboard render for that org skips the DB round-trip entirely. Same
 * pattern as the login rate-limiter in middleware.ts — resets on cold start,
 * which just means the cheap check runs again, not a correctness issue.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const knownSeededOrgs = new Set<string>()

export async function ensureComplianceRecordsSeeded(orgId: string): Promise<void> {
  if (knownSeededOrgs.has(orgId)) return // Confirmed earlier in this instance's lifetime

  const supabase = await createClient()

  // Fast path: check if any records exist (index scan, head-only)
  const { count } = await supabase
    .from('compliance_records')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', orgId)

  if ((count ?? 0) > 0) {
    knownSeededOrgs.add(orgId)
    return // Already seeded — nothing to do
  }

  // Slow path: seed from klo_items via admin client
  console.warn(`[seed-compliance] org ${orgId} has no compliance records — seeding now`)

  const adminSupabase = createAdminClient()

  const { data: klos, error: kloError } = await adminSupabase
    .from('klo_items')
    .select('id')

  if (kloError || !klos || klos.length === 0) {
    console.error('[seed-compliance] could not fetch klo_items for seed:', kloError?.message)
    return // Non-fatal — user can still access the dashboard
  }

  const { error: insertError } = await adminSupabase
    .from('compliance_records')
    .insert(klos.map(klo => ({ organisation_id: orgId, klo_item_id: klo.id })))

  if (insertError) {
    console.error('[seed-compliance] insert error:', insertError.message)
    return // Non-fatal — will retry on next page load
  }

  knownSeededOrgs.add(orgId)
  console.log(`[seed-compliance] seeded ${klos.length} compliance records for org ${orgId}`)
}
