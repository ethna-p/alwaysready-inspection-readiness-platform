/**
 * /superadmin/tickets/[ticketId] — ticket detail + reply form for AJ.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import StaffReplyForm from './StaffReplyForm'

type Props = { params: Promise<{ ticketId: string }> }

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
]

const STATUS_COLOURS: Record<string, string> = {
  open:        'bg-blue-500/20 text-blue-300',
  in_progress: 'bg-amber-500/20 text-amber-300',
  resolved:    'bg-green-500/20 text-green-300',
}

export default async function SuperadminTicketPage({ params }: Props) {
  const { ticketId } = await params
  const supabase = createAdminClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select(`
      id, reference, subject, message, status, staff_initiated, created_at,
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

  const orgName = (ticket as unknown as { organisations: { name: string } | null }).organisations?.name ?? '—'
  const status  = ticket.status
  const created = new Date(ticket.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/superadmin/tickets"
        className="text-sm text-gray-400 hover:text-white mb-6 block"
      >
        ← All tickets
      </Link>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500 font-mono mb-1">{ticket.reference}</p>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOURS[status] ?? ''}`}>
            {STATUS_OPTIONS.find(s => s.value === status)?.label ?? status}
          </span>
        </div>

        <dl className="text-xs text-gray-400 space-y-1 mb-4">
          <div className="flex gap-2"><dt className="text-gray-600">Organisation</dt><dd>{orgName}</dd></div>
          <div className="flex gap-2">
            <dt className="text-gray-600">Submitted by</dt>
            <dd>
              {(ticket as unknown as { staff_initiated: boolean }).staff_initiated
                ? <span className="text-[#00b8a6]">AlwaysReady (staff-initiated)</span>
                : submitter?.full_name ?? submitter?.email ?? ticket.submitted_by ?? '—'}
            </dd>
          </div>
          <div className="flex gap-2"><dt className="text-gray-600">Submitted</dt><dd>{created}</dd></div>
        </dl>

        <div className={`rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap ${
          (ticket as unknown as { staff_initiated: boolean }).staff_initiated
            ? 'bg-[#014D4E]/30 border border-[#00b8a6]/20 text-gray-200'
            : 'bg-gray-800 text-gray-200'
        }`}>
          {ticket.message}
        </div>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="space-y-4 mb-6">
          {replies.map(reply => {
            const isStaff = reply.is_staff_reply
            const replyAt = new Date(reply.created_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            return (
              <div
                key={reply.id}
                className={`rounded-xl p-4 ${
                  isStaff
                    ? 'bg-[#014D4E]/30 border border-[#00b8a6]/30'
                    : 'bg-gray-900 border border-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold ${isStaff ? 'text-[#00b8a6]' : 'text-gray-400'}`}>
                    {isStaff ? 'You (AlwaysReady)' : 'Customer'}
                  </span>
                  <span className="text-xs text-gray-600">{replyAt}</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply form + status controls */}
      <StaffReplyForm ticketId={ticketId} currentStatus={status} />
    </div>
  )
}
