'use client'

/**
 * /dashboard/account/change-password — mandatory password change.
 *
 * Reached automatically by middleware when public.users.must_change_password
 * is true — i.e. an admin reset this user's password for them
 * (resetTeamMemberPassword) and they're still on the admin-generated one.
 *
 * Standalone layout (outside the dashboard chrome), same treatment as the
 * mandatory MFA setup page — no nav to wander off through before this is
 * done.
 *
 * Flow:
 *   1. User enters and confirms a new password.
 *   2. supabase.auth.updateUser({ password }) — they already hold a normal
 *      authenticated session (password + MFA), so this is a direct update,
 *      not a recovery-link flow like /login/new-password.
 *   3. Clear must_change_password so middleware stops redirecting here.
 *   4. Redirect to /dashboard.
 */

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const supabase = createClient()

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

    const { data: { user }, error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError || !user) {
      setError('Could not set your new password. Please try again.')
      setLoading(false)
      return
    }

    const { error: flagError } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)

    if (flagError) {
      // Password is already changed at this point — don't block the user on
      // a flag update failing. Log it; worst case they see this page once more.
      console.error('[change-password] failed to clear must_change_password:', flagError.message)
    }

    // Hard-navigate so middleware picks up the cleared flag on the next request
    // rather than relying on a soft client-side transition.
    window.location.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="px-6 py-4">
        <Image src="/alwaysready-logo.svg" alt="AlwaysReady" width={220} height={48} style={{ height: 'auto' }} priority />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-sm border border-line p-8">
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <strong>Action required.</strong> Your password was reset by an admin. Please choose a new one to continue.
          </div>

          <h1 className="text-2xl font-bold text-brand mb-1">Choose a new password</h1>
          <p className="text-sm text-ink-dim mb-6">
            This replaces the temporary password you were given.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
