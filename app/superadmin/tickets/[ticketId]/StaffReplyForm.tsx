/**
 * StaffReplyForm — client component for the superadmin ticket reply UI.
 *
 * - General tickets: a plain reply box.
 * - Data deletion / SAR tickets: a template picker to fill the reply box.
 */
'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  staffReply,
  updateTicketStatus,
  getTicketTemplate,
  type ReplyState,
  type GdprTemplateName,
} from './actions'

export type TicketCategory = 'general' | 'data-deletion' | 'subject-access-request'

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
]

// Templates shown per category
const DELETION_TEMPLATES: { value: GdprTemplateName; label: string }[] = [
  { value: 'data-deletion-acknowledgement', label: 'Acknowledgement + identity check' },
  { value: 'data-deletion-completed',       label: 'Deletion completed — confirmation' },
]

const SAR_TEMPLATES: { value: GdprTemplateName; label: string }[] = [
  { value: 'sar-acknowledgement', label: 'Acknowledgement + identity check' },
  { value: 'sar-fulfilled',       label: 'SAR fulfilled — data provided' },
  { value: 'sar-declined',        label: 'SAR declined — identity not verified' },
]

interface Props {
  ticketId:       string
  currentStatus:  string
  ticketCategory: TicketCategory
}

export default function StaffReplyForm({
  ticketId,
  currentStatus,
  ticketCategory,
}: Props) {
  const boundReply = staffReply.bind(null, ticketId)
  const [state, action, pending] = useActionState<ReplyState, FormData>(
    boundReply,
    { status: 'idle' }
  )

  const [message, setMessage]           = useState('')
  const [isLoadingTpl, startLoadingTpl] = useTransition()

  const handleLoadTemplate = (templateName: GdprTemplateName) => {
    startLoadingTpl(async () => {
      const text = await getTicketTemplate(ticketId, templateName)
      if (text) setMessage(text)
    })
  }

  const isGdpr      = ticketCategory !== 'general'
  const templates   = ticketCategory === 'data-deletion' ? DELETION_TEMPLATES : SAR_TEMPLATES
  const gdprLabel   = ticketCategory === 'data-deletion' ? 'Data deletion' : 'Subject access request'

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="bg-card border border-line rounded-xl p-4">
        <p className="text-xs text-ink-muted uppercase tracking-wide mb-3">Update status</p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <form key={opt.value} action={updateTicketStatus.bind(null, ticketId, opt.value)}>
              <button
                type="submit"
                disabled={opt.value === currentStatus}
                className={`
                  text-xs font-semibold px-3 py-1.5 rounded-lg
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                  ${opt.value === currentStatus
                    ? 'bg-[#00b8a6] text-[#1a1a1a] cursor-default'
                    : 'bg-fill-dim text-ink-muted hover:bg-fill-dim hover:text-ink'
                  }
                `}
              >
                {opt.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Reply form */}
      <div className="bg-card border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-ink-muted uppercase tracking-wide">Reply to customer</p>

          {isGdpr && (
            /* Template picker for GDPR tickets */
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-semibold">{gdprLabel}</span>
              <select
                disabled={isLoadingTpl}
                defaultValue=""
                onChange={e => {
                  const val = e.target.value as GdprTemplateName
                  if (val) handleLoadTemplate(val)
                  e.target.value = ''
                }}
                className="text-xs border border-line rounded-md px-2 py-1 bg-card text-ink cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-[#00b8a6] disabled:opacity-50"
              >
                <option value="" disabled>
                  {isLoadingTpl ? 'Loading…' : 'Load template…'}
                </option>
                {templates.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Template loaded indicator */}
        {isGdpr && message && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs text-ink-muted">Template loaded · edit before sending</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-700 mb-4">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <textarea
            name="message"
            required
            rows={14}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={isGdpr ? 'Select a template above, then edit…' : 'Type your reply here…'}
            className="
              w-full bg-card border border-line rounded-lg
              px-4 py-3 text-base text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              resize-y leading-relaxed
            "
          />
          <button
            type="submit"
            disabled={pending}
            className="
              bg-[#00b8a6] text-[#1a1a1a] font-semibold text-sm
              px-5 py-2.5 rounded-lg
              hover:bg-[#009d8e]
              focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2 focus:ring-offset-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {pending ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      </div>
    </div>
  )
}
