'use client'

import { useTransition } from 'react'
import { deleteDemoLead } from './actions'

export default function DeleteDemoLeadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this demo lead? This cannot be undone.')) return
    startTransition(() => deleteDemoLead(id))
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
