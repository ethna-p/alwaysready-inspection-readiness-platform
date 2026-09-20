'use client'

import { useState, useTransition } from 'react'
import { deleteLead } from './actions'

export default function DeleteLeadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteLead(id)
      setError(result.success ? null : result.error)
    })
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-700 mt-1">
          {error}
        </p>
      )}
    </>
  )
}
