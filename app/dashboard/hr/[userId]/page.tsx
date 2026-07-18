/**
 * HR Staff Detail — admin only.
 * Full HR record for a single staff member, split into sections:
 *   1. Employment
 *   2. Personal (special category data)
 *   3. Emergency contact
 *   4. Compliance: DBS, Right to Work, References
 *   5. Supervision
 *   6. Appraisal
 *   7. Training records (per training type, with certificate uploads)
 *   8. Holiday allowance
 */

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import HrStaffForm from './HrStaffForm'
import HrTrainingSection from './HrTrainingSection'
import HrHolidaySection from './HrHolidaySection'

export default async function HrStaffDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const orgId = profile.organisation_id

  // Verify the user belongs to this org
  const { data: staffUser } = await supabase
    .from('users')
    .select('id, full_name, username, role')
    .eq('id', userId)
    .eq('organisation_id', orgId)
    .single()

  if (!staffUser) notFound()

  // Load HR profile (may not exist yet)
  const { data: hrProfile } = await supabase
    .from('hr_staff_profiles')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()

  // Load training types and records
  const [{ data: trainingTypes }, { data: trainingRecords }, { data: certificates }] =
    await Promise.all([
      supabase
        .from('hr_training_types')
        .select('*')
        .eq('organisation_id', orgId)
        .order('display_order'),
      supabase
        .from('hr_training_records')
        .select('*')
        .eq('organisation_id', orgId)
        .eq('user_id', userId),
      supabase
        .from('hr_training_certificates')
        .select('*')
        .eq('organisation_id', orgId),
    ])

  // Load holiday allowances and org unit setting
  const [{ data: holidayAllowances }, { data: org }] = await Promise.all([
    supabase
      .from('hr_holiday_allowances')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('user_id', userId)
      .order('leave_year_start', { ascending: false }),
    supabase
      .from('organisations')
      .select('holiday_unit')
      .eq('id', orgId)
      .single(),
  ])

  // Generate signed URLs for certificates (15-minute expiry)
  const certUrls: Record<string, string> = {}
  for (const cert of certificates ?? []) {
    const { data } = await supabase.storage
      .from('kloe-evidence')
      .createSignedUrl(cert.file_path, 900)
    if (data?.signedUrl) certUrls[cert.id] = data.signedUrl
  }

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/dashboard/hr"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#014D4E] mb-6"
      >
        ← HR Records
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#014D4E]">
          {staffUser.full_name ?? staffUser.username}
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{staffUser.role}</p>
      </div>

      {/* Main form sections (employment, personal, emergency, compliance, supervision, appraisal) */}
      <HrStaffForm
        userId={userId}
        hrProfile={hrProfile}
      />

      {/* Training records */}
      <HrTrainingSection
        userId={userId}
        trainingTypes={trainingTypes ?? []}
        trainingRecords={trainingRecords ?? []}
        certificates={certificates ?? []}
        certUrls={certUrls}
      />

      {/* Holiday allowance */}
      <HrHolidaySection
        userId={userId}
        allowances={holidayAllowances ?? []}
        holidayUnit={org?.holiday_unit ?? 'days'}
      />
    </div>
  )
}
