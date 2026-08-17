/**
 * AnalyticsSectionServer — async server component
 *
 * Fetches the heavier analytics data and renders all 8 analytics charts.
 * Rendered inside a <Suspense> boundary in the dashboard page so it streams
 * in after the At a Glance section without blocking the initial paint.
 *
 * Props supplied by the parent (already fetched there):
 *   orgId       — scopes all queries
 *   records     — compliance_records (reused to avoid duplicate fetch)
 *   kloItemIds  — all KLOE IDs for this org (for trend chart)
 *   totalKlos   — denominator for evidence coverage %
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ComplianceRecord } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryEntry = {
  klo_item_id: string
  status: string
  next_review_due: string | null
  system_recorded_at: string
}

// ── Helper ────────────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function computeAtDate(
  kloIds: string[],
  historyByKlo: Map<string, HistoryEntry[]>,
  atDate: Date
): number {
  const total = kloIds.length
  if (total === 0) return 0
  let compliant = 0
  for (const kloId of kloIds) {
    const entries = historyByKlo.get(kloId) ?? []
    let latest: HistoryEntry | null = null
    for (const e of entries) {
      if (new Date(e.system_recorded_at) <= atDate) latest = e
      else break
    }
    if (
      latest?.status === 'completed' &&
      latest.next_review_due !== null &&
      new Date(latest.next_review_due) >= atDate
    ) compliant++
  }
  return Math.round((compliant / total) * 100)
}

// ── Chart components ──────────────────────────────────────────────────────────

function TrendChart({ points }: { points: { label: string; pct: number }[] }) {
  const W = 560; const H = 90
  const PAD = { top: 18, right: 16, bottom: 26, left: 32 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const n = points.length
  const mapped = points.map((p, i) => ({
    x: PAD.left + (n > 1 ? (i / (n - 1)) * cW : cW / 2),
    y: PAD.top + cH - (p.pct / 100) * cH,
    pct: p.pct,
    label: p.label,
  }))
  const linePath = mapped.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = n > 0
    ? `${linePath} L ${mapped[n-1].x.toFixed(1)} ${(PAD.top+cH).toFixed(1)} L ${mapped[0].x.toFixed(1)} ${(PAD.top+cH).toFixed(1)} Z`
    : ''
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="6-month readiness trend" role="img">
      {[0, 50, 100].map(p => {
        const y = PAD.top + cH - (p / 100) * cH
        return (
          <g key={p}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={p === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth="1" />
            <text x={PAD.left - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{p}%</text>
          </g>
        )
      })}
      {areaPath && <path d={areaPath} fill="#014D4E" fillOpacity="0.08" />}
      {n > 1 && <path d={linePath} fill="none" stroke="#014D4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
      {mapped.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="#014D4E">{p.pct}%</text>
          <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#014D4E" strokeWidth="1.5" />
          <text x={p.x} y={H - PAD.bottom + 11} textAnchor="middle" fontSize="8" fill="#9ca3af">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

function CompletionBar({ label, pct: p, colourA, countA, labelA, colourB, countB, labelB, colourC, countC, labelC }: {
  label: string; pct: number
  colourA: string; countA: number; labelA: string
  colourB: string; countB: number; labelB: string
  colourC: string; countC: number; labelC: string
}) {
  const total = countA + countB + countC
  const w = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0
  return (
    <div>
      <div className="flex items-end gap-3 mb-3">
        <span className="text-4xl font-bold text-brand tabular-nums">{p}%</span>
        <span className="text-sm text-ink-dim pb-1">{label}</span>
      </div>
      <div className="h-5 rounded-full overflow-hidden flex bg-gray-100 mb-3">
        {countA > 0 && <div style={{ width: `${w(countA)}%` }} className={`${colourA} h-full`} />}
        {countB > 0 && <div style={{ width: `${w(countB)}%` }} className={`${colourB} h-full`} />}
        {countC > 0 && <div style={{ width: `${w(countC)}%` }} className={`${colourC} h-full`} />}
      </div>
      <div className="flex gap-4 flex-wrap">
        {[{c: colourA, l: labelA, n: countA}, {c: colourB, l: labelB, n: countB}, {c: colourC, l: labelC, n: countC}].map(x => (
          x.n > 0 && (
            <span key={x.l} className="flex items-center gap-1.5 text-xs text-ink-dim">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${x.c}`} />
              {x.l} <span className="font-semibold text-ink tabular-nums">{x.n}</span>
            </span>
          )
        ))}
      </div>
    </div>
  )
}

function MiniBarChart({ rows, total }: { rows: { label: string; count: number; colour: string }[]; total: number }) {
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="text-xs text-ink-dim w-28 shrink-0">{r.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${r.colour}`} style={{ width: total > 0 ? `${Math.round((r.count / total) * 100)}%` : '0%' }} />
          </div>
          <span className="text-xs font-semibold text-ink tabular-nums w-6 text-right">{r.count}</span>
        </div>
      ))}
    </div>
  )
}

function HrComplianceChart({ checks }: { checks: { label: string; inDate: number; total: number }[] }) {
  return (
    <div className="space-y-4">
      {checks.map(c => {
        const p = c.total > 0 ? Math.round((c.inDate / c.total) * 100) : 0
        const colour = p >= 90 ? 'bg-green-500' : p >= 70 ? 'bg-amber-400' : 'bg-red-400'
        return (
          <div key={c.label}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-ink">{c.label}</span>
              <span className="text-xs text-ink-muted tabular-nums">{c.inDate}/{c.total} ({p}%)</span>
            </div>
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${colour}`} style={{ width: `${p}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-xs text-ink-muted pt-1">In-date = next review date has not yet passed.</p>
    </div>
  )
}

// Colours match RATING_STRIP in app/dashboard/post-inspection/rating-utils.ts
const RATING_COLOUR: Record<string, { fill: string; text: string; label: string }> = {
  outstanding:          { fill: '#a855f7', text: '#ffffff', label: 'Outstanding' },
  good:                 { fill: '#22c55e', text: '#ffffff', label: 'Good' },
  requires_improvement: { fill: '#f59e0b', text: '#ffffff', label: 'Req. Improvement' },
  inadequate:           { fill: '#ef4444', text: '#ffffff', label: 'Inadequate' },
}
const RATING_ORDER: Record<string, number> = { inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3 }

function MockTrendChart({ sessions }: { sessions: { date: string; worstRating: string }[] }) {
  if (sessions.length === 0) return <p className="text-xs text-ink-muted">No completed mock inspections yet.</p>
  const W = 560; const H = 90
  const PAD = { left: 24, right: 24, top: 28, bottom: 28 }
  const n = sessions.length
  const xs = sessions.map((_, i) => PAD.left + (n > 1 ? (i / (n - 1)) * (W - PAD.left - PAD.right) : (W - PAD.left - PAD.right) / 2))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Mock inspection rating trend" role="img">
      {n > 1 && <polyline points={xs.map(x => `${x.toFixed(1)},${(H/2).toFixed(1)}`).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1.5" />}
      {sessions.map((s, i) => {
        const cfg = RATING_COLOUR[s.worstRating] ?? { fill: '#9ca3af', text: '#fff', label: s.worstRating }
        const x = xs[i]
        const dateShort = new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return (
          <g key={i}>
            <circle cx={x} cy={H/2} r="10" fill={cfg.fill} />
            <text x={x} y={H/2 + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={cfg.text}>
              {s.worstRating === 'requires_improvement' ? 'RI' : s.worstRating.charAt(0).toUpperCase()}
            </text>
            <text x={x} y={PAD.top - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{dateShort}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ReviewCalendarChart({ overdue, due30, due60, due90 }: { overdue: number; due30: number; due60: number; due90: number }) {
  const bars = [
    { label: 'Overdue',      count: overdue, colour: 'bg-red-400' },
    { label: 'Next 30 days', count: due30,   colour: 'bg-amber-400' },
    { label: '31–60 days',   count: due60,   colour: 'bg-yellow-300' },
    { label: '61–90 days',   count: due90,   colour: 'bg-green-300' },
  ]
  const max = Math.max(...bars.map(b => b.count), 1)
  return (
    <div className="space-y-2.5">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-2">
          <span className="text-xs text-ink-dim w-28 shrink-0">{b.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${b.colour}`} style={{ width: `${(b.count / max) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-ink tabular-nums w-6 text-right">{b.count}</span>
        </div>
      ))}
      <p className="text-xs text-ink-muted pt-1">Reviews due soon — plan workload before inspection.</p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  orgId: string
  records: ComplianceRecord[]
  kloItemIds: string[]
  totalKlos: number
}

export default async function AnalyticsSectionServer({ orgId, records, kloItemIds, totalKlos }: Props) {
  const supabase = await createClient()

  // All analytics fetches run in parallel — single round trip
  const [
    { data: allHistory },
    { data: actionRows },
    { data: hrProfiles },
    { data: mockRows },
    { data: evidenceRows },
    { data: pvEvidenceRows },
    { data: pvStatements },
  ] = await Promise.all([
    supabase.from('compliance_record_history')
      .select('klo_item_id, status, next_review_due, system_recorded_at')
      .order('system_recorded_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('action_items')
      .select('status, priority, due_date')
      .eq('organisation_id', orgId),
    supabase.from('hr_staff_profiles')
      .select('dbs_next_review_due, supervision_next_due, appraisal_next_due')
      .eq('organisation_id', orgId),
    supabase.from('mock_inspections')
      .select('id, started_at, completed_at')
      .eq('organisation_id', orgId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true }),
    supabase.from('kloe_evidence').select('klo_item_id').eq('organisation_id', orgId),
    supabase.from('i_statement_evidence').select('confidence'),
    supabase.from('i_statements').select('id'),
  ])

  // Mock findings — single IN query instead of N+1
  const mockInspectionIds = (mockRows ?? []).map(r => r.id)
  const { data: allFindings } = mockInspectionIds.length > 0
    ? await supabase
        .from('mock_inspection_findings')
        .select('mock_inspection_id, rating')
        .in('mock_inspection_id', mockInspectionIds)
    : { data: [] }

  // Group findings by inspection, compute worst rating per session
  const findingsByInspection = new Map<string, string[]>()
  for (const f of allFindings ?? []) {
    const arr = findingsByInspection.get(f.mock_inspection_id) ?? []
    arr.push(f.rating)
    findingsByInspection.set(f.mock_inspection_id, arr)
  }
  const mockSessions = (mockRows ?? []).map(insp => {
    const findings = findingsByInspection.get(insp.id) ?? []
    let worstRating = 'outstanding'
    for (const rating of findings) {
      if ((RATING_ORDER[rating] ?? 99) < (RATING_ORDER[worstRating] ?? 99)) worstRating = rating
    }
    return { date: insp.started_at ?? insp.completed_at ?? '', worstRating }
  })

  // ── Trend chart ───────────────────────────────────────────────────────────
  const historyByKlo = new Map<string, HistoryEntry[]>()
  for (const entry of allHistory ?? []) {
    if (!entry.status) continue
    const arr = historyByKlo.get(entry.klo_item_id) ?? []
    arr.push({ ...entry, status: entry.status })
    historyByKlo.set(entry.klo_item_id, arr)
  }
  const baseNow = new Date(); baseNow.setHours(23, 59, 59, 999)
  const trendPoints = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(baseNow)
    d.setMonth(d.getMonth() - (5 - i))
    // Use end of that month
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    d.setHours(23, 59, 59, 999)
    // Don't exceed now
    if (d > baseNow) { d.setTime(baseNow.getTime()) }
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      pct: computeAtDate(kloItemIds, historyByKlo, d),
    }
  })

  // ── KLOE completion (from passed records) ─────────────────────────────────
  const kloeStatusCounts = { completed: 0, in_progress: 0, not_started: 0 }
  for (const r of records) {
    if (r.status === 'completed') kloeStatusCounts.completed++
    else if (r.status === 'in_progress') kloeStatusCounts.in_progress++
    else kloeStatusCounts.not_started++
  }
  const kloeCompletionPct = pct(kloeStatusCounts.completed, totalKlos)

  // ── People's Voice ────────────────────────────────────────────────────────
  const pvTotal       = (pvStatements ?? []).length
  const pvEvRows      = pvEvidenceRows ?? []
  const pvStrong      = pvEvRows.filter(e => e.confidence === 'green').length
  const pvNeedsWork   = pvEvRows.filter(e => e.confidence === 'amber' || e.confidence === 'red').length
  const pvNotAssessed = pvTotal - pvEvRows.filter(e => e.confidence !== 'not_assessed').length
  const pvPct         = pct(pvStrong, pvTotal)

  // ── Action plan health ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: { status: string; priority: string; due_date: string | null }[] = (actionRows as any) ?? []
  const statusCounts   = { to_do: 0, in_progress: 0, completed: 0 }
  const priorityCounts: Record<string, number> = {}
  for (const a of actions) {
    if (a.status in statusCounts) statusCounts[a.status as keyof typeof statusCounts]++
    priorityCounts[a.priority] = (priorityCounts[a.priority] ?? 0) + 1
  }

  // ── Evidence coverage (from passed records, supplemented by kloe_evidence) ──
  const kloesWithEvidence = new Set((evidenceRows ?? []).map(e => e.klo_item_id)).size
  const evidencePct = pct(kloesWithEvidence, totalKlos)

  // ── Review calendar (from passed records) ────────────────────────────────
  const todayMs = new Date().setHours(0, 0, 0, 0)
  let reviewOverdue = 0, reviewDue30 = 0, reviewDue60 = 0, reviewDue90 = 0
  for (const r of records) {
    if (!r.next_review_due) continue
    const dueMs = new Date(r.next_review_due).getTime()
    if (dueMs < todayMs)                          reviewOverdue++
    else if (dueMs <= todayMs + 30 * 86400000)    reviewDue30++
    else if (dueMs <= todayMs + 60 * 86400000)    reviewDue60++
    else if (dueMs <= todayMs + 90 * 86400000)    reviewDue90++
  }

  // ── HR compliance ─────────────────────────────────────────────────────────
  const hrRows  = hrProfiles ?? []
  const hrTotal = hrRows.length
  const today   = new Date(); today.setHours(0, 0, 0, 0)
  function countInDate(field: 'dbs_next_review_due' | 'supervision_next_due' | 'appraisal_next_due') {
    return hrRows.filter(r => r[field] && new Date(r[field]!) >= today).length
  }
  const hrChecks = [
    { label: 'DBS checks',   inDate: countInDate('dbs_next_review_due'), total: hrTotal },
    { label: 'Supervisions', inDate: countInDate('supervision_next_due'), total: hrTotal },
    { label: 'Appraisals',   inDate: countInDate('appraisal_next_due'),   total: hrTotal },
  ]

  const hasHistory = (allHistory ?? []).length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-t border-line pt-8 mt-2">
      <h2 className="text-lg font-bold text-brand mb-6">Analytics</h2>

      {!hasHistory ? (
        <div className="bg-fill border border-line rounded-2xl p-8 text-center max-w-lg">
          <p className="text-sm text-ink-dim mb-3">
            No audit history yet. Start logging KLOE reviews and your analytics will appear here.
          </p>
          <Link href="/dashboard/kloes" className="text-sm font-medium text-brand underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
            Go to KLOEs →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>

          {/* Overall readiness */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">Overall readiness — 6-month view</h3>
            <div className="flex-1 flex items-center">
              <TrendChart points={trendPoints} />
            </div>
          </div>

          {/* Mock inspection ratings */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Mock inspection ratings</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <MockTrendChart sessions={mockSessions} />
                {mockSessions.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {Object.entries(RATING_COLOUR).map(([, cfg]) => (
                      <span key={cfg.label} className="flex items-center gap-1.5 text-xs text-ink-dim">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cfg.fill }} />
                        {cfg.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KLOE completion */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE completion</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <CompletionBar
                  label={`of ${totalKlos} KLOEs completed`}
                  pct={kloeCompletionPct}
                  colourA="bg-green-500" countA={kloeStatusCounts.completed}   labelA="Completed"
                  colourB="bg-amber-400" countB={kloeStatusCounts.in_progress}  labelB="In progress"
                  colourC="bg-gray-200"  countC={kloeStatusCounts.not_started}  labelC="Not started"
                />
              </div>
            </div>
          </div>

          {/* People's Voice coverage */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">People&apos;s Voice coverage</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <CompletionBar
                  label={`of ${pvTotal} statements with strong evidence`}
                  pct={pvPct}
                  colourA="bg-green-500" countA={pvStrong}      labelA="Strong evidence"
                  colourB="bg-amber-400" countB={pvNeedsWork}   labelB="Needs work"
                  colourC="bg-gray-200"  countC={pvNotAssessed} labelC="Not assessed"
                />
              </div>
            </div>
          </div>

          {/* Action plan health */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Action plan health</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                {actions.length === 0 ? (
                  <p className="text-xs text-ink-muted">No action items recorded yet.</p>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By status</p>
                      <MiniBarChart
                        rows={[
                          { label: 'To do',       count: statusCounts.to_do,       colour: 'bg-gray-400' },
                          { label: 'In progress', count: statusCounts.in_progress, colour: 'bg-amber-400' },
                          { label: 'Completed',   count: statusCounts.completed,   colour: 'bg-green-500' },
                        ]}
                        total={actions.length}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By priority</p>
                      <MiniBarChart
                        rows={[
                          { label: 'High',   count: priorityCounts['high']   ?? 0, colour: 'bg-red-400'   },
                          { label: 'Medium', count: priorityCounts['medium'] ?? 0, colour: 'bg-amber-400' },
                          { label: 'Low',    count: priorityCounts['low']    ?? 0, colour: 'bg-green-400' },
                        ]}
                        total={actions.length}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evidence coverage */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Evidence coverage</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <CompletionBar
                  label="of KLOEs have evidence attached"
                  pct={evidencePct}
                  colourA="bg-[#014D4E]" countA={kloesWithEvidence}             labelA="With evidence"
                  colourB="bg-gray-200"  countB={totalKlos - kloesWithEvidence}  labelB="No evidence"
                  colourC="bg-transparent" countC={0} labelC=""
                />
                <p className="text-xs text-ink-muted mt-3">CQC inspectors expect evidence to support every KLOE — not just a completed status.</p>
              </div>
            </div>
          </div>

          {/* Review calendar */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Review calendar</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <ReviewCalendarChart overdue={reviewOverdue} due30={reviewDue30} due60={reviewDue60} due90={reviewDue90} />
              </div>
            </div>
          </div>

          {/* HR compliance */}
          <div className="bg-card rounded-2xl border border-line p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">HR compliance</h3>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                {hrTotal === 0 ? (
                  <p className="text-xs text-ink-muted">No HR staff profiles set up yet.</p>
                ) : (
                  <HrComplianceChart checks={hrChecks} />
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
