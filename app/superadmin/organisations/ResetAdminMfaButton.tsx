'use client'

import { useState, useTransition } from 'react'
import { resetOrgAdminMfa } from './actions'

interface Props {
  userId: string
  fullName: string
}

export default function ResetAdminMfaButton({ userId, fullName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{ success: true; message: string } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleReset() {
    setResult(null)
    startTransition(async () => {
      const res = await resetOrgAdminMfa(userId)
      setResult(res)
      if ('success' in res) setShowConfirm(false)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline transition-colors"
      >
        Reset MFA
      </button>

      {result && 'success' in result && (
        <p className="text-xs text-green-700 max-w-[220px] text-right">{result.message}</p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-base font-bold text-ink mb-2">Reset MFA for {fullName}?</h2>
            <p className="text-sm text-ink-dim mb-4">
              This removes their enrolled authenticator. Use this only when they&apos;re genuinely locked out
              with no other admin in their org and no backup codes left — they&apos;ll be prompted to set up
              two-factor authentication again on their next login.
            </p>

            {result && 'error' in result && (
              <p className="text-sm text-red-600 mb-4">{result.error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setResult(null) }}
                disabled={isPending}
                className="flex-1 border border-line text-sm font-medium text-ink px-4 py-2.5 rounded-lg hover:bg-fill disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="flex-1 bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Resetting…' : 'Reset MFA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
