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
 * Server component — no client-side state needed.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import type { ComplianceRecord, KloItem } from '@/lib/types'

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DailyReportPage() {
  const supabase = await createClient()

  // ── Data fetch ────────────────────────────────────────────────────────────
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name').order('display_order'),
      supabase.from('klo_items').select('id, title, key_question_id, display_order'),
      supabase.from('compliance_records').select('*'),
    ])

  const kqById  = new Map((keyQuestions ?? []).map(kq => [kq.id, kq]))
  const kloById = new Map<string, KloItem>((kloItems ?? []).map(k => [k.id, k as unknown as KloItem]))
  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )

  const now = new Date()

  // ── Build attention list ──────────────────────────────────────────────────
  // The Daily Report is date-driven only:
  //   Red   — next_review_due has passed (overdue)
  //   Amber — next_review_due is within DUE_SOON_DAYS days
  //
  // "In progress" status alone does NOT put a KLOE in this report —
  // a KLOE due in 90 days that happens to be in_progress is not urgent today.
  // Status is still shown in each row for context.
  const DUE_SOON_DAYS = 30

  type AttentionItem = {
    klo: { id: string; title: string; key_question_id: string; display_order: number }
    record: ComplianceRecord | undefined
    rag: 'red' | 'amber'
    priority: number
    kqName: string
  }

  const redItems:   AttentionItem[] = []
  const amberItems: AttentionItem[] = []

  for (const klo of kloItems ?? []) {
    const record = recordByKloId.get(klo.id)
    const due = record?.next_review_due ? new Date(record.next_review_due) : null

    let rag: 'red' | 'amber' | null = null
    if (due && due < now) {
      rag = 'red'
    } else if (due) {
      const daysUntilDue = (due.getTime() - now.getTime()) / (1_000 * 60 * 60 * 24)
      if (daysUntilDue <= DUE_SOON_DAYS) rag = 'amber'
    }

    if (!rag) continue

    const kq = kqById.get(klo.key_question_id)
    const item: AttentionItem = {
      klo: klo as { id: string; title: string; key_question_id: string; display_order: number },
      record,
      rag,
      priority: record?.priority ?? 3,
      kqName: kq?.name ?? '—',
    }

    if (rag === 'red') redItems.push(item)
    else               amberItems.push(item)
  }

  // Sort each group by priority (1 = most critical first), then by due date
  const byPriorityThenDue = (a: AttentionItem, b: AttentionItem) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const aDate = a.record?.next_review_due ?? ''
    const bDate = b.record?.next_review_due ?? ''
    return aDate.localeCompare(bDate)
  }
  redItems.sort(byPriorityThenDue)
  amberItems.sort(byPriorityThenDue)

  const totalAttention = redItems.length + amberItems.length
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb + heading */}
      <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">Daily Review Report</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">Daily Review Report</h1>
          <p className="text-sm text-gray-600 mt-1">{todayLabel}</p>
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
            No KLOEs are overdue or due soon. Good work keeping on top of reviews.
          </p>
          <Link
            href="/dashboard/kloes"
            className="inline-block mt-4 text-sm font-medium text-green-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
          >
            View all KLOEs →
          </Link>
        </div>
      )}

      {/* ── Overdue (Red) ───────────────────────────────────────────────── */}
      {redItems.length > 0 && (
        <section aria-labelledby="overdue-heading" className="mb-8">
          <h2
            id="overdue-heading"
            className="flex items-center gap-2 text-lg font-bold text-red-700 mb-4"
          >
            <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
            Overdue
            <span className="text-sm font-normal text-red-600">
              ({redItems.length} {redItems.length === 1 ? 'KLOE' : 'KLOEs'})
            </span>
          </h2>

          <ReportTable items={redItems} kloById={kloById} />
        </section>
      )}

      {/* ── Due soon / In progress (Amber) ──────────────────────────────── */}
      {amberItems.length > 0 && (
        <section aria-labelledby="due-soon-heading">
          <h2
            id="due-soon-heading"
            className="flex items-center gap-2 text-lg font-bold text-amber-700 mb-4"
          >
            <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
            Due within 30 days
            <span className="text-sm font-normal text-amber-600">
              ({amberItems.length} {amberItems.length === 1 ? 'KLOE' : 'KLOEs'})
            </span>
          </h2>

          <ReportTable items={amberItems} kloById={kloById} />
        </section>
      )}
    </div>
  )
}

// ── Sub-component: shared table for both groups ───────────────────────────────

type AttentionItem = {
  klo: { id: string; title: string; key_question_id: string; display_order: number }
  record: ComplianceRecord | undefined
  rag: 'red' | 'amber'
  priority: number
  kqName: string
}

function ReportTable({
  items,
  kloById,
}: {
  items: AttentionItem[]
  kloById: Map<string, KloItem>
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-600 uppercase tracking-wide">
            <th scope="col" className="text-left px-4 py-3 font-medium">KLOE</th>
            <th scope="col" className="text-left px-4 py-3 font-medium hidden sm:table-cell">Key question</th>
            <th scope="col" className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
            <th scope="col" className="text-left px-4 py-3 font-medium hidden md:table-cell">RAG</th>
            <th scope="col" className="text-center px-4 py-3 font-medium hidden lg:table-cell">Priority</th>
            <th scope="col" className="text-left px-4 py-3 font-medium hidden lg:table-cell">Due date</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Update</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map(({ klo, record, rag, priority, kqName }) => {
            const code = kloCode(kqName, klo.display_order)
            const dueStr = record?.next_review_due ?? null

            // Context label: "3 days overdue" or "due in 5 days" or "in progress"
            let dueContext: string | null = null
            if (rag === 'red' && dueStr) {
              const d = daysOverdue(dueStr)
              dueContext = d === 1 ? '1 day overdue' : `${d} days overdue`
            } else if (rag === 'amber' && dueStr) {
              const d = daysDue(dueStr)
              dueContext = d <= 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due in ${d} days`
            } else if (record?.status === 'in_progress') {
              dueContext = 'In progress'
            }

            return (
              <tr key={klo.id} className="hover:bg-[#faf9f6] transition-colors">
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
                        className="font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1 rounded"
                      >
                        {klo.title}
                      </Link>
                      {/* Mobile: show key question + context inline */}
                      <div className="text-xs text-gray-600 mt-0.5 sm:hidden">{kqName}</div>
                      {dueContext && (
                        <div className={`text-xs mt-0.5 font-medium ${rag === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
                          {dueContext}
                        </div>
                      )}
                      {/* Mobile: RAG + status */}
                      <div className="flex items-center gap-2 mt-1 md:hidden">
                        <RagBadge status={rag} compact />
                        {record && <StatusBadge status={record.status} />}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Key question */}
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs">
                  {kqName}
                </td>

                {/* Status */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {record
                    ? <StatusBadge status={record.status} />
                    : <span className="text-gray-600 text-xs">—</span>}
                </td>

                {/* RAG */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <div>
                    <RagBadge status={rag} compact />
                    {dueContext && (
                      <p className={`text-xs mt-1 font-medium ${rag === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
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
                <td className={`px-4 py-3 hidden lg:table-cell text-xs font-medium ${rag === 'red' ? 'text-red-600' : 'text-[#1a1a1a]'}`}>
                  {formatDate(dueStr)}
                </td>

                {/* Update link */}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/kloes/${klo.id}`}
                    className="text-xs text-[#014D4E] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded whitespace-nowrap"
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
  )
}
