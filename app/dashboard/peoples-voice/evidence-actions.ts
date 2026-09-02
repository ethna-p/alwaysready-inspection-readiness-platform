'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole, requireAdmin } from '@/lib/auth'

export async function saveIStatementEvidenceRecord(
  iStatementId: string,
  fileName: string,
  storagePath: string,
  fileSize: number,
  mimeType: string,
  scanStatus: string = 'clean',
): Promise<{ success: true } | { success: false; error: string }> {
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { success: false, error: 'Not authenticated or insufficient permissions.' }

  const supabase = await createClient()

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
): Promise<{ success: true } | { success: false; error: string }> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Only admins can delete files.' }

  const supabase = await createClient()

  // Fetch the record first to get the verified storage path from the DB —
  // never trust a client-supplied path for storage operations.
  // The org filter is defence-in-depth on top of RLS.
  const { data: record, error: fetchError } = await supabase
    .from('i_statement_evidence_files')
    .select('id, storage_path')
    .eq('id', evidenceId)
    .eq('organisation_id', profile.organisation_id)
    .single()

  if (fetchError || !record) {
    return { success: false, error: 'Evidence record not found or you do not have permission to delete it.' }
  }

  // Delete from storage using the path from the DB (not the client)
  const { error: storageError } = await supabase.storage
    .from('evidence')
    .remove([record.storage_path])

  if (storageError) return { success: false, error: 'Failed to delete file from storage.' }

  // Delete metadata row (scoped to org for defence-in-depth)
  const { error: dbError } = await supabase
    .from('i_statement_evidence_files')
    .delete()
    .eq('id', evidenceId)
    .eq('organisation_id', profile.organisation_id)

  if (dbError) return { success: false, error: 'Failed to delete file record.' }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}
