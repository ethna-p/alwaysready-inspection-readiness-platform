'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink border border-line rounded-lg px-3 py-1.5 bg-card hover:bg-fill transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13" height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isPending ? 'animate-spin' : ''}
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
      {isPending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
