'use client'

import { useState, useTransition } from 'react'
import { setTesterStatus } from './actions'

interface Props {
  orgId: string
  isTester: boolean
}

export default function TesterToggleButton({ orgId, isTester }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await setTesterStatus(orgId, !isTester)
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isTester
            ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
            : 'bg-fill border-line text-ink-muted hover:bg-fill-dim'
        }`}
      >
        {pending
          ? 'Saving…'
          : isTester
          ? '✓ Tester account'
          : 'Mark as tester'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
