/**
 * /superadmin/leads — warm leads from the alwaysready.uk/waitlist form.
 * These are people who have actively requested to be notified at launch.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export default async function SuperadminLeadsPage() {
  const supabase = createAdminClient()

  const { data: leads } = await supabase
    .from('waitlist_leads')
    .select('id, first_name, email, marketing_opt_in, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-ink">Warm Leads</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            {leads?.length ?? 0} on waitlist
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          People who signed up at alwaysready.uk/waitlist. Contact these first when you launch.
        </p>
      </div>

      {!leads || leads.length === 0 ? (
        <p className="text-ink-muted text-sm">No leads yet.</p>
      ) : (
        <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-fill">
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Marketing</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map(lead => {
                const date = new Date(lead.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <tr key={lead.id} className="hover:bg-fill transition-colors">
                    <td className="px-5 py-3.5 font-medium text-ink">{lead.first_name}</td>
                    <td className="px-5 py-3.5 text-ink-muted">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-brand transition-colors"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.marketing_opt_in ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Opted in
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted text-xs">{date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
