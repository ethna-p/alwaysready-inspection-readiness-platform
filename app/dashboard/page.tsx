/**
 * Dashboard — Inspection Readiness + Analytics
 *
 * Two sections on one page:
 *   1. At a Glance  — CQC rating, overall %, per-KQ breakdown, governance alerts
 *   2. Analytics    — 8-week trend + 8 compact charts covering all key data areas
 *
 * "Up to date" definition (from PROJECT_BRIEF.md):
 *   status = 'completed' AND next_review_due has not yet passed.
 *   An overdue completed KLOE is NOT counted as compliant — overdue wins.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import type { RAGStatus } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import type { ComplianceRecord } from '@/lib/types'
import { fetchCqcLocation, cqcRatingColours, formatCqcDate } from '@/lib/cqc'
import type { CqcRating } from '@/lib/cqc'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function progressColour(percent: number): string {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 50) return 'bg-amber-400'
  return 'bg-red-500'
}

// ── Analytics chart helpers ───────────────────────────────────────────────────

type HistoryEntry = {
  klo_item_id: string
  status: string
  next_review_due: string | null
  system_recorded_at: string
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

// ── Analytics chart components ────────────────────────────────────────────────

function TrendChart({ points }: { points: { label: string; pct: number }[] }) {
  const W = 560; const H = 150
  const PAD = { top: 24, right: 16, bottom: 34, left: 36 }
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
      {[0, 50, 100].map(p => {
        const y = PAD.top + cH - (p / 100) * cH
        return (
          <g key={p}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={p === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{p}%</text>
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
          <span key={x.l} className="flex items-center gap-1.5 text-xs text-ink-dim">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${x.c}`} />
            {x.l} <span className="font-semibold text-ink tabular-nums">{x.n}</span>
          </span>
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

const RATING_COLOUR: Record<string, { fill: string; text: string; label: string }> = {
  outstanding:          { fill: '#9333ea', text: '#ffffff', label: 'Outstanding' },
  good:                 { fill: '#16a34a', text: '#ffffff', label: 'Good' },
  requires_improvement: { fill: '#d97706', text: '#ffffff', label: 'Req. Improvement' },
  inadequate:           { fill: '#dc2626', text: '#ffffff', label: 'Inadequate' },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Dashboard — AlwaysReady' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()

  // ── Role-based redirect ───────────────────────────────────────────────────
  const sessionProfile = await getCurrentUserProfile()
  if (sessionProfile?.role === 'user') redirect('/dashboard/my-kloes')

  // ── Auth / profile ────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  type OrgRow = {
    name: string
    cqc_location_id:          string | null
    cqc_location_name:        string | null
    cqc_rating:               string | null
    cqc_last_inspection_date: string | null
    cqc_rating_fetched_at:    string | null
    service_types: { name: string } | null
  }
  type ProfileRow = {
    role: string
    organisation_id: string
    organisations: OrgRow | null
  }
  const { data: profile } = await supabase
    .from('users')
    .select(`
      role,
      organisation_id,
      organisations(
        name,
        cqc_location_id,
        cqc_location_name,
        cqc_rating,
        cqc_last_inspection_date,
        cqc_rating_fetched_at,
        service_types(name)
      )
    `)
    .eq('id', user!.id)
    .single() as { data: ProfileRow | null; error: unknown }

  const orgName = profile?.organisations?.name ?? '—'
  const org     = profile?.organisations
  const orgId   = profile?.organisation_id ?? ''
  const isAdmin = profile?.role === 'admin'

  // ── CQC data — refresh if stale (>24 h) ──────────────────────────────────
  let cqcRating:         CqcRating | null = (org?.cqc_rating as CqcRating) ?? null
  let cqcInspectionDate: string | null    = org?.cqc_last_inspection_date ?? null
  let cqcLocationName:   string | null    = org?.cqc_location_name ?? null

  if (org?.cqc_location_id && profile?.organisation_id) {
    const fetchedAt  = org.cqc_rating_fetched_at ? new Date(org.cqc_rating_fetched_at) : null
    const isStale    = !fetchedAt || (Date.now() - fetchedAt.getTime()) > 24 * 60 * 60 * 1000
    if (isStale) {
      try {
        const fresh = await fetchCqcLocation(org.cqc_location_id)
        if (fresh.status === 'found') {
          cqcRating         = fresh.data.overallRating
          cqcInspectionDate = fresh.data.lastInspectionDate
          cqcLocationName   = fresh.data.locationName
          const admin = createAdminClient()
          await admin.from('organisations').update({
            cqc_location_name:        fresh.data.locationName,
            cqc_rating:               fresh.data.overallRating,
            cqc_last_inspection_date: fresh.data.lastInspectionDate,
            cqc_rating_fetched_at:    new Date().toISOString(),
          }).eq('id', profile.organisation_id)
        }
        if (fresh.status === 'not_found') {
          console.warn('[dashboard] CQC refresh: location no longer on register', org.cqc_location_id)
        }
      } catch (err) {
        console.warn('[dashboard] CQC refresh failed:', err)
      }
    }
  }

  const cqcColours       = cqcRatingColours(cqcRating)
  const cqcDateFormatted = formatCqcDate(cqcInspectionDate)

  // ── Main data fetch ───────────────────────────────────────────────────────
  const [
    { data: keyQuestions },
    { data: kloItems },
    { data: records },
    { count: openIncidentCount },
    { data: allHistory },
    { data: actionRows },
    { data: hrProfiles },
    { data: mockRows },
    { data: evidenceRows },
    { data: pvEvidenceRows },
    { data: pvStatements },
  ] = await Promise.all([
    supabase.from('key_questions').select('id, name, display_order').order('display_order'),
    supabase.from('klo_items').select('id, key_question_id'),
    supabase.from('compliance_records').select('*'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .in('status', ['open', 'under_review']),
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

  // ── AT A GLANCE computations ──────────────────────────────────────────────
  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )
  const allKlos = kloItems ?? []
  const allKqs  = keyQuestions ?? []

  const totalKlos     = allKlos.length
  const compliantKlos = allKlos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
  const overallPct    = pct(compliantKlos, totalKlos)

  const overallRag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
  for (const k of allKlos) overallRag[calculateRAG(recordByKloId.get(k.id), now)]++

  // Governance alerts (admin only)
  let overdueUnassignedCount = 0
  let neverStartedCount      = 0
  let overdueActionCount     = 0

  if (isAdmin) {
    for (const k of allKlos) {
      const rec = recordByKloId.get(k.id)
      const rag = calculateRAG(rec, now)
      if (rag === 'grey') neverStartedCount++
      if (rag === 'red' && !rec?.assigned_to) overdueUnassignedCount++
    }
    const todayStr = now.toISOString().split('T')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions: { status: string; due_date: string | null }[] = (actionRows as any) ?? []
    overdueActionCount = actions.filter(
      a => ['open', 'in_progress', 'to_do'].includes(a.status) && a.due_date && a.due_date < todayStr
    ).length
  }

  const governanceAlerts = isAdmin
    ? [
        overdueUnassignedCount > 0 && { count: overdueUnassignedCount, label: `overdue KLOE${overdueUnassignedCount !== 1 ? 's' : ''} with no assignee`, href: '/dashboard/daily-report', colour: 'red' as const },
        neverStartedCount > 0      && { count: neverStartedCount,      label: `KLOE${neverStartedCount !== 1 ? 's' : ''} never started`,                  href: '/dashboard/kloes',        colour: 'grey' as const },
        overdueActionCount > 0     && { count: overdueActionCount,     label: `overdue action item${overdueActionCount !== 1 ? 's' : ''}`,                 href: '/dashboard/kloes',        colour: 'amber' as const },
        (openIncidentCount ?? 0) > 0 && { count: openIncidentCount as number, label: `open incident${(openIncidentCount ?? 0) !== 1 ? 's' : ''} requiring review`, href: '/dashboard/incidents', colour: 'red' as const },
      ].filter(Boolean) as { count: number; label: string; href: string; colour: 'red' | 'amber' | 'grey' }[]
    : []

  // Team stats (admin only)
  type TeamMemberStats = { id: string; displayName: string; rag: Record<RAGStatus, number>; total: number }
  let teamStats: TeamMemberStats[] = []
  if (isAdmin) {
    const { data: orgUsers } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', profile!.organisation_id)
      .in('role', ['admin', 'user'])
      .order('full_name', { ascending: true })
    const assignedRecords = (records ?? []).filter(r => r.assigned_to)
    const recordsByAssignee = new Map<string, ComplianceRecord[]>()
    for (const r of assignedRecords) {
      if (!recordsByAssignee.has(r.assigned_to!)) recordsByAssignee.set(r.assigned_to!, [])
      recordsByAssignee.get(r.assigned_to!)!.push(r)
    }
    teamStats = (orgUsers ?? [])
      .filter(u => recordsByAssignee.has(u.id))
      .map(u => {
        const memberRecords = recordsByAssignee.get(u.id)!
        const rag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
        for (const r of memberRecords) rag[calculateRAG(r, now)]++
        return { id: u.id, displayName: u.full_name ?? u.email, rag, total: memberRecords.length }
      })
      .sort((a, b) => (b.rag.red + b.rag.grey) - (a.rag.red + a.rag.grey))
  }

  // Per-KQ stats
  type KqStats = { id: string; name: string; total: number; compliant: number; rag: Record<RAGStatus, number> }
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

  // ── ANALYTICS computations ────────────────────────────────────────────────

  // Chart 1: 8-week readiness trend
  const klosByKq = new Map<string, string[]>()
  const allKloIds: string[] = []
  for (const klo of allKlos) {
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
  const baseNow = new Date(); baseNow.setHours(23, 59, 59, 999)
  const trendPoints = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(baseNow)
    d.setDate(d.getDate() - (7 - i) * 7)
    d.setHours(23, 59, 59, 999)
    return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), pct: computeAtDate(allKloIds, historyByKlo, d) }
  })
  const hasHistory = (allHistory ?? []).length > 0

  // Chart 2: KLOE completion status
  const kloeStatusCounts = { completed: 0, in_progress: 0, not_started: 0 }
  for (const r of records ?? []) {
    if (r.status === 'completed') kloeStatusCounts.completed++
    else if (r.status === 'in_progress') kloeStatusCounts.in_progress++
    else kloeStatusCounts.not_started++
  }
  const kloeCompletionPct = pct(kloeStatusCounts.completed, totalKlos)

  // Chart 3: People's Voice coverage
  const pvTotal       = (pvStatements ?? []).length
  const pvEvRows      = pvEvidenceRows ?? []
  const pvStrong      = pvEvRows.filter(e => e.confidence === 'green').length
  const pvNeedsWork   = pvEvRows.filter(e => e.confidence === 'amber' || e.confidence === 'red').length
  const pvNotAssessed = pvTotal - pvEvRows.filter(e => e.confidence !== 'not_assessed').length
  const pvPct         = pct(pvStrong, pvTotal)

  // Chart 4: Action plan health
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: { status: string; priority: string; due_date: string | null }[] = (actionRows as any) ?? []
  const statusCounts   = { to_do: 0, in_progress: 0, completed: 0 }
  const priorityCounts: Record<string, number> = {}
  for (const a of actions) {
    if (a.status in statusCounts) statusCounts[a.status as keyof typeof statusCounts]++
    priorityCounts[a.priority] = (priorityCounts[a.priority] ?? 0) + 1
  }

  // Chart 5: Evidence coverage
  const kloesWithEvidence = new Set((evidenceRows ?? []).map(e => e.klo_item_id)).size
  const evidencePct = pct(kloesWithEvidence, totalKlos)

  // Chart 6: Review calendar
  const todayMs = new Date().setHours(0, 0, 0, 0)
  let reviewOverdue = 0, reviewDue30 = 0, reviewDue60 = 0, reviewDue90 = 0
  for (const r of records ?? []) {
    if (!r.next_review_due) continue
    const dueMs = new Date(r.next_review_due).getTime()
    if (dueMs < todayMs)                          reviewOverdue++
    else if (dueMs <= todayMs + 30 * 86400000)    reviewDue30++
    else if (dueMs <= todayMs + 60 * 86400000)    reviewDue60++
    else if (dueMs <= todayMs + 90 * 86400000)    reviewDue90++
  }

  // Chart 7: HR compliance
  const hrRows = hrProfiles ?? []
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

  // Chart 8: Mock inspection rating trend
  const mockSessions = await Promise.all(
    (mockRows ?? []).map(async insp => {
      const { data: findings } = await supabase
        .from('mock_inspection_findings').select('rating').eq('mock_inspection_id', insp.id)
      let worstRating = 'outstanding'
      for (const f of findings ?? []) {
        if ((RATING_ORDER[f.rating] ?? 99) < (RATING_ORDER[worstRating] ?? 99)) worstRating = f.rating
      }
      return { date: insp.started_at ?? insp.completed_at ?? '', worstRating }
    })
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand">Inspection Readiness</h1>
          <p className="text-sm text-ink-dim mt-1">{orgName}</p>
        </div>
        <Link
          href="/dashboard/kloes"
          className="inline-flex items-center gap-2 bg-[#014D4E] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#013838] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 transition-colors"
        >
          View KLOE tracker →
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          AT A GLANCE
          ════════════════════════════════════════════════════════════════════ */}

      {/* CQC Rating */}
      <section aria-label="Current CQC rating" className="mb-6">
        <div className="bg-card rounded-2xl border border-line p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cqcColours.bg }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Current CQC rating</p>
                {cqcRating ? (
                  <span className="inline-block text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cqcColours.bg, color: cqcColours.text }}>
                    {cqcRating}
                  </span>
                ) : (
                  <span className="text-sm text-ink-dim">Not yet rated</span>
                )}
              </div>
            </div>
            {cqcLocationName && (
              <div className="hidden sm:block border-l border-line pl-4 min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Registered name</p>
                <p className="text-sm text-ink font-medium truncate">{cqcLocationName}</p>
              </div>
            )}
            {cqcDateFormatted && (
              <div className="border-l border-line pl-4 min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Last inspection</p>
                <p className="text-sm text-ink">{cqcDateFormatted}</p>
              </div>
            )}
            {org?.cqc_location_id && (
              <div className="ml-auto shrink-0">
                <a href={`https://www.cqc.org.uk/location/${org.cqc_location_id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-brand underline underline-offset-2 hover:text-[#013636] focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
                  View on CQC website →
                </a>
              </div>
            )}
          </div>
          {!org?.cqc_location_id && (
            <p className="text-sm text-ink-dim">
              No CQC Location ID recorded.{' '}
              <Link href="/dashboard/account" className="text-brand underline hover:text-[#013636]">Add it in your account settings</Link>{' '}
              to see your live CQC rating here.
            </p>
          )}
          <p className="text-sm text-ink-dim mt-3">
            Data sourced from the CQC public register, updated daily. AlwaysReady is not affiliated with or endorsed by the Care Quality Commission.
          </p>
        </div>
      </section>

      {/* Overall readiness */}
      <section aria-labelledby="overall-heading" className="mb-8">
        <div className="bg-card rounded-2xl border border-line p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="text-center sm:text-left shrink-0">
              <p className="text-6xl font-bold text-brand tabular-nums" aria-label={`${overallPct} percent overall readiness`}>
                {overallPct}<span className="text-3xl">%</span>
              </p>
              <p className="text-sm text-ink-dim mt-1">Overall readiness</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs text-ink-dim mb-1">
                <span>{compliantKlos} of {totalKlos} KLOEs up to date</span>
                <span>{overallPct}%</span>
              </div>
              <div className="w-full h-3 bg-fill-dim rounded-full overflow-hidden" role="progressbar" aria-label="Overall readiness" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all ${progressColour(overallPct)}`} style={{ width: `${overallPct}%` }} />
              </div>
              <p className="text-xs text-ink-dim mt-2 leading-relaxed">
                Up to date = status Completed and next review not yet overdue. This score reflects your own self-assessed inputs and does not predict your CQC inspection rating.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(['green', 'amber', 'red', 'grey'] as const).map(rag => (
                  <span key={rag} className="inline-flex items-center gap-1">
                    <RagBadge status={rag} compact />
                    <span className="text-sm font-semibold text-ink">{overallRag[rag]}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governance alerts */}
      {governanceAlerts.length > 0 && (
        <section aria-label="Governance alerts" className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-xl shrink-0" aria-hidden="true">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900 mb-2">Governance attention needed</p>
                <ul className="space-y-2">
                  {governanceAlerts.map((alert, i) => {
                    const dot = alert.colour === 'red' ? 'bg-red-500' : alert.colour === 'amber' ? 'bg-amber-500' : 'bg-gray-400'
                    return (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                        <span className="text-sm text-amber-900">
                          <strong>{alert.count}</strong> {alert.label} —{' '}
                          <Link href={alert.href} className="text-brand underline underline-offset-2 hover:text-[#013636]">review now</Link>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Per-KQ breakdown */}
      <section aria-labelledby="breakdown-heading" className="mb-8">
        <h2 id="breakdown-heading" className="text-lg font-bold text-brand mb-4">Breakdown by key question</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kqStats.map(kq => {
            const kqPct = pct(kq.compliant, kq.total)
            return (
              <div key={kq.id} className="bg-card rounded-xl border border-line p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-brand text-sm leading-tight">{kq.name}</h3>
                  <span className="text-2xl font-bold text-brand tabular-nums shrink-0">{kqPct}<span className="text-base">%</span></span>
                </div>
                <div className="w-full h-2 bg-fill-dim rounded-full overflow-hidden mb-3" role="progressbar" aria-label={`${kq.name} readiness`} aria-valuenow={kqPct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full rounded-full transition-all ${progressColour(kqPct)}`} style={{ width: `${kqPct}%` }} />
                </div>
                <p className="text-xs text-ink-dim mb-3">{kq.compliant} of {kq.total} KLOEs up to date</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(['green', 'amber', 'red', 'grey'] as const).filter(r => kq.rag[r] > 0).map(r => (
                    <span key={r} className="inline-flex items-center gap-1 text-xs">
                      <RagBadge status={r} compact />
                      <span className="font-medium text-ink">{kq.rag[r]}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-line">
                  <Link href="/dashboard/kloes" className="text-xs font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
                    View {kq.name} KLOEs →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          ANALYTICS
          ════════════════════════════════════════════════════════════════════ */}
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
          <div className="space-y-4">

            {/* 8-week trend — full width */}
            <div className="bg-card rounded-2xl border border-line p-5">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">Overall readiness — 8-week view</h3>
              <TrendChart points={trendPoints} />
            </div>

            {/* KLOE completion + People's Voice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-line p-5">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">KLOE completion</h3>
                <CompletionBar
                  label={`of ${totalKlos} KLOEs completed`}
                  pct={kloeCompletionPct}
                  colourA="bg-green-500" countA={kloeStatusCounts.completed}   labelA="Completed"
                  colourB="bg-amber-400" countB={kloeStatusCounts.in_progress}  labelB="In progress"
                  colourC="bg-gray-200"  countC={kloeStatusCounts.not_started}  labelC="Not started"
                />
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
            </div>

            {/* Action plan health + Evidence coverage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-line p-5">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Action plan health</h3>
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
              <div className="bg-card rounded-2xl border border-line p-5">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Evidence coverage</h3>
                <CompletionBar
                  label="of KLOEs have evidence attached"
                  pct={evidencePct}
                  colourA="bg-[#014D4E]" countA={kloesWithEvidence}            labelA="With evidence"
                  colourB="bg-gray-200"  countB={totalKlos - kloesWithEvidence} labelB="No evidence"
                  colourC="bg-transparent" countC={0} labelC=""
                />
                <p className="text-xs text-ink-muted mt-3">CQC inspectors expect evidence to support every KLOE — not just a completed status.</p>
              </div>
            </div>

            {/* Review calendar + HR compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-line p-5">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">Review calendar</h3>
                <ReviewCalendarChart overdue={reviewOverdue} due30={reviewDue30} due60={reviewDue60} due90={reviewDue90} />
              </div>
              <div className="bg-card rounded-2xl border border-line p-5">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">HR compliance</h3>
                {hrTotal === 0 ? (
                  <p className="text-xs text-ink-muted">No HR staff profiles set up yet.</p>
                ) : (
                  <HrComplianceChart checks={hrChecks} />
                )}
              </div>
            </div>

            {/* Mock inspection ratings — full width */}
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

          </div>
        )}
      </div>

      {/* Team workload (admin only) */}
      {isAdmin && teamStats.length > 0 && (
        <section aria-labelledby="team-heading" className="mt-8">
          <h2 id="team-heading" className="text-lg font-bold text-brand mb-4">Team workload</h2>
          <div className="bg-card rounded-xl border border-line overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
                  <th scope="col" className="text-left px-4 py-3 font-medium">Team member</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium">Assigned KLOEs</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium hidden sm:table-cell">RAG breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamStats.map(member => (
                  <tr key={member.id} className="hover:bg-canvas transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">
                      {member.displayName}
                      <div className="flex flex-wrap gap-2 mt-1 sm:hidden">
                        {(['red', 'amber', 'green', 'grey'] as const).filter(r => member.rag[r] > 0).map(r => (
                          <span key={r} className="inline-flex items-center gap-1 text-xs">
                            <RagBadge status={r} compact />
                            <span className="font-medium">{member.rag[r]}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <span className="font-semibold">{member.total}</span>
                      {member.rag.red > 0 && <span className="ml-2 text-xs text-red-600 font-medium">{member.rag.red} overdue</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-3">
                        {(['red', 'amber', 'green', 'grey'] as const).filter(r => member.rag[r] > 0).map(r => (
                          <span key={r} className="inline-flex items-center gap-1 text-xs">
                            <RagBadge status={r} compact />
                            <span className="font-medium text-ink">{member.rag[r]}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-ink-dim mt-2">Sorted by most at-risk first. Assign KLOEs from each KLOE&apos;s detail page.</p>
        </section>
      )}

    </div>
  )
}
