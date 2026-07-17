'use client'

/**
 * EvidencePanel — upload, list, and delete evidence files for a KLOE.
 *
 * Upload flow:
 *   1. User selects a file via the file input.
 *   2. File is sent to /api/upload-evidence (Next.js API route).
 *   3. API route: authenticates, validates MIME type via magic bytes,
 *      scans for malware via Cloudmersive, then uploads to Supabase Storage.
 *   4. On success, calls saveEvidenceRecord server action to log metadata.
 *   5. Page revalidates and the new file appears in the list.
 *
 * Governance note: displayed prominently per PROJECT_BRIEF constraint —
 * never store clinical or resident-specific documents.
 */

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveEvidenceRecord, deleteEvidenceRecord } from './evidence-actions'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]
const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export interface EvidenceFile {
  id: string
  file_name: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_at: string
  uploaded_by_name: string | null
  scan_status: string
}

interface Props {
  kloItemId: string
  organisationId: string
  initialFiles: EvidenceFile[]
  isAdmin: boolean
  canUpload: boolean // admin or user role
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

export default function EvidencePanel({
  kloItemId,
  organisationId,
  initialFiles,
  isAdmin,
  canUpload,
}: Props) {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // Basic client-side size check (server enforces this too)
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('File is too large. Maximum size is 10 MB.')
      return
    }

    setUploading(true)

    // Send to our API route — it validates MIME type, scans for malware,
    // then uploads to Supabase Storage using the service role key
    const form = new FormData()
    form.append('file', file)
    form.append('kloItemId', kloItemId)

    let uploadResponse: Response
    try {
      uploadResponse = await fetch('/api/upload-evidence', {
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
      fileName?: string
      fileSize?: number
      mimeType?: string
      scanStatus?: string
      error?: string
    }

    if (!uploadResponse.ok || !uploadData.storagePath) {
      setUploadError(uploadData.error ?? 'Upload failed. Please try again.')
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { storagePath, fileSize, mimeType, scanStatus = 'clean' } = uploadData

    const result = await saveEvidenceRecord(
      kloItemId,
      file.name,
      storagePath,
      fileSize ?? file.size,
      mimeType ?? file.type,
      scanStatus
    )

    if (!result.success) {
      // Clean up orphaned storage file via admin (best effort)
      const supabase = createClient()
      await supabase.storage.from('evidence').remove([storagePath])
      setUploadError(result.error)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Optimistically add to list (page will revalidate in the background)
    setFiles(prev => [
      {
        id: crypto.randomUUID(),
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        uploaded_by_name: 'You',
        scan_status: scanStatus,
      },
      ...prev,
    ])

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(evidenceId: string, storagePath: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeletingId(evidenceId)
    const result = await deleteEvidenceRecord(evidenceId, storagePath, kloItemId)
    if (result.success) {
      setFiles(prev => prev.filter(f => f.id !== evidenceId))
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  async function handleDownload(storagePath: string, fileName: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('evidence')
      .download(storagePath)

    if (error || !data) {
      alert('Could not download file. Please try again.')
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Governance notice */}
      <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
        <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
        <span>
          <strong>Governance documents only.</strong> Do not upload anything containing resident-specific clinical information, care plans, or personal health records.
        </span>
      </div>

      {/* Upload button */}
      {canUpload && (
        <div className="mb-5">
          <label
            htmlFor="evidence-upload"
            className={`
              inline-flex items-center gap-2 cursor-pointer
              bg-[#014D4E] text-white text-sm font-medium
              px-4 py-2 rounded-lg
              hover:bg-[#013838]
              focus-within:ring-2 focus-within:ring-[#014D4E] focus-within:ring-offset-2
              transition-colors
              ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <span aria-hidden="true">↑</span>
            {uploading ? 'Uploading…' : 'Upload file'}
            <input
              id="evidence-upload"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              disabled={uploading}
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload evidence file"
            />
          </label>
          <p className="mt-1.5 text-xs text-gray-500">
            PDF, Word, Excel, or image. Maximum 10 MB.
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
        <p className="text-sm text-gray-500">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-2" aria-label="Uploaded evidence files">
          {files.map(f => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">{f.file_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatBytes(f.file_size)}{f.file_size ? ' · ' : ''}{formatDate(f.uploaded_at)}
                  {f.uploaded_by_name ? ` · ${f.uploaded_by_name}` : ''}
                </p>
                {f.scan_status === 'clean' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                    <span aria-hidden="true">🛡</span> Scanned for viruses
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(f.storage_path, f.file_name)}
                  className="text-xs font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
                >
                  Download
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id, f.storage_path)}
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
