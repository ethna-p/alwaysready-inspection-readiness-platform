'use client'

import { useState, useTransition } from 'react'
import { deleteResolvedTickets } from './actions'

export default function DeleteResolvedButton({ count }: { count: number }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (count === 0) return null

  function handleClick() {
    if (!confirm(`Permanently delete all ${count} resolved ticket${count !== 1 ? 's' : ''}? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteResolvedTickets()
      if (result.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return <p className="text-sm text-green-700">✓ Resolved tickets deleted.</p>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="
          text-sm font-semibold text-red-600
          border border-red-200 rounded-lg px-4 py-2
          hover:bg-red-50 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isPending ? 'Deleting…' : `Delete all resolved (${count})`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
