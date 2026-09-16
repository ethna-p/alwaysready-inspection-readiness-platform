'use client'

/**
 * NotificationsSection — Account -> Notifications (Issue #31).
 *
 * Opt-in toggles for the two operational cron emails (review reminders,
 * governance digest) plus a short feedback widget. Saving either form
 * counts as "confirming" preferences -- see actions.ts's own doc comment
 * on notification_prefs_confirmed_at.
 */

import { useActionState, useState } from 'react'
import {
  updateNotificationPreferences,
  submitNotificationFeedback,
  type PrefsState,
  type FeedbackState,
} from './notifications/actions'

interface Props {
  initialReviewReminders: boolean
  initialGovernanceDigest: boolean
}

const USEFULNESS_OPTIONS: { value: string; label: string }[] = [
  { value: 'very_useful', label: 'Very useful' },
  { value: 'somewhat_useful', label: 'Somewhat useful' },
  { value: 'not_useful', label: 'Not useful' },
]

export default function NotificationsSection({ initialReviewReminders, initialGovernanceDigest }: Props) {
  const [prefsState, prefsAction, prefsPending] = useActionState<PrefsState, FormData>(
    updateNotificationPreferences,
    { status: 'idle' }
  )
  const [feedbackState, feedbackAction, feedbackPending] = useActionState<FeedbackState, FormData>(
    submitNotificationFeedback,
    { status: 'idle' }
  )

  const [reviewReminders, setReviewReminders] = useState(initialReviewReminders)
  const [governanceDigest, setGovernanceDigest] = useState(initialGovernanceDigest)
  const [usefulness, setUsefulness] = useState('')

  return (
    <div className="space-y-6">
      {/* Preferences */}
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand mb-1">Email notifications</h2>
        <p className="text-sm text-ink-dim mb-4">
          These are off by default. Turn on the ones you want — you can change this anytime.
        </p>

        <form action={prefsAction} className="space-y-4">
          <label className="flex items-start gap-3 bg-fill rounded-lg px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              name="notify_review_reminders"
              checked={reviewReminders}
              onChange={e => setReviewReminders(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-ink">KLOE &amp; HR review reminders</span>
              <span className="block text-xs text-ink-dim mt-0.5">
                Due-soon and overdue reminders for KLOE reviews and HR records (DBS, supervision, appraisals, training).
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 bg-fill rounded-lg px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              name="notify_governance_digest"
              checked={governanceDigest}
              onChange={e => setGovernanceDigest(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Weekly governance digest</span>
              <span className="block text-xs text-ink-dim mt-0.5">
                A weekly summary of your organisation&apos;s inspection readiness.
              </span>
            </span>
          </label>

          {prefsState.status === 'error' && (
            <p className="text-sm text-red-600">{prefsState.message}</p>
          )}
          {prefsState.status === 'success' && (
            <p className="text-sm text-green-700">Saved.</p>
          )}

          <button
            type="submit"
            disabled={prefsPending}
            className="bg-[#014D4E] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#013a3b] disabled:opacity-50 transition-colors"
          >
            {prefsPending ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      </div>

      {/* Feedback */}
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand mb-1">How useful are these?</h2>
        <p className="text-sm text-ink-dim mb-4">
          Optional — help us make these notifications more useful.
        </p>

        {feedbackState.status === 'success' ? (
          <p className="text-sm text-green-700">Thanks for the feedback.</p>
        ) : (
          <form action={feedbackAction} className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {USEFULNESS_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    usefulness === opt.value
                      ? 'bg-[#014D4E] text-white border-[#014D4E]'
                      : 'bg-fill border-line text-ink-muted hover:bg-fill-dim'
                  }`}
                >
                  <input
                    type="radio"
                    name="usefulness"
                    value={opt.value}
                    checked={usefulness === opt.value}
                    onChange={() => setUsefulness(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <textarea
              name="suggestion"
              rows={3}
              placeholder="Any suggestions? (optional)"
              className="w-full bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            />

            {feedbackState.status === 'error' && (
              <p className="text-sm text-red-600">{feedbackState.message}</p>
            )}

            <button
              type="submit"
              disabled={feedbackPending || !usefulness}
              className="text-xs font-medium text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {feedbackPending ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
