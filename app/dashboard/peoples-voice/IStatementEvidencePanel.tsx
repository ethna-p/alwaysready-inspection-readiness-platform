'use client'

/**
 * IStatementEvidencePanel — upload, list, and delete evidence files
 * attached to an "I" statement.
 *
 * Upload flow:
 *   1. User selects a file via the file input.
 *   2. File is sent to /api/upload-i-statement-evidence.
 *   3. API: authenticates, validates MIME type via magic bytes,
 *      scans for malware via Cloudmersive, uploads to Supabase Storage.
 *   4. On success, saveIStatementEvidenceRecord saves the metadata.
 *   5. File appears optimistically in the list.
 *
 * Governance: governance/policy documents only — no clinical records.
 */

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveIStatementEvidenceRecord, deleteIStatementEvidenceRecord, getIStatementEvidenceDownloadUrl } from './evidence-actions'

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export interface IStatementEvidenceFileItem {
  id:               string
  file_name:        string
  storage_path:     string
  file_size:        number | null
  mime_type:        string | null
  uploaded_at:      string
  uploaded_by_name: string | null
  scan_status:      string
}

interface Props {
  iStatementId:  string
  initialFiles:  IStatementEvidenceFileItem[]
  isAdmin:       boolean
  canUpload:     boolean
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function IStatementEvidencePanel({
  iStatementId,
  initialFiles,
  isAdmin,
  canUpload,
}: Props) {
  const [files,       setFiles]       = useState<IStatementEvidenceFileItem[]>(initialFiles)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('File is too large. Maximum size is 10 MB.')
      return
    }

    setUploading(true)

    const form = new FormData()
    form.append('file', file)
    form.append('iStatementId', iStatementId)

    let uploadResponse: Response
    try {
      uploadResponse = await fetch('/api/upload-i-statement-evidence', {
        method: 'POST',
        body: form,
      })
    } catch {
      setUploadError('Upload failed. Please check your connection and try again.')
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const uploadData = await uploadResponse.json() as {
      storagePath?: string
      fileName?:   string
      fileSize?:   number
      mimeType?:   string
      scanStatus?: string
      error?:      string
    }

    if (!uploadResponse.ok || !uploadData.storagePath) {
      setUploadError(uploadData.error ?? 'Upload failed. Please try again.')
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { storagePath, fileSize, mimeType } = uploadData

    const result = await saveIStatementEvidenceRecord(
      iStatementId,
      file.name,
      storagePath,
      fileSize ?? file.size,
      mimeType ?? file.type,
      // scanStatus is no longer accepted — the server action always writes 'clean'
    )

    if (!result.success) {
      // Clean up orphaned storage file (best effort)
      const supabase = createClient()
      await supabase.storage.from('evidence').remove([storagePath])
      setUploadError(result.error)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Optimistic update
    setFiles(prev => [
      {
        id:               crypto.randomUUID(),
        file_name:        file.name,
        storage_path:     storagePath,
        file_size:        file.size,
        mime_type:        file.type,
        uploaded_at:      new Date().toISOString(),
        uploaded_by_name: 'You',
        scan_status:      'clean',
      },
      ...prev,
    ])

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(evidenceId: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeletingId(evidenceId)
    const result = await deleteIStatementEvidenceRecord(evidenceId)
    if (result.success) {
      setFiles(prev => prev.filter(f => f.id !== evidenceId))
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  async function handleDownload(evidenceId: string, fileName: string) {
    // Server action verifies scan_status before issuing a signed URL — non-clean
    // files are blocked server-side, not just hidden in the UI.
    const result = await getIStatementEvidenceDownloadUrl(evidenceId)
    if (!result.success) {
      alert(result.error)
      return
    }
    const a   = document.createElement('a')
    a.href     = result.url
    a.download = fileName
    a.click()
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <p className="text-xs font-semibold text-ink-dim mb-3 uppercase tracking-wide">Evidence files</p>

      {/* Governance notice */}
      <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
        <span>
          <strong>Governance documents only.</strong> Do not upload anything containing resident-specific clinical information, care plans, or personal health records.
        </span>
      </div>

      {/* Upload button */}
      {canUpload && (
        <div className="mb-4">
          <label
            htmlFor={`i-stmt-upload-${iStatementId}`}
            className={`
              inline-flex items-center gap-2 cursor-pointer
              bg-[#014D4E] text-white text-xs font-medium
              px-3 py-1.5 rounded-lg
              hover:bg-[#013838]
              focus-within:ring-2 focus-within:ring-[#014D4E] focus-within:ring-offset-2
              transition-colors
              ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <span aria-hidden="true">↑</span>
            {uploading ? 'Uploading…' : 'Upload file'}
            <input
              id={`i-stmt-upload-${iStatementId}`}
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              disabled={uploading}
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload evidence file"
            />
          </label>
          <p className="mt-1 text-xs text-ink-muted">
            PDF, Word (.docx), Excel (.xlsx), JPG, or PNG — max 10 MB.
          </p>
          {uploadError && (
            <p role="alert" className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-xs text-ink-muted">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-2" aria-label="Uploaded evidence files">
          {files.map(f => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 bg-fill border border-line rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">{f.file_name}</p>
                <p className="text-[10px] text-ink-muted mt-0.5">
                  {formatBytes(f.file_size)}{f.file_size ? ' · ' : ''}{formatDate(f.uploaded_at)}
                  {f.uploaded_by_name ? ` · ${f.uploaded_by_name}` : ''}
                </p>
                {f.scan_status === 'clean' && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                    <span aria-hidden="true">🛡</span> Scanned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(f.id, f.file_name)}
                  className="text-xs font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
                >
                  Download
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                    aria-label={`Delete ${f.file_name}`}
                    className="text-xs font-medium text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded disabled:opacity-50"
                  >
                    {deletingId === f.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
