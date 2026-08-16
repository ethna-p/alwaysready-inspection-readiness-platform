/**
 * /dashboard/kloes — KLOE list grouped by key question.
 *
 * Sort order is controlled by URL search params:
 *   ?sort=title|status|rag|priority|date|assigned
 *   ?dir=asc|desc  (default asc; clicking the active column header toggles)
 *
 * Column headers in each section table are clickable sort controls.
 */
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG } from '@/lib/rag'
import type { RAGStatus } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import type { ComplianceRecord, KloItem } from '@/lib/types'
import KloeTableHeader, { type KloeSort, type KloeDir } from './KloeTableHeader'

const RAG_SORT:    Record<RAGStatus, number>         = { red: 0, amber: 1, green: 2, grey: 3 }
const STATUS_SORT: Record<string, number>            = { not_started: 0, in_progress: 1, completed: 2 }

type KeyQuestionRow = { id: string; name: string; display_order: number; description: string | null }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function sortKlos(
  klos: KloItem[],
  sort: KloeSort,
  dir: KloeDir,
  recordByKloId: Map<string, ComplianceRecord>,
  nameByUserId: Map<string, string>,
): KloItem[] {
  const m = dir === 'desc' ? -1 : 1

  if (sort === 'title') {
    return [...klos].sort((a, b) => m * a.title.localeCompare(b.title))
  }
  if (sort === 'status') {
    return [...klos].sort((a, b) => {
      const sA = STATUS_SORT[recordByKloId.get(a.id)?.status ?? 'not_started'] ?? 0
      const sB = STATUS_SORT[recordByKloId.get(b.id)?.status ?? 'not_started'] ?? 0
      return m * (sA - sB)
    })
  }
  if (sort === 'rag') {
    return [...klos].sort((a, b) => {
      const rA = RAG_SORT[calculateRAG(recordByKloId.get(a.id))]
      const rB = RAG_SORT[calculateRAG(recordByKloId.get(b.id))]
      return m * (rA - rB)
    })
  }
  if (sort === 'priority') {
    return [...klos].sort((a, b) => {
      const pA = recordByKloId.get(a.id)?.priority ?? 99
      const pB = recordByKloId.get(b.id)?.priority ?? 99
      return m * (pA - pB)
    })
  }
  if (sort === 'date') {
    return [...klos].sort((a, b) => {
      const dA = recordByKloId.get(a.id)?.next_review_due ?? null
      const dB = recordByKloId.get(b.id)?.next_review_due ?? null
      if (!dA && !dB) return 0
      if (!dA) return m      // nulls last in asc, first in desc
      if (!dB) return -m
      return m * (dA < dB ? -1 : dA > dB ? 1 : 0)
    })
  }
  if (sort === 'assigned') {
    return [...klos].sort((a, b) => {
      const nA = nameByUserId.get(recordByKloId.get(a.id)?.assigned_to ?? '') ?? ''
      const nB = nameByUserId.get(recordByKloId.get(b.id)?.assigned_to ?? '') ?? ''
      return m * nA.localeCompare(nB)
    })
  }
  // 'default' — already ordered by display_order from the DB query
  return klos
}

export default async function KloesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>
}) {
  const { sort: sortParam, dir: dirParam } = await searchParams

  const VALID_SORTS: KloeSort[] = ['title', 'status', 'rag', 'priority', 'date', 'assigned']
  const sort: KloeSort = VALID_SORTS.includes(sortParam as KloeSort)
    ? (sortParam as KloeSort)
    : 'default'
  const dir: KloeDir = dirParam === 'desc' ? 'desc' : 'asc'

  const supabase = await createClient()

  // ── Fetch reference data ─────────────────────────────────────────────
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] = await Promise.all([
    supabase
      .from('key_questions')
      .select('id, name, display_order, description')
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
        <nav className="text-sm text-ink-dim mb-2" aria-label="Breadcrumb">
          <ol className="flex gap-1">
            <li><Link href="/dashboard" className="hover:text-brand underline">Dashboard</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-ink" aria-current="page">KLOEs</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-brand">KLOE Compliance Tracker</h1>
        <p className="text-sm text-ink-dim mt-1">
          Click any column header to sort. Click again to reverse. Click a KLOE to update its status or view its audit trail.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <div className="col-span-2 sm:col-span-1 bg-card rounded-xl border border-line p-4">
          <p className="text-xs text-ink-dim font-medium mb-1">Overall</p>
          <p className="text-3xl font-bold text-brand">{pctComplete}<span className="text-lg">%</span></p>
          <p className="text-xs text-ink-dim">Completed</p>
        </div>
        {([ 'green', 'amber', 'red', 'grey'] as const).map(rag => (
          <div key={rag} className="bg-card rounded-xl border border-line p-4">
            <RagBadge status={rag} compact />
            <p className="text-2xl font-bold text-ink mt-2">{ragCounts[rag]}</p>
            <p className="text-xs text-ink-dim">KLOEs</p>
          </div>
        ))}
      </div>

      {/* KLOE list grouped by key question */}
      <div className="space-y-8">
        {(keyQuestions ?? []).map(kq => {
          const baseKlos: KloItem[] = allKlos.filter(k => k.key_question_id === kq.id)
          const groupKlos = sortKlos(baseKlos, sort, dir, recordByKloId, nameByUserId)
          if (groupKlos.length === 0) return null

          return (
            <section key={kq.id} aria-labelledby={`kq-${kq.id}`}>
              <div className="mb-3 pb-2 border-b border-line">
                <h2
                  id={`kq-${kq.id}`}
                  className="text-lg font-bold text-brand"
                >
                  {kq.name}
                  <span className="ml-2 text-sm font-normal text-ink-dim">
                    ({groupKlos.length} KLOEs)
                  </span>
                </h2>
                {kq.description && (
                  <p className="text-sm text-ink-dim mt-0.5">
                    &ldquo;{kq.description}&rdquo;
                  </p>
                )}
              </div>

              <div className="bg-card rounded-xl border border-line overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-72" />
                    <col className="hidden sm:table-column w-32" />
                    <col className="hidden md:table-column w-36" />
                    <col className="hidden lg:table-column w-24" />
                    <col className="hidden lg:table-column w-36" />
                    <col className="hidden lg:table-column w-44" />
                    <col className="w-20" />
                  </colgroup>
                  {/* Suspense needed: useSearchParams() inside KloeTableHeader requires a client boundary */}
                  <Suspense fallback={
                    <thead>
                      <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
                        {['KLOE','Status','RAG','Priority','Next due','Assigned to'].map(h => (
                          <th key={h} scope="col" className="text-left px-4 py-3 font-medium">{h}</th>
                        ))}
                        <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                  }>
                    <KloeTableHeader sort={sort} dir={dir} />
                  </Suspense>
                  <tbody className="divide-y divide-gray-50">
                    {groupKlos.map(klo => {
                      const record = recordByKloId.get(klo.id)
                      const rag = calculateRAG(record)

                      return (
                        <tr
                          key={klo.id}
                          className="hover:bg-canvas transition-colors"
                        >
                          {/* KLOE title */}
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/kloes/${klo.id}`}
                              className="font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1 rounded"
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
                              : <span className="text-ink-dim text-xs">—</span>
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
                              : <span className="text-ink-dim text-xs">—</span>
                            }
                          </td>

                          {/* Next due */}
                          <td className="px-4 py-3 hidden lg:table-cell text-ink-dim">
                            {formatDate(record?.next_review_due ?? null)}
                          </td>

                          {/* Assigned to */}
                          <td className="px-4 py-3 hidden lg:table-cell text-ink-dim text-xs">
                            {record?.assigned_to
                              ? nameByUserId.get(record.assigned_to) ?? '—'
                              : <span className="text-gray-300">Unassigned</span>
                            }
                          </td>

                          {/* Link */}
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/kloes/${klo.id}`}
                              className="text-xs text-brand font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
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
