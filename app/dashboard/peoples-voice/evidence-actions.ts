'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

export async function saveIStatementEvidenceRecord(
  iStatementId: string,
  fileName: string,
  storagePath: string,
  fileSize: number,
  mimeType: string,
  scanStatus: string = 'clean',
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const profile  = await getCurrentUserProfile()

  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (!['admin', 'user'].includes(profile.role)) {
    return { success: false, error: 'You do not have permission to upload files.' }
  }

  const { error } = await supabase
    .from('i_statement_evidence_files')
    .insert({
      organisation_id: profile.organisation_id,
      i_statement_id:  iStatementId,
      uploaded_by:     profile.id,
      file_name:       fileName,
      storage_path:    storagePath,
      file_size:       fileSize,
      mime_type:       mimeType,
      scan_status:     scanStatus,
    })

  if (error) return { success: false, error: 'Failed to save file record.' }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

export async function deleteIStatementEvidenceRecord(
  evidenceId: string,
  storagePath: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const profile  = await getCurrentUserProfile()

  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role !== 'admin') {
    return { success: false, error: 'Only admins can delete files.' }
  }

  const { error: storageError } = await supabase.storage
    .from('evidence')
    .remove([storagePath])

  if (storageError) return { success: false, error: 'Failed to delete file from storage.' }

  const { error: dbError } = await supabase
    .from('i_statement_evidence_files')
    .delete()
    .eq('id', evidenceId)

  if (dbError) return { success: false, error: 'Failed to delete file record.' }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}
