/**
 * /dashboard/kloes — KLOE list grouped by key question.
 *
 * Server component: fetches KLOEs + this org's compliance records,
 * calculates RAG for each, then renders grouped rows.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG } from '@/lib/rag'
import type { RAGStatus } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import type { ComplianceRecord, KloItem } from '@/lib/types'

// Sort order within each key question group:
// Grey (unassessed) first — needs attention, never been done
// Red (overdue) next — urgent
// Amber (due soon / in progress) — coming up
// Green (up to date) last
const RAG_SORT: Record<RAGStatus, number> = { grey: 0, red: 1, amber: 2, green: 3 }

type KeyQuestionRow = { id: string; name: string; display_order: number }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default async function KloesPage() {
  const supabase = await createClient()

  // ── Fetch reference data ─────────────────────────────────────────────
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] = await Promise.all([
    supabase
      .from('key_questions')
      .select('id, name, display_order')
      .order('display_order'),

    supabase
      .from('klo_items')
      .select('*')
      .order('display_order'),

    supabase
      .from('compliance_records')
      .select('*'),
  ])

  // Index compliance records by klo_item_id for O(1) lookup
  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )

  // Resolve assigned_to display names
  const assignedIds = [...new Set(
    (records ?? []).map(r => r.assigned_to).filter(Boolean) as string[]
  )]
  const { data: assignedUsers } = assignedIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', assignedIds)
    : { data: [] }
  const nameByUserId = new Map((assignedUsers ?? []).map(u => [u.id, u.full_name ?? u.email]))

  // ── Summary counts ───────────────────────────────────────────────────
  const allKlos = kloItems ?? []
  const ragCounts = { grey: 0, red: 0, amber: 0, green: 0 }
  for (const k of allKlos) {
    const rag = calculateRAG(recordByKloId.get(k.id))
    ragCounts[rag]++
  }

  const completedCount = [...recordByKloId.values()].filter(
    r => r.status === 'completed'
  ).length
  const pctComplete = allKlos.length > 0
    ? Math.round((completedCount / allKlos.length) * 100)
    : 0

  return (
    <div>
      {/* Page heading */}
      <div className="mb-8">
        <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
          <ol className="flex gap-1">
            <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-[#1a1a1a]" aria-current="page">KLOEs</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-[#014D4E]">KLOE Compliance Tracker</h1>
        <p className="text-sm text-gray-600 mt-1">
          Select any KLOE to update its status or view its audit trail.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">Overall</p>
          <p className="text-3xl font-bold text-[#014D4E]">{pctComplete}<span className="text-lg">%</span></p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
        {([ 'green', 'amber', 'red', 'grey'] as const).map(rag => (
          <div key={rag} className="bg-white rounded-xl border border-gray-200 p-4">
            <RagBadge status={rag} compact />
            <p className="text-2xl font-bold text-[#1a1a1a] mt-2">{ragCounts[rag]}</p>
            <p className="text-xs text-gray-600">KLOEs</p>
          </div>
        ))}
      </div>

      {/* KLOE list grouped by key question */}
      <div className="space-y-8">
        {(keyQuestions ?? []).map(kq => {
          const groupKlos: KloItem[] = allKlos
            .filter(k => k.key_question_id === kq.id)
            .sort((a, b) => {
              const ragA = calculateRAG(recordByKloId.get(a.id))
              const ragB = calculateRAG(recordByKloId.get(b.id))
              return RAG_SORT[ragA] - RAG_SORT[ragB]
            })
          if (groupKlos.length === 0) return null

          return (
            <section key={kq.id} aria-labelledby={`kq-${kq.id}`}>
              <h2
                id={`kq-${kq.id}`}
                className="text-lg font-bold text-[#014D4E] mb-3 pb-2 border-b border-gray-200"
              >
                {kq.name}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({groupKlos.length} KLOEs)
                </span>
              </h2>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-600 uppercase tracking-wide">
                      <th scope="col" className="text-left px-4 py-3 font-medium">KLOE</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium hidden md:table-cell">RAG</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium hidden lg:table-cell">Priority</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium hidden lg:table-cell">Next due</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium hidden lg:table-cell">Assigned to</th>
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupKlos.map(klo => {
                      const record = recordByKloId.get(klo.id)
                      const rag = calculateRAG(record)

                      return (
                        <tr
                          key={klo.id}
                          className="hover:bg-[#faf9f6] transition-colors"
                        >
                          {/* KLOE title */}
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/kloes/${klo.id}`}
                              className="font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1 rounded"
                            >
                              {klo.title}
                            </Link>
                            {/* RAG shown inline on small screens */}
                            <div className="mt-1 flex items-center gap-2 sm:hidden">
                              <RagBadge status={rag} compact />
                              {record && <StatusBadge status={record.status} />}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {record
                              ? <StatusBadge status={record.status} />
                              : <span className="text-gray-600 text-xs">—</span>
                            }
                          </td>

                          {/* RAG */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <RagBadge status={rag} compact />
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {record
                              ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold" aria-label={`Priority ${record.priority}`}>
                                  {record.priority}
                                </span>
                              )
                              : <span className="text-gray-600 text-xs">—</span>
                            }
                          </td>

                          {/* Next due */}
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                            {formatDate(record?.next_review_due ?? null)}
                          </td>

                          {/* Assigned to */}
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-xs">
                            {record?.assigned_to
                              ? nameByUserId.get(record.assigned_to) ?? '—'
                              : <span className="text-gray-300">Unassigned</span>
                            }
                          </td>

                          {/* Link */}
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/kloes/${klo.id}`}
                              className="text-xs text-[#014D4E] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
                              aria-label={`Update ${klo.title}`}
                            >
                              Update →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
