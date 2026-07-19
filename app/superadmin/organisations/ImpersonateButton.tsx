'use client'

import { useState } from 'react'
import { generateImpersonationLink } from './actions'

interface Props {
  adminEmail: string
  adminName: string | null
}

export default function ImpersonateButton({ adminEmail, adminName }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    const result = await generateImpersonationLink(adminEmail)
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    // Open in a new tab — preserves your superadmin session in this tab.
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Log in as ${adminName ?? adminEmail}`}
        className="
          bg-[#014D4E] hover:bg-[#00b8a6] text-white
          text-xs font-semibold px-4 py-2 rounded-lg
          transition-colors whitespace-nowrap
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Opening…' : 'View as admin →'}
      </button>
      {error && (
        <p className="text-red-600 text-xs max-w-[180px] text-right">{error}</p>
      )}
    </div>
  )
}
