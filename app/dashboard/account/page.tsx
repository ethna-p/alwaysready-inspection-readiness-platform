/**
 * /dashboard/account — account settings page.
 * Available to all roles.
 */
import { getCurrentUserProfile } from '@/lib/session'
import ChangePasswordForm from './ChangePasswordForm'
import PersonalContactForm from './PersonalContactForm'

export const metadata = { title: 'Account Settings — AlwaysReady' }

export default async function AccountPage() {
  const profile = await getCurrentUserProfile()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Account settings</h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium text-[#1a1a1a]">{profile?.full_name ?? 'Unknown'}</span>
        </p>
      </div>

      {/* ── Change password ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Change password</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your current password, then choose a new one.
        </p>
        <ChangePasswordForm />
      </div>

      {/* ── Personal contact details ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Notification contact details</h2>
        <p className="text-sm text-gray-600 mb-6">
          Add a personal email or mobile number to receive notifications. These are separate from your login credentials.
        </p>
        <PersonalContactForm
          personalEmail={profile?.personal_email ?? null}
          mobileNumber={profile?.mobile_number ?? null}
        />
      </div>
    </div>
  )
}
