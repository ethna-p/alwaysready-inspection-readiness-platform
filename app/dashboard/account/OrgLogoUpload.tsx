'use client'

/**
 * OrgLogoUpload — logo upload control for the Organisation settings tab.
 *
 * Accepts PNG, JPG, WebP, GIF, SVG up to 2 MB.
 * Uploads via POST /api/org-logo (multipart form data).
 * Displays a live preview; shows the current logo if one is already set.
 */

import { useRef, useState } from 'react'

interface Props {
  currentLogoUrl: string | null
}

export default function OrgLogoUpload({ currentLogoUrl }: Props) {
  const [preview, setPreview]   = useState<string | null>(currentLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)

    // Client-side size check
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large — maximum size is 2 MB.')
      return
    }

    // Local preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0]
    if (!file) { setError('Please choose a file first.'); return }

    setUploading(true)
    setError(null)
    setSuccess(null)

    const form = new FormData()
    form.append('logo', file)

    try {
      const res  = await fetch('/api/org-logo', { method: 'POST', body: form })
      const json = await res.json() as { logoUrl?: string; error?: string }

      if (!res.ok || json.error) {
        setError(json.error ?? 'Upload failed.')
      } else {
        setPreview(json.logoUrl ?? null)
        setSuccess('Logo saved. It will appear in the header after the next page load.')
        if (inputRef.current) inputRef.current.value = ''
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/org-logo', { method: 'DELETE' })
      if (!res.ok) { setError('Could not remove logo.'); return }
      setPreview(null)
      setSuccess('Logo removed.')
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      setError('Network error — please try again.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current / preview */}
      {preview ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Organisation logo preview"
            style={{ maxHeight: '64px', maxWidth: '260px', objectFit: 'contain' }}
            className="border border-line rounded-lg p-2 bg-white"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-none"
          >
            {removing ? 'Removing…' : 'Remove logo'}
          </button>
        </div>
      ) : (
        <div
          className="flex items-center justify-center w-40 h-16 border-2 border-dashed border-line rounded-lg text-xs text-ink-muted"
          aria-label="No logo uploaded"
        >
          No logo yet
        </div>
      )}

      {/* File input + upload button */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="org-logo-input">Choose logo file</label>
        <input
          id="org-logo-input"
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={handleFileChange}
          className="
            text-sm text-ink file:mr-3 file:py-1.5 file:px-3
            file:rounded-lg file:border file:border-line
            file:text-sm file:font-medium file:text-ink file:bg-fill
            hover:file:bg-card cursor-pointer
          "
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="
            px-4 py-1.5 rounded-lg bg-[#014D4E] text-white text-sm font-semibold
            hover:bg-[#013636] disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
            transition-colors
          "
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <p className="text-xs text-ink-muted">PNG, JPG, WebP, GIF, or SVG · Max 2 MB · Recommended height: 48–64 px</p>

      {error   && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {success && <p role="status" className="text-sm text-green-700">{success}</p>}
    </div>
  )
}
