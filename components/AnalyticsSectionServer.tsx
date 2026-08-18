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
  const W = 560; const H = 160
  const PAD = { top: 18, right: 16, bottom: 26, left: 32 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const n = points.length
  const yAt = (pct: number) => PAD.top + cH - (pct / 100) * cH
  const mapped = points.map((p, i) => ({
    x: PAD.left + (n > 1 ? (i / (n - 1)) * cW : cW / 2),
    y: yAt(p.pct),
    pct: p.pct,
    label: p.label,
  }))
  const linePath = mapped.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = n > 0
    ? `${linePath} L ${mapped[n-1].x.toFixed(1)} ${(PAD.top+cH).toFixed(1)} L ${mapped[0].x.toFixed(1)} ${(PAD.top+cH).toFixed(1)} Z`
    : ''
  const y100 = yAt(100); const y75 = yAt(75); const y50 = yAt(50); const y25 = yAt(25); const y0 = yAt(0)
  const xL = PAD.left; const xR = W - PAD.right
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="6-month readiness trend" role="img">
      {/* Colour zones: equal 25-point bands — higher = better */}
      <rect x={xL} y={y100} width={xR - xL} height={y75 - y100} fill="#458F00" fillOpacity="0.10" />
      <rect x={xL} y={y75} width={xR - xL} height={y50 - y75} fill="#458F00" fillOpacity="0.06" />
      <rect x={xL} y={y50} width={xR - xL} height={y25 - y50} fill="#F47738" fillOpacity="0.06" />
      <rect x={xL} y={y25} width={xR - xL} height={y0 - y25} fill="#DA291C" fillOpacity="0.05" />
      {/* Gridlines at each 25% threshold */}
      <line x1={xL} x2={xR} y1={y75} y2={y75} stroke="#458F00" strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1={xL} x2={xR} y1={y50} y2={y50} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.4" />
      <line x1={xL} x2={xR} y1={y25} y2={y25} stroke="#DA291C" strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.35" />
      {/* Baseline */}
      <line x1={xL} x2={xR} y1={y0} y2={y0} stroke="#d1d5db" strokeWidth="1" />
      {/* Y-axis labels at every 25% */}
      {[0, 25, 50, 75, 100].map(p => (
        <text key={p} x={xL - 5} y={yAt(p) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{p}%</text>
      ))}
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
      <p className="text-sm text-ink-muted pt-1">In-date = next review date has not yet passed.</p>
    </div>
  )
}

// Colours match CQC's official rating system — see PROJECT_BRIEF.md § CQC Rating Colours
const RATING_COLOUR: Record<string, { fill: string; text: string; label: string }> = {
  outstanding:          { fill: '#6D276A', text: '#ffffff', label: 'Outstanding' },
  good:                 { fill: '#458F00', text: '#ffffff', label: 'Good' },
  requires_improvement: { fill: '#F47738', text: '#ffffff', label: 'Req. Improvement' },
  inadequate:           { fill: '#DA291C', text: '#ffffff', label: 'Inadequate' },
}
const RATING_ORDER: Record<string, number> = { inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3 }

function MockTrendChartSkeleton() {
  const W = 560; const H = 90
  const PAD = { left: 24, right: 24, top: 28, bottom: 28 }
  const cW = W - PAD.left - PAD.right
  const cy = H / 2
  // Ghost dots at evenly spaced positions with placeholder ratings
  const ghost = [
    { x: PAD.left,                fill: '#DA291C' },
    { x: PAD.left + cW * 0.33,   fill: '#F47738' },
    { x: PAD.left + cW * 0.66,   fill: '#F47738' },
    { x: PAD.left + cW,          fill: '#458F00' },
  ]
  return (
    <div>
      <div className="opacity-30 select-none" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <polyline
            points={ghost.map(d => `${d.x},${cy}`).join(' ')}
            fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 3"
          />
          {ghost.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={cy} r="10" fill={d.fill} />
              <text x={d.x} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
                {i === 0 ? 'I' : i === 3 ? 'G' : 'RI'}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex gap-3 mt-2 flex-wrap">
          {Object.entries(RATING_COLOUR).map(([, cfg]) => (
            <span key={cfg.label} className="flex items-center gap-1.5 text-xs text-ink-dim">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cfg.fill }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-ink-muted mt-2">Complete a mock inspection to see your ratings trend here.</p>
    </div>
  )
}

function MockActionPlanSkeleton() {
  const areas = [
    { label: 'Safe',        pct: 75, colour: '#F47738' },
    { label: 'Effective',   pct: 100, colour: '#458F00' },
    { label: 'Caring',      pct: 0,   colour: '#DA291C' },
    { label: 'Responsive',  pct: 50,  colour: '#F47738' },
    { label: 'Well-Led',    pct: 100, colour: '#458F00' },
  ]
  return (
    <div>
      <div className="opacity-30 select-none" aria-hidden="true">
        <p className="text-xs text-ink-muted mb-3">Most recent inspection: — Aug 2026. Amber and red findings only.</p>
        <div className="space-y-2">
          {areas.map(({ label, pct, colour }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-ink w-28 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colour }} />
              </div>
              <span className="text-xs font-semibold tabular-nums w-12 text-right" style={{ color: colour }}>
                {pct === 100 ? '2 / 2' : pct === 75 ? '3 / 4' : pct === 50 ? '1 / 2' : '0 / 1'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-muted mt-3">Create action items from the mock inspection report to link them to specific findings.</p>
      </div>
      <p className="text-sm text-ink-muted mt-2">Complete a mock inspection to see action plan coverage here.</p>
    </div>
  )
}

function MockTrendChart({ sessions }: { sessions: { date: string; worstRating: string }[] }) {
  if (sessions.length === 0) return <MockTrendChartSkeleton />
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
      <p className="text-sm text-ink-muted pt-1">Reviews due soon — plan workload before inspection.</p>
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
    { data: allAbsenceRows },
    { data: mockRows },
    { data: evidenceRows },
    { data: pvEvidenceRows },
    { data: pvStatements },
    { data: kloItemRows },
    { data: keyQuestionRows },
    { data: iStatementActionRows },
  ] = await Promise.all([
    supabase.from('compliance_record_history')
      .select('klo_item_id, status, next_review_due, system_recorded_at')
      .order('system_recorded_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('action_items')
      .select('klo_item_id, status, priority, due_date, mock_inspection_finding_id')
      .eq('organisation_id', orgId),
    supabase.from('hr_staff_profiles')
      .select('dbs_next_review_due, supervision_next_due, appraisal_next_due')
      .eq('organisation_id', orgId),
    supabase.from('hr_absence_records')
      .select('absence_type, absence_days, start_date, end_date, rtw_interview_completed, reason_category')
      .eq('organisation_id', orgId),
    supabase.from('mock_inspections')
      .select('id, started_at, completed_at')
      .eq('organisation_id', orgId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true }),
    supabase.from('kloe_evidence').select('klo_item_id').eq('organisation_id', orgId),
    supabase.from('i_statement_evidence').select('confidence'),
    supabase.from('i_statements').select('id'),
    supabase.from('klo_items').select('id, key_question_id').in('id', kloItemIds),
    supabase.from('key_questions').select('id, name').order('name'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('i_statement_actions').select('i_statement_id').eq('organisation_id', orgId),
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

  // ── KLOE ownership ────────────────────────────────────────────────────────
  // kloItemRows and keyQuestionRows used below for mock inspection card
  void kloItemRows; void keyQuestionRows

  const assigned   = records.filter(r => r.assigned_to != null).length
  const unassigned = totalKlos - assigned
  const ownershipPct = pct(assigned, totalKlos)

  // ── People's Voice ────────────────────────────────────────────────────────
  const pvTotal       = (pvStatements ?? []).length
  const pvEvRows      = pvEvidenceRows ?? []
  const pvStrong      = pvEvRows.filter(e => e.confidence === 'green').length
  const pvNeedsWork   = pvEvRows.filter(e => e.confidence === 'amber' || e.confidence === 'red').length
  const pvNotAssessed = pvTotal - pvEvRows.filter(e => e.confidence !== 'not_assessed').length
  const pvPct         = pct(pvStrong, pvTotal)

  // ── Action plan health ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: { klo_item_id: string; status: string; priority: string; due_date: string | null; mock_inspection_finding_id: string | null }[] = (actionRows as any) ?? []
  const statusCounts   = { to_do: 0, in_progress: 0, completed: 0 }
  const priorityCounts: Record<string, number> = {}
  for (const a of actions) {
    if (a.status in statusCounts) statusCounts[a.status as keyof typeof statusCounts]++
    priorityCounts[a.priority] = (priorityCounts[a.priority] ?? 0) + 1
  }

  // ── Evidence coverage (from passed records, supplemented by kloe_evidence) ──
  const kloesWithEvidence = new Set((evidenceRows ?? []).map(e => e.klo_item_id)).size
  const evidencePct = pct(kloesWithEvidence, totalKlos)

  // ── KLOE action plan coverage ─────────────────────────────────────────────
  const kloesWithActions = new Set(actions.map(a => a.klo_item_id)).size
  const kloeActionPct    = pct(kloesWithActions, totalKlos)

  // ── People's Voice action plan coverage ───────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iStatActions: { i_statement_id: string }[] = (iStatementActionRows as any) ?? []
  const statementsWithActions = new Set(iStatActions.map(a => a.i_statement_id)).size
  const pvActionPct           = pct(statementsWithActions, pvTotal)

  // ── Mock inspection action plan coverage (most recent inspection) ─────────
  type MifRow = { id: string; mock_inspection_id: string; rating: string; klo_items: { key_question_id: string; key_questions: { name: string } | null } | null }
  const mostRecentInspection = (mockRows ?? []).at(-1)
  let mockCoverage: { area: string; total: number; actioned: number }[] = []

  if (mostRecentInspection) {
    const { data: detailedFindings } = await supabase
      .from('mock_inspection_findings')
      .select('id, mock_inspection_id, rating, klo_items ( key_question_id, key_questions ( name ) )')
      .eq('mock_inspection_id', mostRecentInspection.id)
    const mifRows = (detailedFindings ?? []) as unknown as MifRow[]

    // Only amber/red findings count — those are the ones needing action
    const weakFindings = mifRows.filter(f => f.rating === 'requires_improvement' || f.rating === 'inadequate')

    // Set of finding IDs that have an action item linked
    const actionedFindingIds = new Set(
      actions.filter(a => a.mock_inspection_finding_id != null).map(a => a.mock_inspection_finding_id!)
    )

    // Group by CQC area
    const byArea = new Map<string, { total: number; actioned: number }>()
    const CQC_AREA_ORDER = ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-Led']
    for (const area of CQC_AREA_ORDER) byArea.set(area, { total: 0, actioned: 0 })

    for (const f of weakFindings) {
      const area = f.klo_items?.key_questions?.name ?? 'Other'
      if (!byArea.has(area)) byArea.set(area, { total: 0, actioned: 0 })
      const entry = byArea.get(area)!
      entry.total++
      if (actionedFindingIds.has(f.id)) entry.actioned++
    }
    mockCoverage = CQC_AREA_ORDER
      .filter(area => (byArea.get(area)?.total ?? 0) > 0)
      .map(area => ({ area, ...byArea.get(area)! }))
  }

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

  // ── HR absence analytics ───────────────────────────────────────────────────
  const absenceRows = allAbsenceRows ?? []

  // RTW compliance: closed episodes only (sick leave with an end date)
  const closedSickEpisodes = absenceRows.filter(r => r.absence_type === 'sick' && r.end_date)
  const rtwCompleted       = closedSickEpisodes.filter(r => r.rtw_interview_completed).length
  const rtwTotal           = closedSickEpisodes.length
  const rtwPct             = pct(rtwCompleted, rtwTotal)

  // Bradford Factor per staff member (group by user via absence days/episodes)
  // We don't have user_id here — compute org-level band distribution instead:
  // count episodes per unique combination: we only have org-level data, so we
  // compute individual Bradford scores by grouping on the absence records we have.
  // Since we don't select user_id, group by rolling 52-week sick episodes overall.
  const rollingCutoff = new Date(); rollingCutoff.setDate(rollingCutoff.getDate() - 364)
  const rollingSick   = absenceRows.filter(r =>
    r.absence_type === 'sick' && new Date(r.start_date) >= rollingCutoff
  )
  // Org-wide Bradford summary: total episodes, total days — give a team overview stat
  const bfEpisodes = rollingSick.length
  const bfDays     = rollingSick.reduce((sum, r) => sum + (r.absence_days ?? 0), 0)
  const bfOrgScore = bfEpisodes * bfEpisodes * bfDays

  // Absence reason breakdown (all episodes, any absence type)
  const reasonCounts = new Map<string, number>()
  for (const r of absenceRows) {
    const cat = r.reason_category ?? 'Not recorded'
    reasonCounts.set(cat, (reasonCounts.get(cat) ?? 0) + 1)
  }
  const reasonRows = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* ── LEFT COLUMN: Overall readiness · KLOE group · People's Voice ── */}
          <div className="flex flex-col gap-4">

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">Overall readiness — 6-month view</h3>
              <TrendChart points={trendPoints} />
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE ownership</h3>
              <CompletionBar
                label={`of ${totalKlos} KLOEs assigned to a team member`}
                pct={ownershipPct}
                colourA="bg-[#014D4E]" countA={assigned}   labelA="Assigned"
                colourB="bg-gray-200"  countB={unassigned} labelB="Unassigned"
                colourC="bg-gray-200"  countC={0}          labelC=""
              />
              <p className="text-sm text-ink-muted mt-3">
                {unassigned > 0
                  ? `${unassigned} KLOE${unassigned !== 1 ? 's have' : ' has'} no owner — assign from each KLOE's detail page.`
                  : 'All KLOEs have an owner.'}
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE evidence coverage</h3>
              <CompletionBar
                label="of KLOEs have evidence attached"
                pct={evidencePct}
                colourA="bg-[#014D4E]" countA={kloesWithEvidence}             labelA="With evidence"
                colourB="bg-gray-200"  countB={totalKlos - kloesWithEvidence}  labelB="No evidence"
                colourC="bg-transparent" countC={0} labelC=""
              />
              <p className="text-sm text-ink-muted mt-3">CQC inspectors expect evidence to support every KLOE — not just a completed status.</p>
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE action plan coverage</h3>
              <CompletionBar
                label={`of ${totalKlos} KLOEs have an action plan`}
                pct={kloeActionPct}
                colourA="bg-[#014D4E]" countA={kloesWithActions}            labelA="With actions"
                colourB="bg-gray-200"  countB={totalKlos - kloesWithActions} labelB="No actions"
                colourC="bg-transparent" countC={0} labelC=""
              />
              <p className="text-sm text-ink-muted mt-3">
                {totalKlos - kloesWithActions > 0
                  ? `${totalKlos - kloesWithActions} KLOE${totalKlos - kloesWithActions !== 1 ? 's have' : ' has'} no action plan. Add from each KLOE's detail page.`
                  : 'All KLOEs have at least one action item.'}
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE action plan health</h3>
              {actions.length === 0 ? (
                <div>
                  <div className="opacity-30 select-none space-y-5" aria-hidden="true">
                    <div>
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By status</p>
                      <MiniBarChart
                        rows={[
                          { label: 'To do',       count: 6, colour: 'bg-gray-400' },
                          { label: 'In progress', count: 2, colour: 'bg-amber-400' },
                          { label: 'Completed',   count: 1, colour: 'bg-green-500' },
                        ]}
                        total={9}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By priority</p>
                      <MiniBarChart
                        rows={[
                          { label: 'High',   count: 3, colour: 'bg-red-400'   },
                          { label: 'Medium', count: 4, colour: 'bg-amber-400' },
                          { label: 'Low',    count: 2, colour: 'bg-green-400' },
                        ]}
                        total={9}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted mt-3">Add action items from any KLOE detail page to see your plan health here.</p>
                </div>
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

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE review calendar</h3>
              <ReviewCalendarChart overdue={reviewOverdue} due30={reviewDue30} due60={reviewDue60} due90={reviewDue90} />
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">People&apos;s Voice coverage</h3>
              <CompletionBar
                label={`of ${pvTotal} statements with strong evidence`}
                pct={pvPct}
                colourA="bg-green-500" countA={pvStrong}      labelA="Strong evidence"
                colourB="bg-amber-400" countB={pvNeedsWork}   labelB="Needs work"
                colourC="bg-gray-200"  countC={pvNotAssessed} labelC="Not assessed"
              />
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">People&apos;s Voice action plan coverage</h3>
              {pvTotal === 0 ? (
                <p className="text-sm text-ink-muted">No &ldquo;I&rdquo; statements found. Add statements in the People&apos;s Voice section.</p>
              ) : (
                <>
                  <CompletionBar
                    label={`of ${pvTotal} "I" statements have an action plan`}
                    pct={pvActionPct}
                    colourA="bg-[#014D4E]" countA={statementsWithActions}          labelA="With actions"
                    colourB="bg-gray-200"  countB={pvTotal - statementsWithActions} labelB="No actions"
                    colourC="bg-transparent" countC={0} labelC=""
                  />
                  <p className="text-sm text-ink-muted mt-3">
                    {pvTotal - statementsWithActions > 0
                      ? `${pvTotal - statementsWithActions} statement${pvTotal - statementsWithActions !== 1 ? 's have' : ' has'} no action plan. Add from the People's Voice section.`
                      : 'All "I" statements have at least one action item.'}
                  </p>
                </>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: Mock inspection · Review · HR ───────────────── */}
          <div className="flex flex-col gap-4">

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Mock inspection ratings</h3>
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

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Mock inspection — action plan coverage</h3>
              {!mostRecentInspection ? (
                <MockActionPlanSkeleton />
              ) : mockCoverage.length === 0 ? (
                <p className="text-sm text-ink-muted">No amber or red findings in your most recent mock inspection — nothing to action.</p>
              ) : (
                <>
                  <p className="text-xs text-ink-muted mb-3">
                    Most recent inspection: {new Date(mostRecentInspection.completed_at ?? mostRecentInspection.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
                    Amber and red findings only.
                  </p>
                  <div className="space-y-2">
                    {mockCoverage.map(({ area, total, actioned }) => {
                      const areaPct = pct(actioned, total)
                      const colour  = actioned === total ? '#458F00' : actioned === 0 ? '#DA291C' : '#F47738'
                      return (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-sm text-ink w-28 shrink-0">{area}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${areaPct}%`, backgroundColor: colour }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums w-12 text-right" style={{ color: colour }}>
                            {actioned} / {total}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-sm text-ink-muted mt-3">
                    Create action items from the mock inspection report to link them to specific findings.
                  </p>
                </>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Return-to-work interviews</h3>
              {rtwTotal === 0 ? (
                <div>
                  <div className="opacity-30 select-none" aria-hidden="true">
                    <CompletionBar
                      label="of closed sick-leave episodes have an RTW interview recorded"
                      pct={66}
                      colourA="bg-[#014D4E]" countA={2} labelA="RTW recorded"
                      colourB="bg-gray-200"   countB={1} labelB="Not recorded"
                      colourC="bg-transparent" countC={0} labelC=""
                    />
                  </div>
                  <p className="text-sm text-ink-muted mt-2">Log absence episodes to track RTW interview compliance here.</p>
                </div>
              ) : (
                <>
                  <CompletionBar
                    label={`of ${rtwTotal} closed sick-leave episode${rtwTotal !== 1 ? 's have' : ' has'} an RTW interview recorded`}
                    pct={rtwPct}
                    colourA="bg-[#014D4E]"  countA={rtwCompleted}          labelA="RTW recorded"
                    colourB="bg-gray-200"   countB={rtwTotal - rtwCompleted} labelB="Not recorded"
                    colourC="bg-transparent" countC={0} labelC=""
                  />
                  <p className="text-sm text-ink-muted mt-3">
                    {rtwTotal - rtwCompleted > 0
                      ? `${rtwTotal - rtwCompleted} episode${rtwTotal - rtwCompleted !== 1 ? 's' : ''} missing an RTW interview — record from each staff member's HR page.`
                      : 'All closed sick-leave episodes have an RTW interview recorded.'}
                  </p>
                </>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Absence reasons</h3>
              {absenceRows.length === 0 ? (
                <div>
                  <div className="opacity-30 select-none" aria-hidden="true">
                    <MiniBarChart
                      rows={[
                        { label: 'Musculoskeletal',  count: 4, colour: 'bg-[#014D4E]' },
                        { label: 'Mental health',     count: 3, colour: 'bg-[#014D4E]' },
                        { label: 'Respiratory',       count: 2, colour: 'bg-[#014D4E]' },
                        { label: 'Injury',            count: 1, colour: 'bg-[#014D4E]' },
                      ]}
                      total={10}
                    />
                  </div>
                  <p className="text-sm text-ink-muted mt-2">Log absence episodes to see the breakdown of reasons here.</p>
                </div>
              ) : (
                <>
                  <MiniBarChart
                    rows={reasonRows.map(r => ({ label: r.label, count: r.count, colour: 'bg-[#014D4E]' }))}
                    total={absenceRows.length}
                  />
                  <p className="text-sm text-ink-muted mt-3">
                    {absenceRows.length} absence episode{absenceRows.length !== 1 ? 's' : ''} recorded across all staff.
                  </p>
                </>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Bradford Factor — team overview</h3>
              {rollingSick.length === 0 ? (
                <div>
                  <div className="opacity-30 select-none" aria-hidden="true">
                    <div className="flex gap-3">
                      {[{ label: 'Episodes', val: '6' }, { label: 'Days lost', val: '14' }, { label: 'Org score', val: '504' }].map(s => (
                        <div key={s.label} className="flex-1 bg-fill rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-ink">{s.val}</p>
                          <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted mt-2">Log sick-leave episodes to see Bradford Factor data here.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-3">
                    {[
                      { label: 'Episodes (52 wks)', val: bfEpisodes },
                      { label: 'Days lost (52 wks)', val: bfDays % 1 === 0 ? bfDays : bfDays.toFixed(1) },
                      { label: 'Org score (S²×D)', val: bfOrgScore },
                    ].map(s => (
                      <div key={s.label} className="flex-1 bg-fill rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-ink">{s.val}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-ink-muted">
                    Individual scores are on each staff member&apos;s HR page. Score ≤ 50 = low · 51–450 = medium · 451+ = high.
                  </p>
                </>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">HR compliance</h3>
              {hrTotal === 0 ? (
                <div>
                  <div className="opacity-30 select-none" aria-hidden="true">
                    <HrComplianceChart checks={[
                      { label: 'DBS checks',   inDate: 0, total: 10 },
                      { label: 'Supervisions', inDate: 0, total: 10 },
                      { label: 'Appraisals',   inDate: 0, total: 10 },
                    ]} />
                  </div>
                  <p className="text-sm text-ink-muted mt-2">Add staff profiles in HR to see compliance rates here.</p>
                </div>
              ) : (
                <HrComplianceChart checks={hrChecks} />
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
