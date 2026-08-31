/**
 * Analytics chart primitives — pure presentational components.
 * No data fetching. Imported by AnalyticsSectionServer.tsx.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type HistoryEntry = {
  klo_item_id: string
  status: string
  next_review_due: string | null
  system_recorded_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

export function computeAtDate(
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

// ── Constants ─────────────────────────────────────────────────────────────────

// Colours match CQC's official rating system — see PROJECT_BRIEF.md § CQC Rating Colours
export const RATING_COLOUR: Record<string, { fill: string; text: string; label: string }> = {
  outstanding:          { fill: '#6D276A', text: '#ffffff', label: 'Outstanding' },
  good:                 { fill: '#458F00', text: '#ffffff', label: 'Good' },
  requires_improvement: { fill: '#F47738', text: '#ffffff', label: 'Req. Improvement' },
  inadequate:           { fill: '#DA291C', text: '#ffffff', label: 'Inadequate' },
}

export const RATING_ORDER: Record<string, number> = { inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3 }

// ── Chart components ──────────────────────────────────────────────────────────

export function TrendChart({ points }: { points: { label: string; pct: number }[] }) {
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

export function CompletionBar({ label, pct: p, colourA, countA, labelA, colourB, countB, labelB, colourC, countC, labelC }: {
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

export function MiniBarChart({ rows, total }: { rows: { label: string; count: number; colour: string }[]; total: number }) {
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

export function HrComplianceChart({ checks }: { checks: { label: string; inDate: number; total: number }[] }) {
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

export function MockTrendChartSkeleton() {
  const W = 560; const H = 90
  const PAD = { left: 24, right: 24, top: 28, bottom: 28 }
  const cW = W - PAD.left - PAD.right
  const cy = H / 2
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

export function MockActionPlanSkeleton() {
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

export function MockTrendChart({ sessions }: { sessions: { date: string; worstRating: string }[] }) {
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

export function ReviewCalendarChart({ overdue, due30, due60, due90 }: { overdue: number; due30: number; due60: number; due90: number }) {
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
