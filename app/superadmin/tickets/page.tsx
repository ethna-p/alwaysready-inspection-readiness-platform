/**
 * /superadmin/tickets — all support tickets across all orgs.
 * Uses the admin client to bypass RLS.
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  open:        { label: 'Open',        colour: 'bg-blue-500/20 text-blue-300' },
  in_progress: { label: 'In progress', colour: 'bg-amber-500/20 text-amber-300' },
  resolved:    { label: 'Resolved',    colour: 'bg-green-500/20 text-green-300' },
}

export default async function SuperadminTicketsPage() {
  const supabase = createAdminClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      id, reference, subject, status, created_at,
      organisations ( name )
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
      <p className="text-sm text-gray-400 mb-8">
        All tickets across all organisations.
      </p>

      {!tickets || tickets.length === 0 ? (
        <p className="text-gray-500 text-sm">No tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const status = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.open
            const orgName = (ticket as unknown as { organisations: { name: string } | null }).organisations?.name ?? '—'
            const created = new Date(ticket.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <Link
                key={ticket.id}
                href={`/superadmin/tickets/${ticket.id}`}
                className="
                  flex items-center justify-between gap-4
                  bg-gray-900 border border-gray-800 rounded-xl
                  px-5 py-4
                  hover:border-[#00b8a6]
                  focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                  transition-colors
                "
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500 font-mono">{ticket.reference}</p>
                    <span className="text-xs text-gray-600">·</span>
                    <p className="text-xs text-gray-400">{orgName}</p>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{created}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.colour}`}>
                  {status.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
