/**
 * /dashboard/account — account settings page.
 * Available to all roles. Currently: password change only.
 * Phase 2: display name update, notification preferences.
 */
import { getCurrentUserProfile } from '@/lib/session'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = { title: 'Account Settings — AlwaysReady' }

export default async function AccountPage() {
  const profile = await getCurrentUserProfile()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Account settings</h1>
      <p className="text-sm text-gray-600 mb-8">
        Signed in as <span className="font-medium text-[#1a1a1a]">{profile?.full_name ?? 'Unknown'}</span>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Change password</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your current password, then choose a new one.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
