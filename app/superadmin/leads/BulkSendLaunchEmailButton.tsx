'use client'

import { useState, useTransition } from 'react'
import { sendBulkLaunchEmail }     from './actions'

type Props = {
  emailNum:    9 | 10
  label:       string
  description: string
  count:       number
}

export default function BulkSendLaunchEmailButton({ emailNum, label, description, count }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [confirming, setConfirming] = useState(false)

  function handleFirstClick() {
    setConfirming(true)
  }

  function handleCancel() {
    setConfirming(false)
  }

  function handleConfirm() {
    setConfirming(false)
    startTransition(async () => {
      const res = await sendBulkLaunchEmail(emailNum)
      setResult(res)
    })
  }

  if (result) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-green-700">
          ✓ Sent to {result.sent} subscriber{result.sent !== 1 ? 's' : ''}
          {result.failed > 0 && ` (${result.failed} failed)`}
        </span>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-muted">
          Send to {count} subscriber{count !== 1 ? 's' : ''}?
        </span>
        <button
          onClick={handleConfirm}
          className="text-sm font-semibold px-3 py-1 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          Yes, send
        </button>
        <button
          onClick={handleCancel}
          className="text-sm text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleFirstClick}
        disabled={isPending || count === 0}
        className="text-sm font-semibold px-3 py-1.5 rounded border border-brand text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? 'Sending…' : label}
      </button>
      <p className="text-xs text-ink-muted mt-1">{description}</p>
    </div>
  )
}
