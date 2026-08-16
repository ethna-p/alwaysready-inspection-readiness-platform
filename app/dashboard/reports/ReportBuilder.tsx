'use client'

/**
 * ReportBuilder — filter controls + rendered report + print button.
 *
 * Filters (all client-side, no extra DB round-trips):
 *   Key questions   — which of the five CQC key question areas to include
 *   Sections        — KLOE Summary / Action Plan Items / HR Compliance
 *   Action status   — All / Open / In progress / Completed
 *   Staff member    — All staff / specific individual (HR section only)
 *
 * Views:
 *   Saved filter configurations per organisation. System views ship with the
 *   platform and cannot be deleted. Admins can save/delete custom views.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KloeRow = {
  id: string
  klo_item_id: string
  title: string
  key_question_name: string
  status: string
  rag: 'green' | 'amber' | 'red' | 'grey'
  next_review_due: string | null
  priority: number
  assigned_to_name: string | null
}

export type ActionRow = {
  id: string
  klo_item_id: string
  klo_title: string
  key_question_name: string
  title: string
  status: 'open' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  assigned_to_name: string | null
  completion_notes: string | null
  completed_at: string | null
}

export type HrRow = {
  user_id: string
  full_name: string | null
  job_title: string | null
  dbs_next_review_due: string | null
  supervision_next_due: string | null
  appraisal_next_due: string | null
  mandatory_training_complete: boolean
}

export type MockInspectionYear = {
  id: string
  type: 'full' | 'partial'
  started_at: string
  completed_at: string | null
  conducted_by_name: string | null
  key_question_name: string | null   // for partial inspections
  ratings: { name: string; worstRating: string }[]
}

interface Props {
  orgName: string
  orgLogoUrl: string | null
  keyQuestions: string[]
  kloes: KloeRow[]
  actions: ActionRow[]
  hrStaff: HrRow[]
  mockInspections: MockInspectionYear[]
  evidenceCounts: Record<string, number>
  isAdmin: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dateStatus(iso: string | null): 'overdue' | 'due_soon' | 'ok' | 'not_set' {
  if (!iso) return 'not_set'
  const now = new Date()
  const due = new Date(iso)
  if (due < now) return 'overdue'
  const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return days <= 30 ? 'due_soon' : 'ok'
}

const RAG_COLOURS: Record<string, string> = {
  green: '#15803d',
  amber: '#b45309',
  red:   '#b91c1c',
  grey:  '#6b7280',
}

const RAG_LABELS: Record<string, string> = {
  green: 'Green',
  amber: 'Amber',
  red:   'Red',
  grey:  'Not reviewed',
}

const HR_STATUS_LABELS: Record<string, string> = {
  overdue:  'Overdue',
  due_soon: 'Due soon',
  ok:       'Current',
  not_set:  'Not set',
}

const HR_STATUS_COLOURS: Record<string, string> = {
  overdue:  '#b91c1c',
  due_soon: '#b45309',
  ok:       '#15803d',
  not_set:  '#6b7280',
}

const MOCK_RATING_LABELS: Record<string, string> = {
  outstanding:          'Outstanding',
  good:                 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate:           'Inadequate',
}

const MOCK_RATING_COLOURS: Record<string, string> = {
  outstanding:          '#7e22ce',
  good:                 '#15803d',
  requires_improvement: '#b45309',
  inadequate:           '#b91c1c',
}

const RATING_ORDER: Record<string, number> = {
  inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3,
}

function trendArrow(prev: string | undefined, curr: string): { symbol: string; colour: string } | null {
  if (!prev) return null
  const diff = (RATING_ORDER[curr] ?? 0) - (RATING_ORDER[prev] ?? 0)
  if (diff > 0)  return { symbol: '↑', colour: '#15803d' }
  if (diff < 0)  return { symbol: '↓', colour: '#b91c1c' }
  return { symbol: '→', colour: '#6b7280' }
}

// ─── Filter toggle ────────────────────────────────────────────────────────────

function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-line text-brand focus:ring-2 focus:ring-[#00b8a6]"
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  )
}

// ─── Section heading (print-safe) ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#014D4E',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '4px',
      marginBottom: '12px',
      marginTop: '24px',
    }}>
      {children}
    </h2>
  )
}

// ─── View definitions ─────────────────────────────────────────────────────────

type ViewKey = 'governance' | 'attention-needed' | 'evidence-gaps' | 'hr-compliance' | 'kloe-with-actions' | 'pre-inspection'

const SYSTEM_VIEWS: { key: ViewKey; label: string; description: string; adminOnly?: boolean }[] = [
  {
    key:         'governance',
    label:       'Governance Summary',
    description: 'Full picture — all KLOEs, open and completed actions, HR compliance, and annual review. For board packs and management meetings.',
  },
  {
    key:         'attention-needed',
    label:       'Attention Needed',
    description: 'Unassessed, Red, and Amber KLOEs only, plus open actions. Green KLOEs are excluded. Ordered by urgency: Unassessed → Red → Amber.',
  },
  {
    key:         'evidence-gaps',
    label:       'Evidence Gaps',
    description: 'KLOEs with no evidence uploaded, ordered Unassessed → Red → Amber. Use this to find where compliance is claimed but proof is missing.',
  },
  {
    key:         'kloe-with-actions',
    label:       'KLOEs with Actions',
    description: 'Each KLOE followed by its linked action items. Useful for team briefings and progress reviews.',
  },
  {
    key:         'pre-inspection',
    label:       'Inspection Readiness',
    description: 'Ordered by urgency with evidence count per KLOE. Shows open actions and HR compliance. Formatted for CQC inspection day.',
  },
  {
    key:         'hr-compliance',
    label:       'HR Compliance',
    description: 'Staff DBS checks, mandatory training, supervision, and appraisal status. Admin only.',
    adminOnly:   true,
  },
]

// Sort order: Unassessed → Red → Amber → Green
const GAP_RAG_ORDER: Record<string, number> = { grey: 0, red: 1, amber: 2, green: 99 }

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder({ orgName, orgLogoUrl, keyQuestions, kloes, actions, hrStaff, mockInspections, evidenceCounts, isAdmin }: Props) {
  // ── View state ──────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewKey | null>(null)

  // ── Section visibility — set automatically by view, overridable manually ───
  const [selectedKQs, setSelectedKQs]           = useState<Set<string>>(new Set(keyQuestions))
  const [showKloes, setShowKloes]               = useState(true)
  const [showActions, setShowActions]           = useState(true)
  const [showHr, setShowHr]                     = useState(isAdmin)
  const [showAnnualReview, setShowAnnualReview] = useState(true)
  const [actionStatus, setActionStatus]         = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')
  const [selectedStaff, setSelectedStaff]       = useState('all')
  const [reviewYear, setReviewYear]             = useState(new Date().getFullYear())

  // ── AI narrative ────────────────────────────────────────────────────────
  const [narrative, setNarrative]           = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError]     = useState<string | null>(null)

  // ── Print ─────────────────────────────────────────────────────────────────

  // ── Progress vs last run ──────────────────────────────────────────────────
  interface SnapshotData {
    green: number; amber: number; red: number; grey: number; total: number
    open_actions: number; overdue_actions: number; captured_at: string
  }
  const [previousSnapshot, setPreviousSnapshot] = useState<SnapshotData | null>(null)

  function selectView(key: ViewKey) {
    setActiveView(key)
    setSelectedKQs(new Set(keyQuestions))  // all views use all KQs
    setNarrative(null)
    setPreviousSnapshot(null)  // clear while loading

    // Fetch previous snapshot (fire-and-forget, non-blocking)
    fetch(`/api/report-snapshot?view_key=${encodeURIComponent(key)}`)
      .then(r => r.ok ? r.json() as Promise<{ snapshot: SnapshotData | null }> : Promise.resolve({ snapshot: null }))
      .then(({ snapshot }) => setPreviousSnapshot(snapshot))
      .catch(() => { /* non-critical */ })

    switch (key) {
      case 'governance':
        setShowKloes(true); setShowActions(true); setShowHr(isAdmin); setShowAnnualReview(true)
        setActionStatus('all')
        break
      case 'attention-needed':
        setShowKloes(true); setShowActions(true); setShowHr(false); setShowAnnualReview(false)
        setActionStatus('open')
        break
      case 'evidence-gaps':
        setShowKloes(true); setShowActions(false); setShowHr(false); setShowAnnualReview(false)
        setActionStatus('all')
        break
      case 'kloe-with-actions':
        setShowKloes(true); setShowActions(true); setShowHr(false); setShowAnnualReview(false)
        setActionStatus('all')
        break
      case 'pre-inspection':
        setShowKloes(true); setShowActions(true); setShowHr(isAdmin); setShowAnnualReview(true)
        setActionStatus('open')
        break
      case 'hr-compliance':
        setShowKloes(false); setShowActions(false); setShowHr(isAdmin); setShowAnnualReview(false)
        setActionStatus('all')
        break
    }
  }

  function clearView() { setActiveView(null) }

  function toggleKQ(name: string, checked: boolean) {
    setSelectedKQs(prev => {
      const next = new Set(prev)
      checked ? next.add(name) : next.delete(name)
      return next
    })
    setActiveView(null)
  }

  function toggleAllKQs(checked: boolean) {
    setSelectedKQs(checked ? new Set(keyQuestions) : new Set())
    setActiveView(null)
  }

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredKloes = useMemo(() => {
    let list = kloes.filter(k => selectedKQs.has(k.key_question_name))

    if (activeView === 'governance') {
      // Unassessed → Red → Amber → Green
      list = list.sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'attention-needed') {
      // Exclude green; sort unassessed → red → amber
      list = list
        .filter(k => k.rag !== 'green')
        .sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'evidence-gaps') {
      // KLOEs with no evidence, same sort order
      list = list
        .filter(k => (evidenceCounts[k.klo_item_id] ?? 0) === 0)
        .sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'pre-inspection') {
      // All KLOEs sorted by urgency: Unassessed → Red → Amber → Green
      list = list.sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    }

    return list
  }, [kloes, selectedKQs, activeView, evidenceCounts])

  const filteredActions = useMemo(() =>
    actions.filter(a => {
      if (!selectedKQs.has(a.key_question_name)) return false
      if (actionStatus !== 'all' && a.status !== actionStatus) return false
      return true
    }),
    [actions, selectedKQs, actionStatus]
  )

  const filteredHr = useMemo(() =>
    selectedStaff === 'all'
      ? hrStaff
      : hrStaff.filter(h => h.user_id === selectedStaff),
    [hrStaff, selectedStaff]
  )

  const filteredMocks = useMemo(() =>
    mockInspections.filter(m => new Date(m.started_at).getFullYear() === reviewYear),
    [mockInspections, reviewYear]
  )

  // Available years from inspection history
  const availableYears = useMemo(() => {
    const years = [...new Set(mockInspections.map(m => new Date(m.started_at).getFullYear()))]
    return years.sort((a, b) => b - a)
  }, [mockInspections])

  const allKQsSelected = selectedKQs.size === keyQuestions.length

  // ── RAG summary stats ───────────────────────────────────────────────────
  const ragCounts = useMemo(() => ({
    green:  filteredKloes.filter(k => k.rag === 'green').length,
    amber:  filteredKloes.filter(k => k.rag === 'amber').length,
    red:    filteredKloes.filter(k => k.rag === 'red').length,
    grey:   filteredKloes.filter(k => k.rag === 'grey').length,
    total:  filteredKloes.length,
  }), [filteredKloes])

  const actionCounts = useMemo(() => {
    const now = new Date()
    const open     = filteredActions.filter(a => a.status !== 'completed')
    const overdue  = open.filter(a => a.due_date && new Date(a.due_date) < now)
    return { open: open.length, overdue: overdue.length, total: filteredActions.length }
  }, [filteredActions])

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Auto-save a snapshot whenever a system view is active and counts are ready
  useEffect(() => {
    if (!activeView || ragCounts.total === 0) return
    fetch('/api/report-snapshot', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view_key:        activeView,
        green:           ragCounts.green,
        amber:           ragCounts.amber,
        red:             ragCounts.red,
        grey:            ragCounts.grey,
        total:           ragCounts.total,
        open_actions:    actionCounts.open,
        overdue_actions: actionCounts.overdue,
      }),
    }).catch(() => { /* non-critical */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView])   // only on view change — not on every count recalc

  const generateNarrative = useCallback(async () => {
    setNarrativeLoading(true)
    setNarrativeError(null)
    try {
      const activeViewEntry = activeView ? SYSTEM_VIEWS.find(v => v.key === activeView) : null
      const res  = await fetch('/api/report-narrative', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          generatedAt,
          viewLabel: activeViewEntry?.label ?? null,
          kloes: {
            total:      filteredKloes.length,
            green:      filteredKloes.filter(k => k.rag === 'green').length,
            amber:      filteredKloes.filter(k => k.rag === 'amber').length,
            red:        filteredKloes.filter(k => k.rag === 'red').length,
            unassessed: filteredKloes.filter(k => k.rag === 'grey').length,
            items:      filteredKloes.map(k => ({ title: k.title, keyQuestion: k.key_question_name, rag: k.rag, status: k.status })),
          },
          actions: {
            total:   filteredActions.length,
            open:    filteredActions.filter(a => a.status !== 'completed').length,
            overdue: filteredActions.filter(a => a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()).length,
            items:   filteredActions.map(a => ({ title: a.title, status: a.status, dueDate: a.due_date, priority: a.priority })),
          },
        }),
      })
      const json = await res.json() as { narrative?: string; error?: string }
      if (!res.ok || json.error) { setNarrativeError(json.error ?? 'Failed to generate summary.'); return }
      setNarrative(json.narrative ?? null)
    } catch {
      setNarrativeError('Network error — please try again.')
    } finally {
      setNarrativeLoading(false)
    }
  }, [activeView, orgName, generatedAt, filteredKloes, filteredActions])

  const handlePrint = useCallback(() => {
    // Wait for all images in the report to load before triggering print,
    // so the org logo reliably appears in the printed output.
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'))
    const unloaded = images.filter(img => !img.complete)
    if (unloaded.length === 0) {
      window.print()
      return
    }
    Promise.all(
      unloaded.map(
        img =>
          new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
      ),
    ).then(() => window.print())
  }, [])

  const inputClass = `
    border border-line rounded-lg px-3 py-2 text-sm text-ink bg-card w-full
    focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
  `

  return (
    <div>
      {/* ── Filter panel (hidden when printing) ──────────────────────────── */}
      <div className="print:hidden space-y-6 mb-8">

        {/* ── Report views ────────────────────────────────────────────────── */}
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-ink">Report type</p>
            {activeView && (
              <button
                type="button"
                onClick={clearView}
                className="text-xs font-medium text-ink-muted hover:text-ink focus:outline-none"
              >
                Clear — customise manually
              </button>
            )}
          </div>
          <p className="text-sm text-ink-muted mb-3">
            Choose a pre-built report for a common use case — the sections and filters below will configure automatically.
            {!activeView && <> Or skip this and set the options manually below.</>}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SYSTEM_VIEWS.filter(v => !v.adminOnly || isAdmin).map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => selectView(v.key)}
                className={`
                  text-left px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                  ${activeView === v.key
                    ? 'bg-[#014D4E] text-white border-[#014D4E]'
                    : 'bg-fill text-ink border-line hover:border-brand'}
                `}
              >
                <p className="text-sm font-semibold">{v.label}</p>
                <p className={`text-xs mt-0.5 ${activeView === v.key ? 'text-white/75' : 'text-ink-muted'}`}>
                  {v.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Sections + Key questions — side by side */}
        <div className={!activeView ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
          {/* Sections — shown when no view selected */}
          {!activeView && (
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-sm font-semibold text-ink mb-1">Sections to include</p>
              <p className="text-sm text-ink-muted mb-3">Tick the sections you want to appear in your report.</p>
              <div className="flex flex-wrap gap-4">
                <Toggle label="KLOE Summary"       checked={showKloes}         onChange={v => setShowKloes(v)} />
                <Toggle label="Action Plan Items"  checked={showActions}       onChange={v => setShowActions(v)} />
                {isAdmin && <Toggle label="HR Compliance" checked={showHr}    onChange={v => setShowHr(v)} />}
                <Toggle label="Annual Review"      checked={showAnnualReview}  onChange={v => setShowAnnualReview(v)} />
              </div>
            </div>
          )}

          {/* Key questions */}
          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-ink">Key question areas</p>
              <button
                type="button"
                onClick={() => toggleAllKQs(!allKQsSelected)}
                className="text-xs font-medium text-brand hover:underline focus:outline-none"
              >
                {allKQsSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-3">Filter the report to one or more CQC key questions, or leave all selected for a full picture.</p>
            <div className="flex flex-wrap gap-4">
              {keyQuestions.map(kq => (
                <Toggle
                  key={kq}
                  label={kq}
                  checked={selectedKQs.has(kq)}
                  onChange={v => toggleKQ(kq, v)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action plan filters + HR filters — side by side when both visible */}
        {(showActions || (showHr && hrStaff.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showActions && (
              <div className="bg-card border border-line rounded-xl p-5">
                <p className="text-sm font-semibold text-ink mb-3">Action plan filters</p>
                <div className="max-w-xs">
                  <label className="block text-xs font-medium text-ink-dim mb-1">Action status</label>
                  <select value={actionStatus} onChange={e => { setActionStatus(e.target.value as typeof actionStatus); clearView() }} className={inputClass}>
                    <option value="all">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            )}
            {showHr && hrStaff.length > 0 && (
              <div className="bg-card border border-line rounded-xl p-5">
                <p className="text-sm font-semibold text-ink mb-3">HR filters</p>
                <div className="max-w-xs">
                  <label className="block text-xs font-medium text-ink-dim mb-1">Staff member</label>
                  <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className={inputClass}>
                    <option value="all">All staff</option>
                    {hrStaff.map(h => (
                      <option key={h.user_id} value={h.user_id}>
                        {h.full_name ?? h.user_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Annual review year selector */}
        {showAnnualReview && mockInspections.length > 0 && (
          <div className="bg-card border border-line rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-3">Annual review filters</p>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-ink-dim mb-1">Year</label>
              <select
                value={reviewYear}
                onChange={e => setReviewYear(Number(e.target.value))}
                className={inputClass}
              >
                {availableYears.length > 0
                  ? availableYears.map(y => <option key={y} value={y}>{y}</option>)
                  : <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                }
              </select>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={generateNarrative}
              disabled={narrativeLoading}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-fill border border-line text-ink text-sm font-semibold
                hover:border-brand hover:text-brand disabled:opacity-50
                focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                transition-colors
              "
            >
              <span aria-hidden="true">✨</span>
              {narrativeLoading ? 'Generating…' : narrative ? 'Regenerate summary' : 'Generate AI summary'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-[#014D4E] text-white text-sm font-semibold
              hover:bg-[#013636] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              transition-colors
            "
          >
            <span aria-hidden="true">🖨</span> Print / Save as PDF
          </button>
        </div>
        {narrativeError && <p className="text-sm text-red-600 mt-2">{narrativeError}</p>}
      </div>

      {/* ── Report output ─────────────────────────────────────────────────── */}
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#111' }}>

        {/* Report header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #014D4E', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {orgLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={orgLogoUrl}
                  alt={`${orgName} logo`}
                  style={{ height: '52px', maxWidth: '180px', width: 'auto', objectFit: 'contain' }}
                />
              )}
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#014D4E', margin: 0 }}>
                  {activeView === 'pre-inspection' ? 'Inspection Readiness Report' : 'Custom Report'}
                </p>
                <p style={{ fontSize: '14px', color: '#1a1a1a', margin: '2px 0 0' }}>{orgName}</p>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#1a1a1a', margin: 0 }}>Generated {generatedAt}</p>
          </div>
          {selectedKQs.size < keyQuestions.length && (
            <p style={{ fontSize: '11px', color: '#1a1a1a', marginTop: '6px' }}>
              Filtered to: {[...selectedKQs].join(' · ')}
            </p>
          )}
        </div>

        {/* ── RAG scorecard ────────────────────────────────────────────────── */}
        {showKloes && ragCounts.total > 0 && (() => {
          // Delta helpers
          const snap = previousSnapshot
          const snapDate = snap
            ? new Date(snap.captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : null

          // delta(current, previous, lowerIsBetter)
          // Returns { diff, label, colour } or null if no snapshot
          function delta(current: number, prev: number | undefined, lowerIsBetter: boolean): { diff: number; colour: string } | null {
            if (prev === undefined || prev === null) return null
            const diff = current - prev
            if (diff === 0) return null
            // improving = green, worsening = red
            const improving = lowerIsBetter ? diff < 0 : diff > 0
            return { diff, colour: improving ? '#15803d' : '#b91c1c' }
          }

          function DeltaBadge({ d }: { d: { diff: number; colour: string } | null }) {
            if (!d || !snapDate) return null
            const arrow = d.diff > 0 ? '↑' : '↓'
            return (
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: d.colour, fontWeight: 600 }}>
                {arrow}{Math.abs(d.diff)} since {snapDate}
              </p>
            )
          }

          const kloeStats = [
            { label: 'Green',      value: ragCounts.green, prev: snap?.green, bg: '#f0fdf4', border: '#86efac', text: '#15803d', lowerIsBetter: false },
            { label: 'Amber',      value: ragCounts.amber, prev: snap?.amber, bg: '#fffbeb', border: '#fcd34d', text: '#b45309', lowerIsBetter: true  },
            { label: 'Red',        value: ragCounts.red,   prev: snap?.red,   bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', lowerIsBetter: true  },
            { label: 'Unassessed', value: ragCounts.grey,  prev: snap?.grey,  bg: '#f9fafb', border: '#d1d5db', text: '#6b7280', lowerIsBetter: true  },
          ]

          return (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '20px 0' }}>
              {kloeStats.map(s => {
                const d = delta(s.value, s.prev, s.lowerIsBetter)
                return (
                  <div key={s.label} style={{
                    background: s.bg, border: `1px solid ${s.border}`,
                    borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: s.text, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: s.text, fontWeight: 500 }}>{s.label}</p>
                    <DeltaBadge d={d} />
                  </div>
                )
              })}
              {showActions && (
                <>
                  <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
                  <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#1d4ed8', lineHeight: 1 }}>{actionCounts.open}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1d4ed8', fontWeight: 500 }}>Open actions</p>
                    <DeltaBadge d={delta(actionCounts.open, snap?.open_actions, true)} />
                  </div>
                  {actionCounts.overdue > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#b91c1c', lineHeight: 1 }}>{actionCounts.overdue}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>Overdue</p>
                      <DeltaBadge d={delta(actionCounts.overdue, snap?.overdue_actions, true)} />
                    </div>
                  )}
                </>
              )}
              {snap && snapDate && (
                <p style={{ alignSelf: 'flex-end', fontSize: '11px', color: '#1a1a1a', margin: '0 0 10px 4px' }}>
                  vs {snapDate}
                </p>
              )}
            </div>
          )
        })()}

        {/* ── AI narrative ─────────────────────────────────────────────────── */}
        {narrative && (
          <div style={{
            background: '#f0fdf9', border: '1px solid #99f6e4',
            borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488' }}>
              Summary
            </p>
            <p style={{ margin: 0, fontSize: '15px', color: '#1a1a1a', lineHeight: 1.6 }}>{narrative}</p>
          </div>
        )}

        {/* ── KLOE with Actions combined view ─────────────────────────────── */}
        {activeView === 'kloe-with-actions' && (
          <div>
            <SectionHeading>KLOEs with Actions ({filteredKloes.length} KLOEs)</SectionHeading>
            {filteredKloes.length === 0 ? (
              <p style={{ color: '#1a1a1a', fontSize: '14px' }}>No KLOEs match the selected filters.</p>
            ) : (
              filteredKloes.map(k => {
                const linkedActions = filteredActions.filter(a => a.klo_item_id === k.klo_item_id)
                return (
                  <div key={k.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                    {/* KLOE header row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                      borderRadius: '6px', padding: '10px 14px', marginBottom: '6px',
                    }}>
                      <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontSize: '18px', lineHeight: 1 }}>●</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>{k.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#1a1a1a' }}>
                          {k.key_question_name} · {k.status.replace('_', ' ')} · Next review: {formatDate(k.next_review_due)}
                        </p>
                      </div>
                    </div>
                    {/* Linked actions */}
                    {linkedActions.length === 0 ? (
                      <p style={{ margin: '0 0 0 14px', fontSize: '13px', color: '#1a1a1a' }}>No action items linked to this KLOE.</p>
                    ) : (
                      <table style={{ width: 'calc(100% - 14px)', borderCollapse: 'collapse', fontSize: '14px', marginLeft: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {['Action', 'Priority', 'Status', 'Due Date', 'Assigned To'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {linkedActions.map((a, i) => (
                            <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{a.assigned_to_name ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Section 1: KLOE Summary ──────────────────────────────────────── */}
        {showKloes && activeView !== 'kloe-with-actions' && (
          <div>
            <SectionHeading>
              {activeView === 'pre-inspection' ? 'Inspection Readiness' : 'KLOE Summary'} ({filteredKloes.length} KLOEs)
            </SectionHeading>
            {filteredKloes.length === 0 ? (
              <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No KLOEs match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {[
                      'Key Question', 'KLOE', 'Status', 'RAG', 'Next Review', 'Priority', 'Assigned To',
                      ...(activeView === 'pre-inspection' ? ['Evidence'] : []),
                    ].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredKloes.map((k, i) => (
                    <tr key={k.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a', fontSize: '13px' }}>{k.key_question_name}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{k.title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{k.status.replace('_', ' ')}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontWeight: 600 }}>
                          ● {RAG_LABELS[k.rag] ?? k.rag}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(k.next_review_due)}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{k.priority}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{k.assigned_to_name ?? '—'}</td>
                      {activeView === 'pre-inspection' && (
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: (evidenceCounts[k.klo_item_id] ?? 0) === 0 ? '#ef4444' : '#374151', fontWeight: (evidenceCounts[k.klo_item_id] ?? 0) === 0 ? 600 : 400 }}>
                          {evidenceCounts[k.klo_item_id] ?? 0}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 2: Action Plan Items ─────────────────────────────────── */}
        {showActions && activeView !== 'kloe-with-actions' && (
          <div>
            <SectionHeading>Action Plan Items ({filteredActions.length})</SectionHeading>
            {filteredActions.length === 0 ? (
              <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No action items match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['KLOE', 'Action', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completion Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((a, i) => (
                    <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a', fontSize: '13px' }}>{a.klo_title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{a.assigned_to_name ?? '—'}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a', fontSize: '13px' }}>{a.completion_notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 3: HR Compliance ─────────────────────────────────────── */}
        {showHr && (
          <div>
            <SectionHeading>HR Compliance ({filteredHr.length} staff)</SectionHeading>
            {filteredHr.length === 0 ? (
              <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No staff records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Name', 'Job Title', 'DBS', 'Supervision', 'Appraisal', 'Mandatory Training'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHr.map((h, i) => {
                    const dbsStatus  = dateStatus(h.dbs_next_review_due)
                    const supStatus  = dateStatus(h.supervision_next_due)
                    const appStatus  = dateStatus(h.appraisal_next_due)
                    return (
                      <tr key={h.user_id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{h.full_name ?? '—'}</td>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{h.job_title ?? '—'}</td>
                        {[dbsStatus, supStatus, appStatus].map((s, idx) => (
                          <td key={idx} style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ color: HR_STATUS_COLOURS[s], fontWeight: 600 }}>
                              {HR_STATUS_LABELS[s]}
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ color: h.mandatory_training_complete ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                            {h.mandatory_training_complete ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 4: Annual Review ─────────────────────────────────────── */}
        {showAnnualReview && (
          <div>
            <SectionHeading>Annual Review — Mock Inspections {reviewYear} ({filteredMocks.length})</SectionHeading>
            {filteredMocks.length === 0 ? (
              <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No completed mock inspections found for {reviewYear}.</p>
            ) : (() => {
              // Build a map of previous ratings per key question per inspection
              // so we can show trend arrows
              const prevRatings: Record<string, string> = {}

              return filteredMocks.map((insp, inspIdx) => {
                const label = insp.type === 'full'
                  ? 'Full Inspection'
                  : `Partial — ${insp.key_question_name ?? 'Unknown'}`

                const section = (
                  <div key={insp.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                    {/* Inspection header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{label}</span>
                        {insp.conducted_by_name && (
                          <span style={{ color: '#1a1a1a', fontSize: '13px', marginLeft: '12px' }}>
                            Conducted by {insp.conducted_by_name}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#1a1a1a' }}>
                        {formatDate(insp.started_at)}
                        {insp.completed_at && insp.completed_at !== insp.started_at
                          ? ` – ${formatDate(insp.completed_at)}`
                          : ''}
                      </span>
                    </div>

                    {/* Ratings table */}
                    {insp.ratings.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {['Key Question', 'Self-Assessed Rating', 'Trend'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {insp.ratings.map((r, i) => {
                            const prevKey  = `${r.name}`
                            const trend    = trendArrow(prevRatings[prevKey], r.worstRating)
                            // Update prevRatings for next inspection
                            prevRatings[prevKey] = r.worstRating
                            return (
                              <tr key={r.name} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{r.name}</td>
                                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                                  <span style={{ color: MOCK_RATING_COLOURS[r.worstRating] ?? '#374151', fontWeight: 600 }}>
                                    {MOCK_RATING_LABELS[r.worstRating] ?? r.worstRating}
                                  </span>
                                </td>
                                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                                  {trend ? (
                                    <span style={{ color: trend.colour, fontWeight: 700, fontSize: '16px' }}>
                                      {trend.symbol}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#1a1a1a', fontSize: '13px' }}>
                                      {inspIdx === 0 ? 'First inspection' : '—'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: '#1a1a1a', fontSize: '12px', paddingLeft: '8px' }}>No ratings recorded.</p>
                    )}
                  </div>
                )

                return section
              })
            })()}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
          <span>AlwaysReady — {orgName}</span>
          <span>Generated {generatedAt} · For internal governance use only</span>
        </div>
      </div>
    </div>
  )
}
