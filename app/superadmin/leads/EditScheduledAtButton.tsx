'use client'
import { useState, useTransition } from 'react'
import { updateScheduledAt } from './actions'

export default function EditScheduledAtButton({
  zeegBookingId,
  currentValue,
}: {
  zeegBookingId: string
  currentValue: string | null
}) {
  const [editing, setEditing]      = useState(false)
  const [value, setValue]          = useState(
    currentValue ? currentValue.slice(0, 16) : ''
  )
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="ml-1.5 text-ink-subtle hover:text-ink transition-colors"
        title="Edit scheduled time"
      >
        ✏️
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <input
        type="datetime-local"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="text-xs border border-line rounded px-1.5 py-0.5 bg-card text-ink"
      />
      <button
        disabled={pending || !value}
        onClick={() => startTransition(async () => {
          const result = await updateScheduledAt(zeegBookingId, new Date(value).toISOString())
          if (result.success) {
            setError(null)
            setEditing(false)
          } else {
            setError(result.error)
          }
        })}
        className="text-xs font-medium text-teal-700 hover:text-teal-900 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={() => { setError(null); setEditing(false) }}
        className="text-xs text-ink-muted hover:text-ink"
      >
        Cancel
      </button>
      {error && (
        <span role="alert" className="w-full text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  )
}
