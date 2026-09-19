'use client'

import { useTransition } from 'react'
import { deletePipelineRow } from './actions'

export default function DeletePipelineRowButton({
  demoLeadId,
  zeegBookingId,
}: {
  demoLeadId: string | null
  zeegBookingId: string | null
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    startTransition(() => deletePipelineRow(demoLeadId, zeegBookingId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
