'use server'

/**
 * Account -> Notifications (Issue #31).
 *
 * updateNotificationPreferences — self-service toggle for the two opt-in
 * cron emails (review reminders, governance digest). Also stamps
 * notification_prefs_confirmed_at, which is what the re-confirmation cron
 * (app/api/cron/notification-reconfirmation) checks to decide who's overdue
 * for a check-in -- visiting/saving this tab always counts as confirming,
 * whether or not anything actually changed.
 *
 * submitNotificationFeedback — the re-confirmation email's poll. Goes
 * through the admin client since notification_feedback has no RLS policies
 * granted to `authenticated` (same deliberate pattern as mfa_backup_codes).
 */
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type PrefsState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function updateNotificationPreferences(
  _prevState: PrefsState,
  formData: FormData
): Promise<PrefsState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'Not authenticated.' }

  const notifyReviewReminders = formData.get('notify_review_reminders') === 'on'
  const notifyGovernanceDigest = formData.get('notify_governance_digest') === 'on'

  const { error } = await supabase
    .from('users')
    .update({
      notify_review_reminders: notifyReviewReminders,
      notify_governance_digest: notifyGovernanceDigest,
      notification_prefs_confirmed_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { status: 'error', message: 'Failed to save. Please try again.' }

  revalidatePath('/dashboard/account')
  return { status: 'success' }
}

export type FeedbackState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function submitNotificationFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'Not authenticated.' }

  const USEFULNESS_VALUES = ['very_useful', 'somewhat_useful', 'not_useful'] as const
  type Usefulness = typeof USEFULNESS_VALUES[number]
  const usefulnessRaw = formData.get('usefulness') as string
  if (!USEFULNESS_VALUES.includes(usefulnessRaw as Usefulness)) {
    return { status: 'error', message: 'Please choose an option.' }
  }
  const usefulness = usefulnessRaw as Usefulness
  const suggestion = (formData.get('suggestion') as string | null)?.trim() || null

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { status: 'error', message: 'Could not find your account.' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('notification_feedback').insert({
    user_id: user.id,
    organisation_id: profile.organisation_id,
    usefulness,
    suggestion,
  })

  if (error) return { status: 'error', message: 'Failed to send feedback. Please try again.' }

  return { status: 'success' }
}
