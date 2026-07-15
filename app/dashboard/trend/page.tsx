/**
 * /dashboard/trend — Readiness Trend Over Time (Step 8)
 *
 * Reconstructs weekly readiness % snapshots from compliance_record_history.
 * No additional snapshot tables needed — computed on the fly from history.
 *
 * Algorithm: for each weekly time point T, find the most recent history
 * entry for each KLOE at or before T, then count as compliant if
 * status = 'completed' AND next_review_due >= T.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryEntry = {
  klo_item_id: string
  status: string
  next_review_due: string | null
  system_recorded_at: string
}

// ── Computation ───────────────────────────────────────────────────────────────

function computeAtDate(
  kloIds: string[],
  historyByKlo: Map<string, HistoryEntry[]>,
  atDate: Date
): { compliant: number; total: number; pct: number } {
  const total = kloIds.length
  if (total === 0) return { compliant: 0, total: 0, pct: 0 }

  let compliant = 0
  for (const kloId of kloIds) {
    const entries = historyByKlo.get(kloId) ?? []
    // Entries are sorted ascending; find the last one at or before atDate
    let latestEntry: HistoryEntry | null = null
    for (const entry of entries) {
      if (new Date(entry.system_recorded_at) <= atDate) {
        latestEntry = entry
      } else {
        break
      }
    }
    if (
      latestEntry &&
      latestEntry.status === 'completed' &&
      latestEntry.next_review_due !== null &&
      new Date(latestEntry.next_review_due) >= atDate
    ) {
      compliant++
    }
  }
  return { compliant, total, pct: Math.round((compliant / total) * 100) }
}

// ── SVG Chart ─────────────────────────────────────────────────────────────────

function TrendChart({ points }: { points: { label: string; pct: number }[] }) {
  const W = 700
  const H = 280
  const PAD = { top: 36, right: 24, bottom: 50, left: 45 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const n = points.length
  const mapped = points.map((p, i) => ({
    x: PAD.left + (n > 1 ? (i / (n - 1)) * cW : cW / 2),
    y: PAD.top + cH - (p.pct / 100) * cH,
    pct: p.pct,
    label: p.label,
  }))

  const linePath = mapped
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const areaPath =
    n > 0
      ? `${linePath} L ${mapped[n - 1].x.toFixed(1)} ${(PAD.top + cH).toFixed(1)} L ${mapped[0].x.toFixed(1)} ${(PAD.top + cH).toFixed(1)} Z`
      : ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Readiness trend over 8 weeks"
      role="img"
    >
      {/* Horizontal grid lines + Y labels */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PAD.top + cH - (pct / 100) * cH
        return (
          <g key={pct}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke={pct === 0 ? '#d1d5db' : '#f3f4f6'}
              strokeWidth="1"
            />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
              {pct}%
            </text>
          </g>
        )
      })}

      {/* Shaded area under the line */}
      {areaPath && <path d={areaPath} fill="#014D4E" fillOpacity="0.08" />}

      {/* Trend line */}
      {n > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="#014D4E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data points, % labels, and x-axis date labels */}
      {mapped.map((p, i) => (
        <g key={i}>
          {/* % label above the dot */}
          <text
            x={p.x}
            y={p.y - 11}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#014D4E"
          >
            {p.pct}%
          </text>
          {/* Dot */}
          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#014D4E" strokeWidth="2" />
          {/* Date label below x-axis */}
          <text
            x={p.x}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TrendPage() {
  const supabase = await createClient()

  const [{ data: keyQuestions }, { data: kloItems }, { data: allHistory }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name').order('display_order'),
      supabase.from('klo_items').select('id, key_question_id'),
      supabase
        .from('compliance_record_history')
        .select('klo_item_id, status, next_review_due, system_recorded_at')
        .order('system_recorded_at', { ascending: true }),
    ])

  // Build lookup maps
  const allKloIds: string[] = []
  const klosByKq = new Map<string, string[]>()

  for (const klo of kloItems ?? []) {
    allKloIds.push(klo.id)
    const arr = klosByKq.get(klo.key_question_id) ?? []
    arr.push(klo.id)
    klosByKq.set(klo.key_question_id, arr)
  }

  // Group history entries by KLOE (already sorted ascending)
  const historyByKlo = new Map<string, HistoryEntry[]>()
  for (const entry of allHistory ?? []) {
    if (!entry.status) continue          // skip null-status rows (shouldn't occur)
    const arr = historyByKlo.get(entry.klo_item_id) ?? []
    arr.push({ ...entry, status: entry.status })
    historyByKlo.set(entry.klo_item_id, arr)
  }

  // Generate 8 weekly time points: 7 weeks ago → today (inclusive)
  const baseNow = new Date()
  baseNow.setHours(23, 59, 59, 999)

  const weekPoints = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(baseNow)
    d.setDate(d.getDate() - (7 - i) * 7)
    d.setHours(23, 59, 59, 999)
    return {
      date: d,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    }
  })

  // Compute readiness at each week point
  const computed = weekPoints.map(wp => {
    const overall = computeAtDate(allKloIds, historyByKlo, wp.date)
    const byKq = new Map<string, { pct: number; compliant: number; total: number }>()
    for (const [kqId, kloIds] of klosByKq) {
      byKq.set(kqId, computeAtDate(kloIds, historyByKlo, wp.date))
    }
    return { label: wp.label, overallPct: overall.pct, byKq }
  })

  const currentPoint = computed[computed.length - 1]           // index 7 = now
  const fourWeeksAgoPoint = computed[computed.length - 5]      // index 3 = 4 weeks ago

  const chartData = computed.map(p => ({ label: p.label, pct: p.overallPct }))
  const hasHistory = (allHistory ?? []).length > 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li>
            <Link href="/dashboard" className="hover:text-[#014D4E] underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">
            Readiness Trend
          </li>
        </ol>
      </nav>

      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">Readiness Trend</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overall inspection readiness over the last 8 weeks — derived from your audit history
          </p>
        </div>

        {/* Current % pill */}
        <div className="bg-[#014D4E] text-white rounded-xl px-6 py-3 text-center min-w-[100px]">
          <div className="text-3xl font-bold leading-none">{currentPoint.overallPct}%</div>
          <div className="text-xs opacity-70 mt-1">current readiness</div>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!hasHistory ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <p className="text-gray-500 text-sm mb-3">
            No review history yet. Once you start logging KLOE reviews, your
            readiness trend will appear here.
          </p>
          <Link
            href="/dashboard/kloes"
            className="text-sm font-medium text-[#014D4E] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
          >
            Go to KLOEs →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Line chart ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-4">
              Overall readiness — 8-week view
            </h2>
            <TrendChart points={chartData} />
          </div>

          {/* ── Per-key-question breakdown ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
              By key question
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Comparing current readiness against 4 weeks ago
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th scope="col" className="text-left py-2 pr-4 font-medium">
                      Key question
                    </th>
                    <th scope="col" className="text-right py-2 px-4 font-medium">
                      4 weeks ago
                    </th>
                    <th scope="col" className="text-right py-2 px-4 font-medium">
                      Now
                    </th>
                    <th scope="col" className="text-center py-2 pl-4 font-medium">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(keyQuestions ?? []).map(kq => {
                    const ago = fourWeeksAgoPoint.byKq.get(kq.id) ?? {
                      pct: 0,
                      compliant: 0,
                      total: 0,
                    }
                    const now = currentPoint.byKq.get(kq.id) ?? {
                      pct: 0,
                      compliant: 0,
                      total: 0,
                    }
                    const delta = now.pct - ago.pct

                    const changeBadge =
                      delta > 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          ↑ +{delta}%
                        </span>
                      ) : delta < 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          ↓ {delta}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                          → no change
                        </span>
                      )

                    return (
                      <tr key={kq.id} className="hover:bg-[#faf9f6] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[#1a1a1a]">
                          {kq.name}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 tabular-nums">
                          {ago.pct}%
                          <span className="text-gray-400 text-xs ml-1">
                            ({ago.compliant}/{ago.total})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#014D4E] tabular-nums">
                          {now.pct}%
                          <span className="text-gray-400 text-xs ml-1 font-normal">
                            ({now.compliant}/{now.total})
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-center">{changeBadge}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
              A KLOE counts as ready when its status is <em>completed</em> and its
              next review date has not yet passed.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
