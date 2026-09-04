'use client'

import { useState, useTransition } from 'react'
import { sendTestEmailGroup, type EmailGroup, type TestEmailResult } from './actions'

interface Group {
  id: EmailGroup
  label: string
  description: string
  count: number
}

const GROUPS: Group[] = [
  { id: 'website',    label: 'Website auto-responders', description: 'Waitlist confirmation, contact acknowledgement, blog subscription', count: 3 },
  { id: 'trial',      label: '14-day trial sequence',   description: 'Password setup, welcome, days 1–14, subscription active, trial ended', count: 10 },
  { id: 'onboarding', label: '12-week onboarding',      description: 'Weekly platform tips sent to paying customers', count: 12 },
  { id: 'support',    label: 'Support tickets',         description: 'Ticket received, staff reply, ticket resolved', count: 3 },
  { id: 'kloe',       label: 'KLOE reminders',          description: 'KLOE assigned, due in 7 days, overdue', count: 3 },
  { id: 'hr',         label: 'HR reminders',            description: 'HR field due in 30 days, overdue', count: 2 },
  { id: 'account',    label: 'Account emails',          description: 'New user welcome with credentials', count: 1 },
  { id: 'waitlist',        label: 'Waitlist nurture (1–8)',   description: 'Welcome, founder story, feature spotlights, Beta Partner offer', count: 8 },
  { id: 'waitlist-launch', label: 'Waitlist launch (9–10)',  description: 'Framework published, open for business — send manually from Leads page', count: 2 },
  { id: 'data-deletion',          label: 'Data deletion',              description: 'Request received (identity verification), 3-day warning, deletion confirmed', count: 3 },
  { id: 'subject-access-request', label: 'Subject access request',     description: 'Acknowledgement + identity verification, SAR fulfilled (data pack), SAR declined', count: 3 },
]

interface GroupState {
  sent: number | null
  count: number | null
  failed: TestEmailResult[]
  error: string | null
}

export default function TestEmailsPage() {
  const [states, setStates] = useState<Record<string, GroupState>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleSend(groupId: EmailGroup) {
    setPending(groupId)
    setStates(prev => ({ ...prev, [groupId]: { sent: null, count: null, failed: [], error: null } }))
    startTransition(async () => {
      try {
        const result = await sendTestEmailGroup(groupId)
        setStates(prev => ({
          ...prev,
          [groupId]: { sent: result.sent, count: result.count, failed: result.failed, error: null },
        }))
      } catch (e) {
        setStates(prev => ({
          ...prev,
          [groupId]: { sent: null, count: null, failed: [], error: e instanceof Error ? e.message : 'Something went wrong.' },
        }))
      } finally {
        setPending(null)
      }
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Send test emails</h1>
        <p className="text-ink-muted text-sm">
          Send any group to your inbox to review content and formatting.
          All subjects are prefixed with <code className="bg-fill-dim px-1 rounded text-xs">[TEST]</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {GROUPS.map(group => {
          const state   = states[group.id]
          const loading = pending === group.id
          const done    = state != null && state.sent !== null

          return (
            <div key={group.id} className="bg-card border border-line rounded-lg p-5 flex flex-col gap-3">
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm mb-0.5">{group.label}</p>
                <p className="text-xs text-ink-muted">{group.description}</p>
                <p className="text-xs text-ink-muted mt-1">{group.count} email{group.count !== 1 ? 's' : ''}</p>
              </div>

              {state?.error && (
                <p className="text-xs text-red-500">{state.error}</p>
              )}

              {done ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#00b8a6] font-medium">
                    {state.sent}/{state.count} sent
                    {state.failed.length > 0 && (
                      <span className="text-red-500 ml-2">({state.failed.length} failed)</span>
                    )}
                  </span>
                  <button
                    onClick={() => setStates(prev => ({ ...prev, [group.id]: { sent: null, count: null, failed: [], error: null } }))}
                    className="text-xs text-ink-muted hover:text-ink underline"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSend(group.id)}
                  disabled={loading || !!pending}
                  className="w-full bg-[#014D4E] hover:bg-[#00b8a6] text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {loading ? 'Sending…' : 'Send'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Send all */}
      <div className="border-t border-line pt-6">
        {(() => {
          const state   = states['all']
          const loading = pending === 'all'
          const done    = state != null && state.sent !== null
          return done ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#00b8a6] font-medium">{state.sent}/{state.count} emails sent</span>
              <button
                onClick={() => setStates(prev => ({ ...prev, all: { sent: null, count: null, failed: [], error: null } }))}
                className="text-xs text-ink-muted hover:text-ink underline"
              >
                Reset
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSend('all')}
              disabled={!!pending}
              className="bg-fill-dim hover:bg-line text-ink text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {loading ? 'Sending all…' : 'Send all groups'}
            </button>
          )
        })()}
      </div>
    </div>
  )
}
