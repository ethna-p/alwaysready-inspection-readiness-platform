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
  // scanStatus is intentionally NOT a parameter — the upload route only completes
  // successfully for files that passed the fail-closed malware scan, so every
  // record saved here is by definition clean. A client-supplied status would
  // allow callers to forge a 'clean' record for a file that was never scanned.
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
      scan_status:     'clean', // always set server-side — never trusted from client
    })

  if (error) return { success: false, error: 'Failed to save file record.' }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

export async function getIStatementEvidenceDownloadUrl(
  evidenceId: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { success: false, error: 'Not authenticated.' }

  const supabase = await createClient()

  const { data: record, error: fetchError } = await supabase
    .from('i_statement_evidence_files')
    .select('storage_path, scan_status, file_name')
    .eq('id', evidenceId)
    .eq('organisation_id', profile.organisation_id)
    .single()

  if (fetchError || !record) {
    return { success: false, error: 'File not found.' }
  }

  // Block downloads for files that did not pass the malware scan.
  if (record.scan_status !== 'clean') {
    return { success: false, error: 'This file is not available for download because it did not pass our security scan. Please contact support.' }
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('evidence')
    .createSignedUrl(record.storage_path, 60) // 60-second expiry

  if (signError || !signed?.signedUrl) {
    return { success: false, error: 'Could not generate download link. Please try again.' }
  }

  return { success: true, url: signed.signedUrl }
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
