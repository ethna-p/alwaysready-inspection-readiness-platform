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

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import SetPasswordForm from '@/components/SetPasswordForm'
import { reportDbError } from '@/lib/db-errors'

export default function ChangePasswordPage() {
  const supabase = createClient()

  async function handleSetPassword(password: string): Promise<{ error?: string }> {
    const { data: { user }, error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError || !user) {
      return { error: 'Could not set your new password. Please try again.' }
    }

    const { error: flagError } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)

    if (flagError) {
      // Password is already changed at this point — don't block the user on
      // a flag update failing. Log it; worst case they see this page once more.
      reportDbError(flagError, 'change-password: clear must_change_password')
    }

    // Hard-navigate so middleware picks up the cleared flag on the next request
    // rather than relying on a soft client-side transition.
    window.location.replace('/dashboard')
    return {}
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

          <SetPasswordForm onSubmit={handleSetPassword} />
        </div>
      </main>
    </div>
  )
}
