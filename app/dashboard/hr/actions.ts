'use server'

/**
 * HR module server actions.
 * All actions are admin-only — enforced here and at the RLS layer.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export type HrActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

// ── Staff profile ────────────────────────────────────────────────────────────

// Explicit allowlist of columns this action may write.
// Prevents a client from overriding server-controlled fields (e.g. organisation_id)
// via the data spread — defence-in-depth on top of RLS.
const ALLOWED_STAFF_PROFILE_FIELDS = new Set([
  'ni_number', 'job_title', 'department', 'employee_type', 'contracted_hours',
  'employment_start', 'leaving_date', 'employment_status',
  'date_of_birth', 'gender', 'ethnic_origin', 'disability', 'marital_status',
  'next_of_kin_name', 'next_of_kin_phone',
  'dbs_review_date', 'dbs_next_review_due', 'dbs_frequency_days',
  'right_to_work_verified', 'references_obtained',
  'supervision_review_date', 'supervision_next_due', 'supervision_frequency_days',
  'appraisal_review_date', 'appraisal_next_due', 'appraisal_frequency_days',
  'appraisal_notes', 'mandatory_training_complete',
])

export async function saveStaffProfile(
  userId: string,
  data: Record<string, string | boolean | number | null>
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  // Verify the target user belongs to this org
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId)
    .eq('organisation_id', profile.organisation_id)
  if (!userCount) return { success: false, error: 'User not found.' }

  // Strip any keys not in the explicit allowlist before upsert
  const safeData = Object.fromEntries(
    Object.entries(data).filter(([k]) => ALLOWED_STAFF_PROFILE_FIELDS.has(k))
  )

  const { error } = await supabase
    .from('hr_staff_profiles')
    .upsert({
      organisation_id: profile.organisation_id,
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...safeData,
    }, { onConflict: 'organisation_id,user_id' })

  if (error) {
    console.error('[saveStaffProfile]', error)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  revalidatePath('/dashboard/hr')
  return { success: true, message: 'Staff record saved.' }
}

// ── Staff self-service ───────────────────────────────────────────────────────

/**
 * Staff self-service: update only next_of_kin_name and next_of_kin_phone.
 * The caller must be the owner of the profile (enforced here + RLS).
 */
export async function saveOwnProfile(data: {
  next_of_kin_name: string | null
  next_of_kin_phone: string | null
}): Promise<HrActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  // Resolve org from users table
  const { data: userRow } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()
  if (!userRow) return { success: false, error: 'User record not found.' }

  const { error } = await supabase
    .from('hr_staff_profiles')
    .upsert({
      organisation_id: userRow.organisation_id,
      user_id: user.id,
      updated_at: new Date().toISOString(),
      next_of_kin_name: data.next_of_kin_name,
      next_of_kin_phone: data.next_of_kin_phone,
    }, { onConflict: 'organisation_id,user_id' })

  if (error) {
    console.error('[saveOwnProfile]', error)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/dashboard/hr/${user.id}`)
  return { success: true, message: 'Emergency contact saved.' }
}

// ── Training record ──────────────────────────────────────────────────────────

export async function saveTrainingRecord(
  userId: string,
  trainingTypeId: string,
  dateCompleted: string | null,
  frequencyDays: number,
  notes: string | null
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  // Verify the target user belongs to this org
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId)
    .eq('organisation_id', profile.organisation_id)
  if (!userCount) return { success: false, error: 'User not found.' }

  // Calculate next due date if a completion date is provided
  let nextDue: string | null = null
  if (dateCompleted) {
    const d = new Date(dateCompleted)
    d.setDate(d.getDate() + frequencyDays)
    nextDue = d.toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('hr_training_records')
    .upsert({
      organisation_id: profile.organisation_id,
      user_id: userId,
      training_type_id: trainingTypeId,
      date_completed: dateCompleted,
      next_due: nextDue,
      frequency_days: frequencyDays,
      notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organisation_id,user_id,training_type_id' })

  if (error) {
    console.error('[saveTrainingRecord]', error)
    return { success: false, error: 'Failed to save training record.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Training record saved.' }
}

// ── Holiday allowance ────────────────────────────────────────────────────────

export async function saveHolidayAllowance(
  userId: string,
  leaveYearStart: string,
  totalAllowance: number,
  taken: number,
  carryOver: number
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  // Verify the target user belongs to this org
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId)
    .eq('organisation_id', profile.organisation_id)
  if (!userCount) return { success: false, error: 'User not found.' }

  const { error } = await supabase
    .from('hr_holiday_allowances')
    .upsert({
      organisation_id: profile.organisation_id,
      user_id: userId,
      leave_year_start: leaveYearStart,
      total_allowance: totalAllowance,
      taken,
      carry_over: carryOver,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organisation_id,user_id,leave_year_start' })

  if (error) {
    console.error('[saveHolidayAllowance]', error)
    return { success: false, error: 'Failed to save holiday allowance.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Holiday allowance saved.' }
}

// ── Holiday unit (org-level setting) ─────────────────────────────────────────

export async function saveHolidayUnit(unit: 'days' | 'hours'): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('organisations')
    .update({ holiday_unit: unit })
    .eq('id', profile.organisation_id)

  if (error) {
    console.error('[saveHolidayUnit]', error)
    return { success: false, error: 'Failed to update holiday unit.' }
  }

  revalidatePath('/dashboard/hr')
  return { success: true }
}

// ── Training type management ──────────────────────────────────────────────────

export async function addTrainingType(
  name: string,
  isMandatory: boolean,
  defaultFrequencyDays: number
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  if (!name.trim()) return { success: false, error: 'Training type name is required.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('hr_training_types')
    .insert({
      organisation_id: profile.organisation_id,
      name: name.trim(),
      is_mandatory: isMandatory,
      default_frequency_days: defaultFrequencyDays,
    })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'A training type with that name already exists.' }
    console.error('[addTrainingType]', error)
    return { success: false, error: 'Failed to add training type.' }
  }

  revalidatePath('/dashboard/hr')
  return { success: true, message: `"${name}" added.` }
}

// ── Certificate upload ────────────────────────────────────────────────────────

export async function uploadTrainingCertificate(
  formData: FormData
): Promise<HrActionResult & { fileId?: string }> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const file = formData.get('file') as File | null
  const trainingRecordId = formData.get('training_record_id') as string | null
  const userId = formData.get('user_id') as string | null

  if (!file || !trainingRecordId || !userId) {
    return { success: false, error: 'Missing required fields.' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File must be under 10 MB.' }
  }

  const ALLOWED_MIME = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ]

  if (!ALLOWED_MIME.includes(file.type)) {
    return { success: false, error: 'File type not allowed. Upload PDF, Word (.docx), Excel (.xlsx), JPG, or PNG.' }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop()
  const filePath = `hr-certificates/${profile.organisation_id}/${userId}/${trainingRecordId}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('kloe-evidence') // reuse existing bucket
    .upload(filePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[uploadTrainingCertificate] storage error:', uploadError)
    return { success: false, error: 'File upload failed. Please try again.' }
  }

  // Record in database
  const { data: certRow, error: dbError } = await supabase
    .from('hr_training_certificates')
    .insert({
      organisation_id: profile.organisation_id,
      training_record_id: trainingRecordId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      scan_status: 'pending',
      uploaded_by: profile.id,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('[uploadTrainingCertificate] db error:', dbError)
    return { success: false, error: 'Failed to record upload.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Certificate uploaded.', fileId: certRow.id }
}

// ── Absence records ───────────────────────────────────────────────────────────

export async function saveAbsenceRecord(
  userId: string,
  data: {
    absenceType: 'sick' | 'other'
    startDate: string
    endDate: string | null
    absenceDays: number | null
    reasonCategory: string | null
    notes: string | null
    rtwInterviewCompleted: boolean
    rtwInterviewDate: string | null
    rtwNotes: string | null
  }
): Promise<HrActionResult & { id?: string }> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  if (!data.startDate) return { success: false, error: 'Start date is required.' }
  if (data.endDate && data.endDate < data.startDate) {
    return { success: false, error: 'End date cannot be before start date.' }
  }

  // Default absence_days to calendar days if end date is set and days not manually provided
  let absenceDays = data.absenceDays
  if (absenceDays === null && data.endDate) {
    const start = new Date(data.startDate)
    const end   = new Date(data.endDate)
    absenceDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  }

  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('hr_absence_records')
    .insert({
      organisation_id:         profile.organisation_id,
      user_id:                 userId,
      absence_type:            data.absenceType,
      start_date:              data.startDate,
      end_date:                data.endDate ?? null,
      absence_days:            absenceDays,
      reason_category:         (data.reasonCategory || null) as null,
      notes:                   data.notes ?? null,
      rtw_interview_completed: data.rtwInterviewCompleted,
      rtw_interview_date:      data.rtwInterviewDate ?? null,
      rtw_notes:               data.rtwNotes ?? null,
      recorded_by:             profile.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[saveAbsenceRecord]', error)
    return { success: false, error: 'Failed to save absence record.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Absence record saved.', id: row.id }
}

export async function updateAbsenceRecord(
  recordId: string,
  userId: string,
  data: {
    endDate: string | null
    absenceDays: number | null
    reasonCategory: string | null
    notes: string | null
    rtwInterviewCompleted: boolean
    rtwInterviewDate: string | null
    rtwNotes: string | null
  }
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('hr_absence_records')
    .update({
      end_date:                data.endDate ?? null,
      absence_days:            data.absenceDays,
      reason_category:         (data.reasonCategory || null) as null,
      notes:                   data.notes ?? null,
      rtw_interview_completed: data.rtwInterviewCompleted,
      rtw_interview_date:      data.rtwInterviewDate ?? null,
      rtw_notes:               data.rtwNotes ?? null,
      updated_at:              new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('organisation_id', profile.organisation_id)

  if (error) {
    console.error('[updateAbsenceRecord]', error)
    return { success: false, error: 'Failed to update absence record.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Absence record updated.' }
}

export async function deleteAbsenceRecord(
  recordId: string,
  userId: string
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('hr_absence_records')
    .delete()
    .eq('id', recordId)
    .eq('organisation_id', profile.organisation_id)

  if (error) {
    console.error('[deleteAbsenceRecord]', error)
    return { success: false, error: 'Failed to delete absence record.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Absence record deleted.' }
}

// ── Delete certificate ────────────────────────────────────────────────────────

export async function deleteTrainingCertificate(
  certId: string,
  userId: string
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Fetch the file path first
  const { data: cert, error: fetchError } = await supabase
    .from('hr_training_certificates')
    .select('file_path')
    .eq('id', certId)
    .eq('organisation_id', profile.organisation_id)
    .single()

  if (fetchError || !cert) {
    return { success: false, error: 'Certificate not found.' }
  }

  // Delete from storage
  await adminClient.storage.from('kloe-evidence').remove([cert.file_path])

  // Delete from database
  await supabase
    .from('hr_training_certificates')
    .delete()
    .eq('id', certId)

  revalidatePath(`/dashboard/hr/${userId}`)
  return { success: true, message: 'Certificate deleted.' }
}

// ── Absence categories ────────────────────────────────────────────────────────

export async function saveAbsenceCategory(name: string): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'Category name is required.' }
  if (trimmed.length > 80) return { success: false, error: 'Category name must be 80 characters or fewer.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('hr_absence_categories')
    .insert({ organisation_id: profile.organisation_id, name: trimmed })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'That category already exists.' }
    console.error('[saveAbsenceCategory]', error)
    return { success: false, error: 'Could not save category. Please try again.' }
  }

  revalidatePath('/dashboard/hr')
  return { success: true, message: `"${trimmed}" added.` }
}
