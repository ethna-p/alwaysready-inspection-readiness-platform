/**
 * /superadmin/tickets — all support tickets across all orgs.
 * Uses the admin client to bypass RLS.
 * Filter by status via ?status=open|in_progress|resolved (default: active = open + in_progress)
 */
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import DeleteResolvedButton from './DeleteResolvedButton'

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  open:        { label: 'Open',        colour: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In progress', colour: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    colour: 'bg-green-100 text-green-700' },
}

const FILTER_TABS = [
  { key: 'active',   label: 'Active' },
  { key: 'open',     label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all',      label: 'All' },
]

export default async function SuperadminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const filter = statusParam ?? 'active'

  const supabase = createAdminClient()

  // Count resolved tickets for the delete button
  const { count: resolvedCount } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'resolved')

  let query = supabase
    .from('support_tickets')
    .select(`
      id, reference, subject, status, staff_initiated, source,
      external_name, created_at,
      organisations ( name )
    `)
    .order('created_at', { ascending: false })

  if (filter === 'active') {
    query = query.in('status', ['open', 'in_progress'])
  } else if (filter !== 'all') {
    query = query.eq('status', filter as 'open' | 'in_progress' | 'resolved')
  }

  const { data: tickets } = await query

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Support Tickets</h1>
          <p className="text-sm text-ink-muted">
            All tickets across all organisations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(filter === 'resolved' || filter === 'all') && (
            <DeleteResolvedButton count={resolvedCount ?? 0} />
          )}
          <Link
            href="/superadmin/tickets/new"
            className="shrink-0 bg-[#014D4E] hover:bg-[#00b8a6] hover:text-brand text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New ticket
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {FILTER_TABS.map(tab => {
          const isActive = filter === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.key === 'active' ? '/superadmin/tickets' : `/superadmin/tickets?status=${tab.key}`}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                isActive
                  ? 'text-[#014D4E] border-b-2 border-[#014D4E] -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {!tickets || tickets.length === 0 ? (
        <p className="text-ink-muted text-sm">No tickets found.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const status = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.open
            const t = ticket as unknown as {
              staff_initiated: boolean
              source: string
              external_name: string | null
              organisations: { name: string } | null
            }
            const isWebsite = t.source === 'website_contact' || t.source === 'website'
            const isEmail   = t.source === 'email'
            const orgName   = isWebsite || isEmail
              ? (t.external_name ?? (isEmail ? 'Sales enquiry' : 'Website enquiry'))
              : (t.organisations?.name ?? '—')
            const created = new Date(ticket.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <Link
                key={ticket.id}
                href={`/superadmin/tickets/${ticket.id}`}
                className="
                  flex items-center justify-between gap-4
                  bg-card border border-line rounded-xl
                  px-5 py-4
                  hover:border-[#00b8a6]
                  focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                  transition-colors
                "
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-ink-muted font-mono">{ticket.reference}</p>
                    <span className="text-xs text-ink-muted">·</span>
                    <p className="text-xs text-ink-muted">{orgName}</p>
                    {t.staff_initiated && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#014D4E]/40 text-[#00b8a6]">
                        Staff
                      </span>
                    )}
                    {isWebsite && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        Website
                      </span>
                    )}
                    {isEmail && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        Email
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink truncate">{ticket.subject}</p>
                  <p className="text-xs text-ink-muted mt-1">{created}</p>
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
