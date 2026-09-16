/**
 * ensureComplianceRecordsSeeded — the e2e-side mirror of
 * lib/seed-compliance.ts's function of the same name.
 *
 * The app's own version self-heals lazily from app/dashboard/layout.tsx, so
 * any spec that navigates a page to /dashboard first gets this for free.
 * A spec that only ever calls request.get() against a cron route (no page
 * fixture at all -- e.g. cron-review-reminders.spec.ts) never triggers that
 * side effect, and a freshly reseeded org genuinely has zero
 * compliance_records until something does. Whether that "something" turns
 * out to be true was previously just luck of file execution order (another
 * spec alphabetically earlier happening to log in first) -- found the hard
 * way when running cron specs as a subset surfaced a silent 0-rows-updated
 * failure that a full-suite run's incidental ordering had been masking.
 * Call this explicitly in any spec that touches compliance_records without
 * a prior page navigation, instead of relying on that.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export async function ensureComplianceRecordsSeeded(admin: SupabaseClient, orgId: string): Promise<void> {
  const { count } = await admin
    .from('compliance_records')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', orgId)

  if ((count ?? 0) > 0) return

  const { data: klos, error: kloError } = await admin.from('klo_items').select('id')
  if (kloError || !klos || klos.length === 0) {
    throw new Error(`Could not seed compliance_records: ${kloError?.message ?? 'no klo_items found'}`)
  }

  const { error: insertError } = await admin
    .from('compliance_records')
    .insert(klos.map(klo => ({ organisation_id: orgId, klo_item_id: klo.id })))
  if (insertError) throw new Error(`Could not seed compliance_records: ${insertError.message}`)
}
