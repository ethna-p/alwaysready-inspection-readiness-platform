/**
 * /dashboard/support/[ticketId] — ticket thread view (user side).
 */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ ticketId: string }> }

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  open:        { label: 'Open',        colour: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In progress', colour: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    colour: 'bg-green-100 text-green-700' },
}

export default async function TicketThreadPage({ params }: Props) {
  const { ticketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, reference, subject, message, status, created_at, submitted_by')
    .eq('id', ticketId)
    .single()

  if (!ticket) notFound()

  const { data: replies } = await supabase
    .from('support_ticket_replies')
    .select('id, message, is_staff_reply, created_at, sent_by')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const status = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.open
  const createdAt = new Date(ticket.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/support" className="hover:text-[#014D4E] underline">Support</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">{ticket.reference}</li>
        </ol>
      </nav>

      {/* Ticket header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">{ticket.reference}</p>
            <h1 className="text-xl font-bold text-[#014D4E]">{ticket.subject}</h1>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.colour}`}>
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Submitted {createdAt}</p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
          {ticket.message}
        </div>
      </div>

      {/* Replies thread */}
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
                    ? 'bg-[#e6faf8] border border-[#00b8a6]/30'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold ${isStaff ? 'text-[#014D4E]' : 'text-gray-500'}`}>
                    {isStaff ? 'AlwaysReady Support' : 'You'}
                  </span>
                  <span className="text-xs text-gray-400">{replyAt}</span>
                </div>
                <p className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
                  {reply.message}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolved notice or reply prompt */}
      {ticket.status === 'resolved' ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          This ticket has been resolved. If you need further help,{' '}
          <Link href="/dashboard/support/new" className="underline font-medium">
            open a new ticket
          </Link>
          .
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
          We&apos;ll reply here as soon as possible. You&apos;ll be able to see our response on this page.
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/support"
          className="text-sm font-medium text-[#014D4E] hover:underline"
        >
          ← Back to support
        </Link>
      </div>
    </div>
  )
}
