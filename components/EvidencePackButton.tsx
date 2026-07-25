'use client'

/**
 * EvidencePackButton
 *
 * Client component — hits /api/evidence-pack, receives the PDF, and
 * triggers a browser download. Placed on the dashboard alongside the
 * Inspection Pack link.
 */
import { useState } from 'react'

export default function EvidencePackButton() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/evidence-pack')
      if (!res.ok) {
        setError('Could not generate the Evidence Pack. Please try again.')
        return
      }
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      const filename = res.headers.get('Content-Disposition')
        ?.match(/filename="([^"]+)"/)?.[1] ?? 'evidence-pack.pdf'
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Could not generate the Evidence Pack. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="
          inline-flex items-center gap-2
          bg-card border border-[#014D4E] text-brand
          text-sm font-semibold
          px-4 py-2 rounded-lg
          hover:bg-[#014D4E] hover:text-white
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
          transition-colors
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Download Evidence Pack
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
