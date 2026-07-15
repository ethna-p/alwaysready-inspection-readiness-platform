/**
 * /dashboard/support — list of the org's support tickets.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  open:        { label: 'Open',        colour: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In progress', colour: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    colour: 'bg-green-100 text-green-700' },
}

export const metadata = { title: 'Support — AlwaysReady' }

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, reference, subject, status, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">Support</h1>
          <p className="text-sm text-gray-500 mt-1">
            We aim to respond within three business days.
          </p>
        </div>
        <Link
          href="/dashboard/support/new"
          className="
            bg-[#014D4E] text-white text-sm font-semibold
            px-5 py-2.5 rounded-lg
            hover:bg-[#013636]
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
            transition-colors
          "
        >
          + New ticket
        </Link>
      </div>

      {/* Ticket list */}
      {!tickets || tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <p className="text-4xl mb-4">💬</p>
          <p className="font-medium text-[#014D4E] mb-1">No tickets yet</p>
          <p>If you need help, we&apos;re here. Submit a ticket and we&apos;ll get back to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const status = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.open
            const created = new Date(ticket.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="
                  block bg-white border border-gray-200 rounded-xl
                  px-5 py-4
                  hover:border-[#00b8a6] hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2
                  transition-all
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-mono mb-1">{ticket.reference}</p>
                    <p className="text-sm font-semibold text-[#014D4E] truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">Submitted {created}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.colour}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
