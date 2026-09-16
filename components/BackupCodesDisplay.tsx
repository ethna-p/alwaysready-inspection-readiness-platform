'use client'

/**
 * BackupCodesDisplay — shows a freshly generated batch of backup codes
 * exactly once (the server never returns a plaintext code again after
 * this). Shared between the post-enrolment step (mfa/setup/page.tsx) and
 * the "Regenerate backup codes" panel in Account → Security
 * (BackupCodesPanel.tsx) so the copy/download UI can't drift between them.
 */

import { useState } from 'react'

interface Props {
  codes: string[]
  onContinue: () => void
  continueLabel?: string
}

export default function BackupCodesDisplay({ codes, onContinue, continueLabel = 'Continue' }: Props) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context) —
      // the codes are already on screen, so this is a nice-to-have, not required.
    }
  }

  function handleDownload() {
    const blob = new Blob(
      [`AlwaysReady backup codes\nGenerated ${new Date().toLocaleString('en-GB')}\n\nEach code works once. Keep this somewhere safe.\n\n${codes.join('\n')}\n`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alwaysready-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-brand mb-1">Save your backup codes</h2>
      <p className="text-sm text-ink-dim mb-4">
        If you ever lose access to your authenticator app, use one of these codes to get back in.
        Each code works once. <strong className="text-ink">They&apos;re only shown here — save them now.</strong>
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-fill rounded-lg px-4 py-4 mb-4 font-mono text-sm text-ink">
        {codes.map(code => (
          <div key={code}>{code}</div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 text-xs font-medium border border-line rounded-lg px-3 py-2 hover:bg-fill transition-colors text-ink"
        >
          {copied ? 'Copied' : 'Copy all'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 text-xs font-medium border border-line rounded-lg px-3 py-2 hover:bg-fill transition-colors text-ink"
        >
          Download .txt
        </button>
      </div>

      <label className="flex items-start gap-2 mb-4 text-sm text-ink-dim">
        <input
          type="checkbox"
          checked={saved}
          onChange={e => setSaved(e.target.checked)}
          className="mt-0.5"
        />
        I&apos;ve saved these codes somewhere safe
      </label>

      <button
        type="button"
        onClick={onContinue}
        disabled={!saved}
        className="
          w-full rounded-lg bg-[#014D4E] text-white font-semibold
          py-2.5 text-sm hover:bg-[#013a3b]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
          disabled:opacity-60 disabled:cursor-not-allowed transition-colors
        "
      >
        {continueLabel}
      </button>
    </div>
  )
}
