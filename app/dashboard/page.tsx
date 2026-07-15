/**
 * Readiness Dashboard — Step 5.
 *
 * Shows overall % readiness and a per-key-question breakdown.
 * All data is computed from compliance_records + klo_items + key_questions.
 * No new tables — this is a presentation layer over existing data.
 *
 * "Up to date" definition (from PROJECT_BRIEF.md):
 *   status = 'completed' AND next_review_due has not yet passed.
 *   An overdue completed KLOE is NOT counted as compliant — overdue wins.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG } from '@/lib/rag'
import type { RAGStatus } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import type { ComplianceRecord } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isCompliant(record: ComplianceRecord | undefined, now: Date): boolean {
  if (!record) return false
  return (
    record.status === 'completed' &&
    record.next_review_due !== null &&
    new Date(record.next_review_due) >= now
  )
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

// Colour for the progress bar fill, based on how well the org is doing
function progressColour(percent: number): string {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 50) return 'bg-amber-400'
  return 'bg-red-500'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()

  // ── Auth / profile ────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  type ProfileRow = {
    role: string
    organisation_id: string
    organisations: { name: string; service_types: { name: string } | null } | null
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role, organisation_id, organisations(name, service_types(name))')
    .eq('id', user!.id)
    .single() as { data: ProfileRow | null; error: unknown }

  const orgName = profile?.organisations?.name ?? '—'

  // ── Data fetch ────────────────────────────────────────────────────────────
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name, display_order').order('display_order'),
      supabase.from('klo_items').select('id, key_question_id'),
      supabase.from('compliance_records').select('*'),
    ])

  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )
  const allKlos = kloItems ?? []
  const allKqs  = keyQuestions ?? []

  // ── Overall counts ────────────────────────────────────────────────────────
  const totalKlos     = allKlos.length
  const compliantKlos = allKlos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
  const overallPct    = pct(compliantKlos, totalKlos)

  // ── Overall RAG breakdown ─────────────────────────────────────────────────
  const overallRag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
  for (const k of allKlos) {
    overallRag[calculateRAG(recordByKloId.get(k.id), now)]++
  }

  // ── Team workload (admins only) ───────────────────────────────────────────
  const isAdmin = profile?.role === 'admin'

  type TeamMemberStats = {
    id: string
    email: string
    rag: Record<RAGStatus, number>
    total: number
  }
  let teamStats: TeamMemberStats[] = []

  if (isAdmin) {
    const { data: orgUsers } = await supabase
      .from('users')
      .select('id, email')
      .eq('organisation_id', profile!.organisation_id)
      .in('role', ['admin', 'user'])
      .order('email')

    const assignedRecords = (records ?? []).filter(r => r.assigned_to)
    const recordsByAssignee = new Map<string, ComplianceRecord[]>()
    for (const r of assignedRecords) {
      const key = r.assigned_to!
      if (!recordsByAssignee.has(key)) recordsByAssignee.set(key, [])
      recordsByAssignee.get(key)!.push(r)
    }

    teamStats = (orgUsers ?? [])
      .filter(u => recordsByAssignee.has(u.id))
      .map(u => {
        const memberRecords = recordsByAssignee.get(u.id)!
        const rag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
        for (const r of memberRecords) rag[calculateRAG(r, now)]++
        return { id: u.id, email: u.email, rag, total: memberRecords.length }
      })
      .sort((a, b) => (b.rag.red + b.rag.grey) - (a.rag.red + a.rag.grey))
  }

  // ── Per-key-question stats ────────────────────────────────────────────────
  type KqStats = {
    id: string
    name: string
    total: number
    compliant: number
    rag: Record<RAGStatus, number>
  }

  const kqStats: KqStats[] = allKqs.map(kq => {
    const kqKlos = allKlos.filter(k => k.key_question_id === kq.id)
    const rag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
    let compliant = 0
    for (const k of kqKlos) {
      const rec = recordByKloId.get(k.id)
      if (isCompliant(rec, now)) compliant++
      rag[calculateRAG(rec, now)]++
    }
    return { id: kq.id, name: kq.name, total: kqKlos.length, compliant, rag }
  })

  return (
    <div>
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">Inspection Readiness</h1>
          <p className="text-sm text-gray-500 mt-1">{orgName}</p>
        </div>
        <Link
          href="/dashboard/kloes"
          className="
            inline-flex items-center gap-2
            bg-[#014D4E] text-white text-sm font-medium
            px-4 py-2.5 rounded-lg
            hover:bg-[#013838]
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
            transition-colors
          "
        >
          View KLOE tracker →
        </Link>
      </div>

      {/* ── Overall readiness ────────────────────────────────────────────── */}
      <section aria-labelledby="overall-heading" className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-8">

            {/* Big number */}
            <div className="text-center min-w-[120px]">
              <p
                className="text-6xl font-bold text-[#014D4E] tabular-nums"
                aria-label={`${overallPct} percent overall readiness`}
              >
                {overallPct}<span className="text-3xl">%</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Overall readiness</p>
            </div>

            {/* Progress bar + breakdown */}
            <div className="flex-1 min-w-[220px]">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{compliantKlos} of {totalKlos} KLOEs up to date</span>
                <span>{overallPct}%</span>
              </div>
              <div
                className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={overallPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${overallPct}% of KLOEs are up to date`}
              >
                <div
                  className={`h-full rounded-full transition-all ${progressColour(overallPct)}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Up to date = status Completed and next review not yet overdue
              </p>

              {/* RAG pill row */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(['green', 'amber', 'red', 'grey'] as const).map(rag => (
                  <span key={rag} className="inline-flex items-center gap-1">
                    <RagBadge status={rag} compact />
                    <span className="text-sm font-semibold text-[#1a1a1a]">{overallRag[rag]}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Per-key-question breakdown ───────────────────────────────────── */}
      <section aria-labelledby="breakdown-heading">
        <h2
          id="breakdown-heading"
          className="text-lg font-bold text-[#014D4E] mb-4"
        >
          Breakdown by key question
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kqStats.map(kq => {
            const kqPct = pct(kq.compliant, kq.total)
            return (
              <div
                key={kq.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                {/* Key question name + % */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-[#014D4E] text-sm leading-tight">
                    {kq.name}
                  </h3>
                  <span
                    className="text-2xl font-bold text-[#014D4E] tabular-nums shrink-0"
                    aria-label={`${kqPct} percent`}
                  >
                    {kqPct}<span className="text-base">%</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3"
                  role="progressbar"
                  aria-valuenow={kqPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${kq.name}: ${kqPct}% up to date`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${progressColour(kqPct)}`}
                    style={{ width: `${kqPct}%` }}
                  />
                </div>

                {/* Counts */}
                <p className="text-xs text-gray-500 mb-3">
                  {kq.compliant} of {kq.total} KLOEs up to date
                </p>

                {/* RAG breakdown */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(['green', 'amber', 'red', 'grey'] as const)
                    .filter(rag => kq.rag[rag] > 0)
                    .map(rag => (
                      <span key={rag} className="inline-flex items-center gap-1 text-xs">
                        <RagBadge status={rag} compact />
                        <span className="font-medium text-[#1a1a1a]">{kq.rag[rag]}</span>
                      </span>
                    ))}
                </div>

                {/* Link to KLOEs filtered to this section */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href="/dashboard/kloes"
                    className="text-xs font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
                    aria-label={`View ${kq.name} KLOEs`}
                  >
                    View {kq.name} KLOEs →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Team workload ─────────────────────────────────────────────────── */}
      {isAdmin && teamStats.length > 0 && (
        <section aria-labelledby="team-heading" className="mt-8">
          <h2 id="team-heading" className="text-lg font-bold text-[#014D4E] mb-4">
            Team workload
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th scope="col" className="text-left px-4 py-3 font-medium">Team member</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium">Assigned KLOEs</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium hidden sm:table-cell">RAG breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamStats.map(member => (
                  <tr key={member.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                      {member.email}
                      {/* RAG inline on mobile */}
                      <div className="flex flex-wrap gap-2 mt-1 sm:hidden">
                        {(['red', 'amber', 'green', 'grey'] as const)
                          .filter(r => member.rag[r] > 0)
                          .map(r => (
                            <span key={r} className="inline-flex items-center gap-1 text-xs">
                              <RagBadge status={r} compact />
                              <span className="font-medium">{member.rag[r]}</span>
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1a1a1a]">
                      <span className="font-semibold">{member.total}</span>
                      {member.rag.red > 0 && (
                        <span className="ml-2 text-xs text-red-600 font-medium">
                          {member.rag.red} overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-3">
                        {(['red', 'amber', 'green', 'grey'] as const)
                          .filter(r => member.rag[r] > 0)
                          .map(r => (
                            <span key={r} className="inline-flex items-center gap-1 text-xs">
                              <RagBadge status={r} compact />
                              <span className="font-medium text-[#1a1a1a]">{member.rag[r]}</span>
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sorted by most at-risk first. Assign KLOEs from each KLOE's detail page.
          </p>
        </section>
      )}

    </div>
  )
}
