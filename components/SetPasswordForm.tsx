'use client'

/**
 * Shared "choose a new password" form — the fields, validation, and markup
 * used where a user sets a password directly (no current-password
 * re-verification, unlike the voluntary account-settings change flow in
 * app/dashboard/account/ChangePasswordForm.tsx, which is a genuinely
 * different shape and stays separate):
 *
 *   - app/login/new-password/page.tsx — after a password-reset email link
 *
 * The caller owns what happens after a successful submit (redirect,
 * success screen, etc.) via the `onSubmit` callback —
 * this component only owns the fields, validation, and the pending/error
 * states around calling it.
 */

import { useState } from 'react'

export interface SetPasswordFormProps {
  /** Called once client-side validation passes. Return `{ error }` to show it inline. */
  onSubmit: (password: string) => Promise<{ error?: string }>
  submitLabel?: string
  loadingLabel?: string
}

export default function SetPasswordForm({
  onSubmit,
  submitLabel = 'Set new password',
  loadingLabel = 'Saving…',
}: SetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await onSubmit(password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    // Success: intentionally leave loading=true (button stays disabled) —
    // the caller is about to redirect, show a success view, or otherwise
    // navigate away, so there's nothing to re-enable the form for.
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="new-password" className="block text-sm font-medium text-ink mb-1">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="
            w-full rounded-lg border border-line px-3 py-2
            text-ink text-sm bg-card
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
          "
        />
        <p className="text-sm text-ink-dim mt-1">At least 8 characters.</p>
      </div>

      <div className="mb-6">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-ink mb-1">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="
            w-full rounded-lg border border-line px-3 py-2
            text-ink text-sm bg-card
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
          "
        />
      </div>

      <button
        type="submit"
        disabled={loading || password.length < 8 || confirm.length < 8}
        className="
          w-full rounded-lg bg-[#014D4E] text-white font-semibold
          py-2.5 text-sm
          hover:bg-[#013a3b]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  )
}
