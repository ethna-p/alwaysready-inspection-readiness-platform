'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

export async function saveEvidenceRecord(
  kloItemId: string,
  fileName: string,
  storagePath: string,
  fileSize: number,
  mimeType: string,
  scanStatus: string = 'clean'
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()

  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (!['admin', 'user'].includes(profile.role)) {
    return { success: false, error: 'You do not have permission to upload files.' }
  }

  const { error } = await supabase
    .from('kloe_evidence')
    .insert({
      organisation_id: profile.organisation_id,
      klo_item_id: kloItemId,
      uploaded_by: profile.id,
      file_name: fileName,
      storage_path: storagePath,
      file_size: fileSize,
      mime_type: mimeType,
      scan_status: scanStatus,
    })

  if (error) return { success: false, error: 'Failed to save file record.' }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

export async function deleteEvidenceRecord(
  evidenceId: string,
  storagePath: string,
  kloItemId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()

  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role !== 'admin') {
    return { success: false, error: 'Only admins can delete files.' }
  }

  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from('evidence')
    .remove([storagePath])

  if (storageError) return { success: false, error: 'Failed to delete file from storage.' }

  // Delete metadata row
  const { error: dbError } = await supabase
    .from('kloe_evidence')
    .delete()
    .eq('id', evidenceId)

  if (dbError) return { success: false, error: 'Failed to delete file record.' }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}
