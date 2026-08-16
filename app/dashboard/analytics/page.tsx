/**
 * /dashboard/analytics
 *
 * Five compact charts giving a quick read on inspection readiness:
 *   1. Overall readiness trend — 8-week line chart (from compliance_record_history)
 *   2. RAG status by key question — horizontal stacked bars
 *   3. Action plan health — status + priority breakdown
 *   4. HR compliance — DBS / supervision / appraisal % in-date
 *   5. Mock inspection rating trend — dot timeline
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryEntry = {
  klo_item_id: string
  status: string
  next_review_due: string | null
  system_recorded_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    let latestEntry: HistoryEntry | null = null
    for (const entry of entries) {
      if (new Date(entry.system_recorded_at) <= atDate) latestEntry = entry
      else break
    }
    if (
      latestEntry?.status === 'completed' &&
      latestEntry.next_review_due !== null &&
      new Date(latestEntry.next_review_due) >= atDate
    ) compliant++
  }
  return { compliant, total, pct: Math.round((compliant / total) * 100) }
}

// ── Chart components ──────────────────────────────────────────────────────────

/** Chart 1: compact 8-week readiness line */
function ReadinessTrendChart({ points }: { points: { label: string; pct: number }[] }) {
  const W = 560; const H = 200
  const PAD = { top: 28, right: 16, bottom: 40, left: 38 }
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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="8-week readiness trend" role="img">
      {[0, 50, 100].map(pct => {
        const y = PAD.top + cH - (pct / 100) * cH
        return (
          <g key={pct}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={pct === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{pct}%</text>
          </g>
        )
      })}
      {areaPath && <path d={areaPath} fill="#014D4E" fillOpacity="0.08" />}
      {n > 1 && <path d={linePath} fill="none" stroke="#014D4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {mapped.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="10" fontWeight="600" fill="#014D4E">{p.pct}%</text>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#014D4E" strokeWidth="2" />
          <text x={p.x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

/** Chart 2: RAG by key question — horizontal stacked bars */
function RagByKqChart({ rows }: { rows: { name: string; green: number; amber: number; red: number; grey: number; total: number }[] }) {
  return (
    <div className="space-y-3">
      {rows.map(r => {
        const pct = (n: number) => r.total > 0 ? Math.round((n / r.total) * 100) : 0
        return (
          <div key={r.name}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-ink">{r.name}</span>
              <span className="text-xs text-ink-muted tabular-nums">{r.green}/{r.total} ready</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden flex bg-gray-100">
              {r.green > 0  && <div style={{ width: `${pct(r.green)}%`  }} className="bg-green-500 h-full" title={`Green: ${r.green}`} />}
              {r.amber > 0  && <div style={{ width: `${pct(r.amber)}%`  }} className="bg-amber-400 h-full" title={`Amber: ${r.amber}`} />}
              {r.red > 0    && <div style={{ width: `${pct(r.red)}%`    }} className="bg-red-400 h-full"   title={`Red: ${r.red}`} />}
              {r.grey > 0   && <div style={{ width: `${pct(r.grey)}%`   }} className="bg-gray-200 h-full"  title={`Not started: ${r.grey}`} />}
            </div>
          </div>
        )
      })}
      <div className="flex gap-4 mt-2 flex-wrap">
        {[
          { colour: 'bg-green-500', label: 'Ready' },
          { colour: 'bg-amber-400', label: 'Due soon / overdue' },
          { colour: 'bg-red-400',   label: 'Red' },
          { colour: 'bg-gray-200',  label: 'Not started' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-ink-dim">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${l.colour}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Chart 3: Action plan health */
function ActionHealthChart({ byStatus, byPriority }: {
  byStatus: { label: string; count: number; colour: string }[]
  byPriority: { label: string; count: number; colour: string }[]
}) {
  const totalStatus   = byStatus.reduce((s, r) => s + r.count, 0)
  const totalPriority = byPriority.reduce((s, r) => s + r.count, 0)

  function MiniBar({ rows, total }: { rows: { label: string; count: number; colour: string }[]; total: number }) {
    return (
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="text-xs text-ink-dim w-28 shrink-0">{r.label}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.colour}`}
                style={{ width: total > 0 ? `${Math.round((r.count / total) * 100)}%` : '0%' }}
              />
            </div>
            <span className="text-xs font-semibold text-ink tabular-nums w-6 text-right">{r.count}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By status</p>
        <MiniBar rows={byStatus} total={totalStatus} />
      </div>
      <div>
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">By priority</p>
        <MiniBar rows={byPriority} total={totalPriority} />
      </div>
    </div>
  )
}

/** Chart 4: HR compliance — three progress gauges */
function HrComplianceChart({ checks }: { checks: { label: string; inDate: number; total: number }[] }) {
  return (
    <div className="space-y-4">
      {checks.map(c => {
        const pct = c.total > 0 ? Math.round((c.inDate / c.total) * 100) : 0
        const colour = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400'
        return (
          <div key={c.label}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-ink">{c.label}</span>
              <span className="text-xs text-ink-muted tabular-nums">{c.inDate}/{c.total} ({pct}%)</span>
            </div>
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${colour} transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-xs text-ink-muted pt-1">
        In-date = next review date has not yet passed.
      </p>
    </div>
  )
}

/** Chart 5: Mock inspection rating dots on a timeline */
const RATING_COLOUR: Record<string, { fill: string; text: string; label: string }> = {
  outstanding:          { fill: '#9333ea', text: '#ffffff', label: 'Outstanding' },
  good:                 { fill: '#16a34a', text: '#ffffff', label: 'Good' },
  requires_improvement: { fill: '#d97706', text: '#ffffff', label: 'Req. Improvement' },
  inadequate:           { fill: '#dc2626', text: '#ffffff', label: 'Inadequate' },
}
const RATING_ORDER: Record<string, number> = { inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3 }

function MockTrendChart({ sessions }: {
  sessions: { date: string; label: string; worstRating: string }[]
}) {
  if (sessions.length === 0) {
    return <p className="text-xs text-ink-muted">No completed mock inspections yet.</p>
  }

  const W = 560; const H = 90
  const PAD = { left: 24, right: 24, top: 28, bottom: 28 }
  const n = sessions.length
  const xs = sessions.map((_, i) => PAD.left + (n > 1 ? (i / (n - 1)) * (W - PAD.left - PAD.right) : (W - PAD.left - PAD.right) / 2))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Mock inspection rating trend" role="img">
      {/* Connecting line */}
      {n > 1 && (
        <polyline
          points={xs.map((x) => `${x.toFixed(1)},${(H / 2).toFixed(1)}`).join(' ')}
          fill="none" stroke="#e5e7eb" strokeWidth="1.5"
        />
      )}
      {sessions.map((s, i) => {
        const cfg = RATING_COLOUR[s.worstRating] ?? { fill: '#9ca3af', text: '#fff', label: s.worstRating }
        const x = xs[i]
        const cy = H / 2
        const dateShort = new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r="10" fill={cfg.fill} />
            {/* Rating initial */}
            <text x={x} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={cfg.text}>
              {s.worstRating === 'requires_improvement' ? 'RI' : s.worstRating.charAt(0).toUpperCase()}
            </text>
            <text x={x} y={PAD.top - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{dateShort}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Analytics — AlwaysReady' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const profile  = await getCurrentUserProfile()
  const orgId    = profile?.organisation_id ?? ''

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [
    { data: keyQuestions },
    { data: kloItems },
    { data: allHistory },
    { data: complianceRows },
    { data: actionRows },
    { data: hrProfiles },
    { data: mockRows },
  ] = await Promise.all([
    supabase.from('key_questions').select('id, name').order('display_order'),
    supabase.from('klo_items').select('id, key_question_id'),
    supabase.from('compliance_record_history')
      .select('klo_item_id, status, next_review_due, system_recorded_at')
      .order('system_recorded_at', { ascending: true }),
    supabase.from('compliance_records')
      .select('klo_item_id, status, next_review_due, date_reviewed')
      .eq('organisation_id', orgId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('action_items')
      .select('status, priority')
      .eq('organisation_id', orgId),
    supabase.from('hr_staff_profiles')
      .select('dbs_next_review_due, supervision_next_due, appraisal_next_due')
      .eq('organisation_id', orgId),
    supabase.from('mock_inspections')
      .select('id, started_at, completed_at')
      .eq('organisation_id', orgId)
      .eq('status', 'completed')
      .order('started_at', { ascending: true }),
  ])

  // ── Chart 1: 8-week readiness trend ──────────────────────────────────────
  const allKloIds: string[] = []
  const klosByKq = new Map<string, string[]>()
  for (const klo of kloItems ?? []) {
    allKloIds.push(klo.id)
    const arr = klosByKq.get(klo.key_question_id) ?? []
    arr.push(klo.id)
    klosByKq.set(klo.key_question_id, arr)
  }

  const historyByKlo = new Map<string, HistoryEntry[]>()
  for (const entry of allHistory ?? []) {
    if (!entry.status) continue
    const arr = historyByKlo.get(entry.klo_item_id) ?? []
    arr.push({ ...entry, status: entry.status })
    historyByKlo.set(entry.klo_item_id, arr)
  }

  const baseNow = new Date()
  baseNow.setHours(23, 59, 59, 999)
  const weekPoints = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(baseNow)
    d.setDate(d.getDate() - (7 - i) * 7)
    d.setHours(23, 59, 59, 999)
    return { date: d, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  })

  const trendData = weekPoints.map(wp => ({
    label: wp.label,
    pct: computeAtDate(allKloIds, historyByKlo, wp.date).pct,
  }))
  const currentPct = trendData[trendData.length - 1].pct
  const hasHistory = (allHistory ?? []).length > 0

  // ── Chart 2: RAG by key question ─────────────────────────────────────────
  const ragByKq = (keyQuestions ?? []).map(kq => {
    const kloIdsForKq = klosByKq.get(kq.id) ?? []
    const records = (complianceRows ?? []).filter(r => kloIdsForKq.includes(r.klo_item_id))
    let green = 0, amber = 0, red = 0, grey = 0
    for (const r of records) {
      const rag = calculateRAG({
        status:          r.status as 'not_started' | 'in_progress' | 'completed',
        next_review_due: r.next_review_due,
        date_reviewed:   r.date_reviewed ?? null,
      } as Parameters<typeof calculateRAG>[0])
      if (rag === 'green') green++
      else if (rag === 'amber') amber++
      else if (rag === 'red') red++
      else grey++
    }
    return { name: kq.name, green, amber, red, grey, total: records.length }
  })

  // ── Chart 3: Action plan health ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: { status: string; priority: string }[] = (actionRows as any) ?? []
  const statusCounts = { to_do: 0, in_progress: 0, completed: 0 }
  const priorityCounts: Record<string, number> = {}
  for (const a of actions) {
    if (a.status in statusCounts) statusCounts[a.status as keyof typeof statusCounts]++
    priorityCounts[a.priority] = (priorityCounts[a.priority] ?? 0) + 1
  }

  const actionByStatus = [
    { label: 'To do',       count: statusCounts.to_do,       colour: 'bg-gray-400' },
    { label: 'In progress', count: statusCounts.in_progress, colour: 'bg-amber-400' },
    { label: 'Completed',   count: statusCounts.completed,   colour: 'bg-green-500' },
  ]
  const actionByPriority = [
    { label: 'High',   count: priorityCounts['high']   ?? 0, colour: 'bg-red-400'   },
    { label: 'Medium', count: priorityCounts['medium'] ?? 0, colour: 'bg-amber-400' },
    { label: 'Low',    count: priorityCounts['low']    ?? 0, colour: 'bg-green-400' },
  ]

  // ── Chart 4: HR compliance ────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const hrRows = hrProfiles ?? []
  const total = hrRows.length

  function countInDate(field: 'dbs_next_review_due' | 'supervision_next_due' | 'appraisal_next_due') {
    return hrRows.filter(r => r[field] && new Date(r[field]!) >= today).length
  }

  const hrChecks = [
    { label: 'DBS checks',       inDate: countInDate('dbs_next_review_due'),   total },
    { label: 'Supervisions',     inDate: countInDate('supervision_next_due'),   total },
    { label: 'Appraisals',       inDate: countInDate('appraisal_next_due'),     total },
  ]

  // ── Chart 5: Mock inspection rating trend ─────────────────────────────────
  const mockSessions = await Promise.all(
    (mockRows ?? []).map(async insp => {
      const { data: findings } = await supabase
        .from('mock_inspection_findings')
        .select('rating')
        .eq('mock_inspection_id', insp.id)

      let worstRating = 'outstanding'
      for (const f of findings ?? []) {
        if ((RATING_ORDER[f.rating] ?? 99) < (RATING_ORDER[worstRating] ?? 99)) {
          worstRating = f.rating
        }
      }
      return {
        date:        insp.started_at ?? insp.completed_at ?? '',
        label:       new Date(insp.started_at ?? '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
        worstRating,
      }
    })
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-dim mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li><Link href="/dashboard" className="hover:text-brand underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">Analytics</li>
        </ol>
      </nav>

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand">Analytics</h1>
          <p className="text-sm text-ink-dim mt-0.5">A snapshot of readiness, compliance, and activity across your service.</p>
        </div>
        <div className="bg-[#014D4E] text-white rounded-xl px-5 py-2.5 text-center min-w-[90px]">
          <div className="text-3xl font-bold leading-none">{currentPct}%</div>
          <div className="text-xs opacity-70 mt-0.5">readiness now</div>
        </div>
      </div>

      {!hasHistory ? (
        <div className="bg-fill border border-line rounded-2xl p-10 text-center max-w-lg mx-auto">
          <p className="text-ink-dim text-sm mb-3">
            No audit history yet. Start logging KLOE reviews and your analytics will appear here.
          </p>
          <Link href="/dashboard/kloes" className="text-sm font-medium text-brand underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
            Go to KLOEs →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Chart 1: 8-week readiness trend — full width */}
          <div className="bg-card rounded-2xl border border-line p-5">
            <h2 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
              Overall readiness — 8-week view
            </h2>
            <ReadinessTrendChart points={trendData} />
          </div>

          {/* Charts 2 + 3: side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Chart 2: RAG by key question */}
            <div className="bg-card rounded-2xl border border-line p-5">
              <h2 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
                RAG status by key question
              </h2>
              <RagByKqChart rows={ragByKq} />
            </div>

            {/* Chart 3: Action plan health */}
            <div className="bg-card rounded-2xl border border-line p-5">
              <h2 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
                Action plan health
              </h2>
              {actions.length === 0 ? (
                <p className="text-xs text-ink-muted">No action items recorded yet.</p>
              ) : (
                <ActionHealthChart byStatus={actionByStatus} byPriority={actionByPriority} />
              )}
            </div>

          </div>

          {/* Charts 4 + 5: side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Chart 4: HR compliance */}
            <div className="bg-card rounded-2xl border border-line p-5">
              <h2 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
                HR compliance
              </h2>
              {total === 0 ? (
                <p className="text-xs text-ink-muted">No HR staff profiles set up yet.</p>
              ) : (
                <HrComplianceChart checks={hrChecks} />
              )}
            </div>

            {/* Chart 5: Mock inspection rating trend */}
            <div className="bg-card rounded-2xl border border-line p-5">
              <h2 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
                Mock inspection ratings
              </h2>
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
      )}
    </div>
  )
}
