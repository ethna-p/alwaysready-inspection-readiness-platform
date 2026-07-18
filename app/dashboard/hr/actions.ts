'use server'

/**
 * HR module server actions.
 * All actions are admin-only — enforced here and at the RLS layer.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'

export type HrActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

// ── Guard helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const profile = await getCurrentUserProfile()
  if (!profile || !profile.organisation_id) return null
  if (profile.role !== 'admin') return null
  return profile as typeof profile & { organisation_id: string }
}

// ── Staff profile ────────────────────────────────────────────────────────────

export async function saveStaffProfile(
  userId: string,
  data: Record<string, string | boolean | number | null>
): Promise<HrActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Admin access required.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('hr_staff_profiles')
    .upsert({
      organisation_id: profile.organisation_id,
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...data,
    }, { onConflict: 'organisation_id,user_id' })

  if (error) {
    console.error('[saveStaffProfile]', error)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/dashboard/hr/${userId}`)
  revalidatePath('/dashboard/hr')
  return { success: true, message: 'Staff record saved.' }
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
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ]

  if (!ALLOWED_MIME.includes(file.type)) {
    return { success: false, error: 'File type not allowed. Upload PDF, Word, Excel, JPG, or PNG.' }
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
