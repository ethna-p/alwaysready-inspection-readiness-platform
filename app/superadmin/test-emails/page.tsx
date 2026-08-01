'use client'

import { useState, useTransition } from 'react'
import { sendTestEmails, type TestEmailResult } from './actions'

export default function TestEmailsPage() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent]     = useState<number | null>(null)
  const [count, setCount]   = useState<number | null>(null)
  const [failed, setFailed] = useState<TestEmailResult[]>([])
  const [error, setError]   = useState<string | null>(null)

  function handleSend() {
    setError(null)
    setSent(null)
    startTransition(async () => {
      try {
        const result = await sendTestEmails()
        setSent(result.sent)
        setCount(result.count)
        setFailed(result.failed)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Send test emails</h1>
      <p className="text-ink-muted text-sm mb-8">
        Sends one of every platform email type to your inbox so you can review content and formatting.
        All subjects are prefixed with <code className="bg-fill-dim px-1 rounded text-xs">[TEST]</code>.
      </p>

      {sent === null ? (
        <button
          onClick={handleSend}
          disabled={isPending}
          className="bg-[#014D4E] hover:bg-[#00b8a6] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Send all test emails'}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-line rounded-lg p-6">
            <div className="text-5xl font-bold text-[#00b8a6] mb-1">{sent}</div>
            <div className="text-ink-muted text-sm">
              of {count} emails sent successfully
            </div>
            {failed.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium text-red-500">Failed:</p>
                {failed.map((f, i) => (
                  <p key={i} className="text-xs text-ink-muted">
                    {f.subject}{f.error ? ` — ${f.error}` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setSent(null); setFailed([]) }}
            className="text-sm text-[#00b8a6] hover:underline"
          >
            Send again
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
