/**
 * GET /api/wizard-status
 *
 * Returns completion state for the Getting Started wizard.
 * All four checks are derived from existing data — no separate tracking table.
 *
 * Protected: requires an authenticated session.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAAL2Satisfied } from '@/lib/session'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isAAL2Satisfied(supabase))) {
    return NextResponse.json({ error: 'MFA verification required.' }, { status: 401 })
  }

  // Get the user's org
  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'No organisation' }, { status: 400 })
  }

  const orgId = profile.organisation_id

  const [
    kloeResult,
    evidenceResult,
    teamResult,
    hrResult,
  ] = await Promise.all([
    // Step 1: any KLOE has been rated
    supabase
      .from('compliance_records')
      .select('id')
      .eq('organisation_id', orgId)
      .not('status', 'is', null)
      .limit(1),

    // Step 2: any evidence uploaded
    supabase
      .from('kloe_evidence')
      .select('id')
      .eq('organisation_id', orgId)
      .limit(1),

    // Step 3: more than one user in the org
    supabase
      .from('users')
      .select('id')
      .eq('organisation_id', orgId)
      .limit(2),

    // Step 4: any HR staff profile
    supabase
      .from('hr_staff_profiles')
      .select('id')
      .eq('organisation_id', orgId)
      .limit(1),
  ])

  return NextResponse.json({
    hasKloeRating:  (kloeResult.data?.length    ?? 0) > 0,
    hasEvidence:    (evidenceResult.data?.length ?? 0) > 0,
    hasTeamMember:  (teamResult.data?.length     ?? 0) > 1,
    hasHrRecord:    (hrResult.data?.length       ?? 0) > 0,
  })
}
