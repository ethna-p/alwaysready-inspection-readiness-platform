'use client'

/**
 * BackupCodesPanel — Account → Security. Shown only once MFA is enrolled
 * (rendered by MfaSection.tsx). Lets a user generate or regenerate their
 * backup codes proactively, before they're ever locked out — the actual
 * recovery-time use of a code happens on /login/mfa (MfaVerifyStep.tsx),
 * this panel is the "make sure you have some saved" side of the feature.
 */

import { useState, useEffect } from 'react'
import { generateBackupCodesForCurrentUser, getBackupCodeCount } from './mfa/actions'
import BackupCodesDisplay from '@/components/BackupCodesDisplay'

export default function BackupCodesPanel() {
  const [count, setCount] = useState<number | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getBackupCodeCount().then(setCount)
  }, [])

  async function handleGenerate() {
    if (count && count > 0) {
      if (!confirm('Generating new backup codes will make your existing codes stop working. Continue?')) return
    }

    setError(null)
    setGenerating(true)
    const result = await generateBackupCodesForCurrentUser()
    setGenerating(false)

    if ('error' in result) {
      setError(result.error)
      return
    }
    setCodes(result.codes)
  }

  if (codes) {
    return (
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <BackupCodesDisplay
          codes={codes}
          continueLabel="Done"
          onContinue={() => {
            setCodes(null)
            setCount(10)
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-base font-semibold text-brand">Backup codes</h2>
        {count !== null && count > 0 && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Saved</span>
        )}
      </div>
      <p className="text-sm text-ink-dim mb-4">
        One-time codes you can use to get back in if you ever lose access to your authenticator app.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {count === null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          {count === 0 && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              No backup codes saved. If you lose your authenticator app with no codes saved, you&apos;ll need another admin
              in your organisation to reset your MFA for you.
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
          >
            {generating ? 'Generating…' : count > 0 ? 'Regenerate backup codes' : 'Generate backup codes'}
          </button>
        </>
      )}
    </div>
  )
}
