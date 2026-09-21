'use client'

import { useState, useTransition } from 'react'
import { deletePipelineRow } from './actions'

export default function DeletePipelineRowButton({
  demoLeadId,
  zeegBookingId,
}: {
  demoLeadId: string | null
  zeegBookingId: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deletePipelineRow(demoLeadId, zeegBookingId)
      setError(result.success ? null : result.error)
    })
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
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
