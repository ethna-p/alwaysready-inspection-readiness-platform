/**
 * /dashboard/daily-report — Daily Review Report (Step 6)
 *
 * Shows only items that need attention:
 *   1. Red (Overdue) — sorted by priority ascending (1 = most critical)
 *   2. Amber (Due soon / In progress) — sorted by priority ascending
 *
 * Green and Grey items are omitted — this screen is for triage, not the
 * full KLOE list (that's /dashboard/kloes).
 *
 * Sort order within each section is controlled by URL search params:
 *   ?sort=title|kq|status|rag|priority|date
 *   ?dir=asc|desc  (default asc; clicking the active column header toggles)
 *
 * Server component — sort state is read from URL params.
 */
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import type { ComplianceRecord } from '@/lib/types'
import KloeTableHeader, { type KloeDir, type SortColumnDef } from '../kloes/KloeTableHeader'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function daysOverdue(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1_000 * 60 * 60 * 24)
  )
}

function daysDue(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1_000 * 60 * 60 * 24)
  )
}

/** Derive a short KLOE code from key question name + display_order, e.g. "S3", "W1" */
function kloCode(kqName: string, displayOrder: number): string {
  const initial = kqName.charAt(0).toUpperCase()
  return `${initial}${displayOrder}`
}

// ── Column definitions for the sortable header ────────────────────────────────

const DAILY_REPORT_COLUMNS: SortColumnDef[] = [
  { key: 'title',    label: 'KLOE',         classes: '' },
  { key: 'kq',       label: 'Key question', classes: 'hidden sm:table-cell' },
  { key: 'status',   label: 'Status',       classes: 'hidden md:table-cell' },
  { key: 'rag',      label: 'RAG',          classes: 'hidden md:table-cell' },
  { key: 'priority', label: 'Priority',     classes: 'hidden lg:table-cell' },
  { key: 'date',     label: 'Due date',     classes: 'hidden lg:table-cell' },
]

// ── Sort logic ────────────────────────────────────────────────────────────────

type AttentionItem = {
  klo: { id: string; title: string; key_question_id: string; display_order: number }
  record: ComplianceRecord | undefined
  rag: 'red' | 'amber' | 'grey'
  priority: number
  kqName: string
}

const STATUS_SORT: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2 }
const RAG_SORT:   Record<string, number> = { red: 0, amber: 1, grey: 2 }

function sortItems(items: AttentionItem[], sort: string, dir: KloeDir): AttentionItem[] {
  // 'default' keeps the original priority-then-date order
  if (sort === 'default') return items
  const m = dir === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'title':    return m * a.klo.title.localeCompare(b.klo.title)
      case 'kq':       return m * a.kqName.localeCompare(b.kqName)
      case 'status': {
        const sA = STATUS_SORT[a.record?.status ?? 'not_started'] ?? 0
        const sB = STATUS_SORT[b.record?.status ?? 'not_started'] ?? 0
        return m * (sA - sB)
      }
      case 'rag': {
        return m * ((RAG_SORT[a.rag] ?? 99) - (RAG_SORT[b.rag] ?? 99))
      }
      case 'priority': return m * (a.priority - b.priority)
      case 'date': {
        const dA = a.record?.next_review_due ?? null
        const dB = b.record?.next_review_due ?? null
        if (!dA && !dB) return 0
        if (!dA) return m
        if (!dB) return -m
        return m * dA.localeCompare(dB)
      }
      default: return 0
    }
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>
}) {
  const { sort: sortParam, dir: dirParam } = await searchParams

  const VALID_SORTS = ['title', 'kq', 'status', 'rag', 'priority', 'date']
  const sort = VALID_SORTS.includes(sortParam ?? '') ? (sortParam as string) : 'default'
  const dir: KloeDir = dirParam === 'desc' ? 'desc' : 'asc'

  const supabase = await createClient()

  // ── Data fetch ────────────────────────────────────────────────────────────
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name').order('display_order'),
      supabase.from('klo_items').select('id, title, key_question_id, display_order'),
      supabase.from('compliance_records').select('*'),
    ])

  const kqById  = new Map((keyQuestions ?? []).map(kq => [kq.id, kq]))
  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )

  const now = new Date()

  // ── Build attention list ──────────────────────────────────────────────────
  const DUE_SOON_DAYS = 30

  const redItems:        AttentionItem[] = []
  const amberItems:      AttentionItem[] = []
  const unassessedItems: AttentionItem[] = []

  for (const klo of kloItems ?? []) {
    const record = recordByKloId.get(klo.id)
    const due = record?.next_review_due ? new Date(record.next_review_due) : null
    const kq = kqById.get(klo.key_question_id)

    const item: AttentionItem = {
      klo: klo as { id: string; title: string; key_question_id: string; display_order: number },
      record,
      rag: 'red',
      priority: record?.priority ?? 3,
      kqName: kq?.name ?? '—',
    }

    if (!due) {
      if (record?.status === 'in_progress' || record?.status === 'completed') continue
      unassessedItems.push({ ...item, rag: 'grey' })
      continue
    }

    if (due < now) {
      redItems.push({ ...item, rag: 'red' })
    } else {
      const daysUntilDue = (due.getTime() - now.getTime()) / (1_000 * 60 * 60 * 24)
      if (daysUntilDue <= DUE_SOON_DAYS) amberItems.push({ ...item, rag: 'amber' })
    }
  }

  // Default sort: priority then due date (most urgent first)
  const byPriorityThenDue = (a: AttentionItem, b: AttentionItem) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const aDate = a.record?.next_review_due ?? ''
    const bDate = b.record?.next_review_due ?? ''
    return aDate.localeCompare(bDate)
  }
  redItems.sort(byPriorityThenDue)
  amberItems.sort(byPriorityThenDue)

  // Apply user-chosen column sort (overrides the default ordering above)
  const sortedRed        = sortItems(redItems, sort, dir)
  const sortedAmber      = sortItems(amberItems, sort, dir)
  const sortedUnassessed = sortItems(unassessedItems, sort, dir)

  const totalAttention = redItems.length + amberItems.length + unassessedItems.length
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb + heading */}
      <nav className="text-sm text-ink-dim mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li><Link href="/dashboard" className="hover:text-brand underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">Daily Review Report</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand">Daily Review Report</h1>
          <p className="text-sm text-ink-dim mt-1">{todayLabel}</p>
        </div>

        {totalAttention > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
            {totalAttention} item{totalAttention !== 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      {/* ── All clear state ─────────────────────────────────────────────── */}
      {totalAttention === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-green-800 mb-2">All clear</h2>
          <p className="text-sm text-green-700">
            No KLOEs are overdue, due soon, or unassessed. Good work keeping on top of reviews.
          </p>
          <Link
            href="/dashboard/kloes"
            className="inline-block mt-4 text-sm font-medium text-green-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
          >
            View all KLOEs →
          </Link>
        </div>
      )}

      {/* ── Unassessed ──────────────────────────────────────────────────── */}
      {sortedUnassessed.length > 0 && (
        <section aria-labelledby="unassessed-heading" className="mb-8">
          <h2
            id="unassessed-heading"
            className="flex items-center gap-2 text-lg font-bold text-ink mb-4"
          >
            <span className="w-3 h-3 rounded-full bg-gray-400" aria-hidden="true" />
            Never assessed
            <span className="text-sm font-normal text-ink-dim">
              ({sortedUnassessed.length} {sortedUnassessed.length === 1 ? 'KLOE' : 'KLOEs'} — no review date set)
            </span>
          </h2>
          <ReportTable items={sortedUnassessed} sort={sort} dir={dir} />
        </section>
      )}

      {/* ── Overdue (Red) ───────────────────────────────────────────────── */}
      {sortedRed.length > 0 && (
        <section aria-labelledby="overdue-heading" className="mb-8">
          <h2
            id="overdue-heading"
            className="flex items-center gap-2 text-lg font-bold text-red-700 mb-4"
          >
            <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
            Overdue
            <span className="text-sm font-normal text-red-600">
              ({sortedRed.length} {sortedRed.length === 1 ? 'KLOE' : 'KLOEs'})
            </span>
          </h2>
          <ReportTable items={sortedRed} sort={sort} dir={dir} />
        </section>
      )}

      {/* ── Due soon / In progress (Amber) ──────────────────────────────── */}
      {sortedAmber.length > 0 && (
        <section aria-labelledby="due-soon-heading">
          <h2
            id="due-soon-heading"
            className="flex items-center gap-2 text-lg font-bold text-amber-700 mb-4"
          >
            <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
            Due within 30 days
            <span className="text-sm font-normal text-amber-600">
              ({sortedAmber.length} {sortedAmber.length === 1 ? 'KLOE' : 'KLOEs'})
            </span>
          </h2>
          <ReportTable items={sortedAmber} sort={sort} dir={dir} />
        </section>
      )}
    </div>
  )
}

// ── Sub-component: shared table for all sections ──────────────────────────────

function ReportTable({
  items,
  sort,
  dir,
}: {
  items: AttentionItem[]
  sort: string
  dir: KloeDir
}) {
  return (
    <div className="bg-card rounded-xl border border-line overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-72" />
          <col className="hidden sm:table-column w-32" />
          <col className="hidden md:table-column w-32" />
          <col className="hidden md:table-column w-36" />
          <col className="hidden lg:table-column w-24" />
          <col className="hidden lg:table-column w-36" />
          <col className="w-20" />
        </colgroup>
        {/* Suspense needed: useSearchParams() inside KloeTableHeader requires a client boundary */}
        <Suspense fallback={
          <thead>
            <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
              {['KLOE', 'Key question', 'Status', 'RAG', 'Priority', 'Due date'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Update</span></th>
            </tr>
          </thead>
        }>
          <KloeTableHeader sort={sort} dir={dir} columns={DAILY_REPORT_COLUMNS} />
        </Suspense>
        <tbody className="divide-y divide-gray-50">
          {items.map(({ klo, record, rag, priority, kqName }) => {
            const code = kloCode(kqName, klo.display_order)
            const dueStr = record?.next_review_due ?? null

            // Context label
            let dueContext: string | null = null
            if (rag === 'grey') {
              dueContext = 'No review date set'
            } else if (rag === 'red' && dueStr) {
              const d = daysOverdue(dueStr)
              dueContext = d === 1 ? '1 day overdue' : `${d} days overdue`
            } else if (rag === 'amber' && dueStr) {
              const d = daysDue(dueStr)
              dueContext = d <= 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due in ${d} days`
            } else if (record?.status === 'in_progress') {
              dueContext = 'In progress'
            }
            const contextColour = rag === 'red' ? 'text-red-600' : rag === 'amber' ? 'text-amber-600' : 'text-ink-muted'

            return (
              <tr key={klo.id} className="hover:bg-canvas transition-colors">
                {/* KLOE */}
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span
                      className="shrink-0 mt-0.5 text-xs font-bold text-white bg-[#014D4E] px-1.5 py-0.5 rounded"
                      aria-label={`KLOE code ${code}`}
                    >
                      {code}
                    </span>
                    <div>
                      <Link
                        href={`/dashboard/kloes/${klo.id}`}
                        className="font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1 rounded"
                      >
                        {klo.title}
                      </Link>
                      {/* Mobile: show key question + context inline */}
                      <div className="text-xs text-ink-dim mt-0.5 sm:hidden">{kqName}</div>
                      {dueContext && (
                        <div className={`text-xs mt-0.5 font-medium ${contextColour}`}>
                          {dueContext}
                        </div>
                      )}
                      {/* Mobile: RAG + status */}
                      <div className="flex items-center gap-2 mt-1 md:hidden">
                        {rag !== 'grey' && <RagBadge status={rag} compact />}
                        {record && <StatusBadge status={record.status} />}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Key question */}
                <td className="px-4 py-3 hidden sm:table-cell text-ink-dim text-xs">
                  {kqName}
                </td>

                {/* Status */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {record
                    ? <StatusBadge status={record.status} />
                    : <span className="text-ink-dim text-xs">—</span>}
                </td>

                {/* RAG */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <div>
                    {rag !== 'grey' && <RagBadge status={rag} compact />}
                    {dueContext && (
                      <p className={`text-xs mt-1 font-medium ${contextColour}`}>
                        {dueContext}
                      </p>
                    )}
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3 hidden lg:table-cell text-center">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold"
                    aria-label={`Priority ${priority}`}
                  >
                    {priority}
                  </span>
                </td>

                {/* Due date */}
                <td className={`px-4 py-3 hidden lg:table-cell text-xs font-medium ${rag === 'red' ? 'text-red-600' : rag === 'amber' ? 'text-ink' : 'text-ink-muted'}`}>
                  {formatDate(dueStr)}
                </td>

                {/* Update link */}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/kloes/${klo.id}`}
                    className="text-xs text-brand font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded whitespace-nowrap"
                    aria-label={`View ${klo.title}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
