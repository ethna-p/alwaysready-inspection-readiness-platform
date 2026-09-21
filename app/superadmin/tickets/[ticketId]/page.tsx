/**
 * /superadmin/tickets/[ticketId] — ticket detail + reply form for AJ.
 */
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import StaffReplyForm, { type TicketCategory } from './StaffReplyForm'

/** Classify a ticket so the reply form can show the right controls. */
function detectCategory(subject: string, message: string): TicketCategory {
  const text = `${subject} ${message}`.toLowerCase()
  if (
    text.includes('delete') || text.includes('deletion') ||
    text.includes('erasure') || text.includes('right to be forgotten') ||
    text.includes('remove my data') || text.includes('remove my account')
  ) return 'data-deletion'
  if (
    text.includes('subject access') || text.includes(' sar') ||
    text.includes('dsar') || text.includes('right to access') ||
    text.includes('copy of my data') || text.includes('what data')
  ) return 'subject-access-request'
  return 'general'
}

type Props = { params: Promise<{ ticketId: string }> }

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
]

const STATUS_COLOURS: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved:    'bg-green-100 text-green-700',
}

export default async function SuperadminTicketPage({ params }: Props) {
  const { ticketId } = await params
  const supabase = createAdminClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select(`
      id, reference, subject, message, status, staff_initiated, source,
      external_name, external_email, created_at,
      organisations ( name ),
      submitted_by
    `)
    .eq('id', ticketId)
    .single()

  if (!ticket) notFound()

  const { data: replies } = await supabase
    .from('support_ticket_replies')
    .select('id, message, is_staff_reply, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  // Fetch submitter name (only when ticket was submitted by a customer user)
  const submitter = ticket.submitted_by
    ? (await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', ticket.submitted_by)
        .single()
      ).data
    : null

  const t         = ticket as unknown as {
    staff_initiated: boolean
    source: string
    external_name: string | null
    external_email: string | null
    organisations: { name: string } | null
  }
  const isWebsite = t.source === 'website' || t.source === 'website_contact'
  const isEmail   = t.source === 'email'
  const isExternal = isWebsite || isEmail
  const orgName   = isExternal
    ? (t.external_name ?? (isEmail ? 'Sales enquiry' : 'Website enquiry'))
    : (t.organisations?.name ?? '—')
  const status   = ticket.status
  const category = detectCategory(ticket.subject ?? '', ticket.message ?? '')
  const created = new Date(ticket.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // Label for the original ticket message when it's shown inline in the
  // conversation thread below, matching how a reply's own author is labelled.
  const originalAuthorLabel = t.staff_initiated
    ? 'You (AlwaysReady)'
    : isExternal
      ? (t.external_name ?? 'Customer')
      : (submitter?.full_name ?? submitter?.email ?? 'Customer')

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <Link
        href="/superadmin/tickets"
        className="text-sm text-ink-muted hover:text-brand mb-6 block"
      >
        ← All tickets
      </Link>

      <div className="flex flex-col gap-6">

      {/* Header — identifying details only; the original message itself
          moves into the conversation thread below, so it reads in the same
          newest-first order as replies rather than sitting apart from them. */}
      <div className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-ink-muted font-mono mb-1">{ticket.reference}</p>
            <h1 className="text-xl font-bold text-ink">{ticket.subject}</h1>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOURS[status] ?? ''}`}>
            {STATUS_OPTIONS.find(s => s.value === status)?.label ?? status}
          </span>
        </div>

        <dl className="text-xs text-ink-muted space-y-1">
          {isExternal ? (
            <>
              <div className="flex gap-2">
                <dt className="text-ink-muted">Source</dt>
                <dd>
                  {isEmail
                    ? <span className="font-semibold text-purple-700">Inbound email (support@alwaysready.uk)</span>
                    : <span className="font-semibold text-amber-700">Website enquiry</span>
                  }
                </dd>
              </div>
              <div className="flex gap-2"><dt className="text-ink-muted">Name</dt><dd>{t.external_name ?? '—'}</dd></div>
              <div className="flex gap-2">
                <dt className="text-ink-muted">Email</dt>
                <dd>
                  <a href={`mailto:${t.external_email}`} className="text-[#00b8a6] hover:underline">
                    {t.external_email ?? '—'}
                  </a>
                </dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2"><dt className="text-ink-muted">Organisation</dt><dd>{orgName}</dd></div>
              <div className="flex gap-2">
                <dt className="text-ink-muted">Submitted by</dt>
                <dd>
                  {t.staff_initiated
                    ? <span className="text-[#00b8a6]">AlwaysReady (staff-initiated)</span>
                    : submitter?.full_name ?? submitter?.email ?? ticket.submitted_by ?? '—'}
                </dd>
              </div>
            </>
          )}
          <div className="flex gap-2"><dt className="text-ink-muted">Submitted</dt><dd>{created}</dd></div>
        </dl>
      </div>

      {/* Conversation — the original message (why this ticket exists) always
          leads, fully expanded. Replies follow underneath in chronological
          order, collapsed by default (<details>, no JS needed) so a long
          thread stays scannable; each expands individually on click. Placed
          above the reply form, inbox-style (message first, reply box
          underneath), not below it. */}
      <div>
        <p className="text-xs text-ink-muted uppercase tracking-wide mb-3">Conversation</p>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 ${
            t.staff_initiated
              ? 'bg-[#014D4E]/10 border border-[#00b8a6]/30'
              : 'bg-fill border border-line'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold ${t.staff_initiated ? 'text-[#00b8a6]' : 'text-ink-muted'}`}>
                {originalAuthorLabel}
              </span>
              <span className="text-xs text-ink-muted">{created}</span>
            </div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {(replies ?? []).map(reply => {
            const isStaff = reply.is_staff_reply
            const replyAt = new Date(reply.created_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            const preview = reply.message.length > 100 ? reply.message.slice(0, 100).trimEnd() + '…' : reply.message
            return (
              <details
                key={reply.id}
                className={`rounded-xl p-4 ${
                  isStaff
                    ? 'bg-[#014D4E]/10 border border-[#00b8a6]/30'
                    : 'bg-fill border border-line'
                }`}
              >
                <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className={`text-xs font-semibold ${isStaff ? 'text-[#00b8a6]' : 'text-ink-muted'}`}>
                    {isStaff ? 'You (AlwaysReady)' : 'Customer'}
                  </span>
                  <span className="text-xs text-ink-muted">{replyAt}</span>
                  <span className="text-sm text-ink-muted truncate">— {preview}</span>
                </summary>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap mt-2">{reply.message}</p>
              </details>
            )
          })}
        </div>
      </div>

      <StaffReplyForm
        ticketId={ticketId}
        currentStatus={status}
        ticketCategory={category}
      />

      </div>
    </div>
  )
}
