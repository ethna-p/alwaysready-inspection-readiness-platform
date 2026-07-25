'use client'

import { useState, useTransition } from 'react'
import { setCharityStatus } from './actions'

interface Props {
  orgId: string
  isCharity: boolean
}

export default function CharityToggleButton({ orgId, isCharity }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await setCharityStatus(orgId, !isCharity)
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isCharity
            ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            : 'bg-fill border-line text-ink-muted hover:bg-fill-dim'
        }`}
      >
        {pending
          ? 'Saving…'
          : isCharity
          ? '✓ Charity discount on'
          : 'Apply charity discount'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
