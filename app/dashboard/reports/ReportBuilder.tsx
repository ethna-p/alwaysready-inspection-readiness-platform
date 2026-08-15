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

import { useState, useMemo } from 'react'

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

type ViewKey = 'governance' | 'attention-needed' | 'evidence-gaps' | 'hr-compliance'

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
    key:         'hr-compliance',
    label:       'HR Compliance',
    description: 'Staff DBS checks, mandatory training, supervision, and appraisal status. Admin only.',
    adminOnly:   true,
  },
]

// Sort order: Unassessed → Red → Amber → Green
const GAP_RAG_ORDER: Record<string, number> = { grey: 0, red: 1, amber: 2, green: 99 }

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder({ orgName, keyQuestions, kloes, actions, hrStaff, mockInspections, evidenceCounts, isAdmin }: Props) {
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

  function selectView(key: ViewKey) {
    setActiveView(key)
    setSelectedKQs(new Set(keyQuestions))  // all views use all KQs
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

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

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
          <div className="flex items-center justify-between mb-3">
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

        {/* Sections — shown when no view selected, or to override */}
        {!activeView && (
          <div className="bg-card border border-line rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-3">Sections to include</p>
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink">Key question areas</p>
            <button
              type="button"
              onClick={() => toggleAllKQs(!allKQsSelected)}
              className="text-xs font-medium text-brand hover:underline focus:outline-none"
            >
              {allKQsSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
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

        {/* Action plan filters */}
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

        {/* HR filters */}
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

        {/* Print button */}
        <button
          type="button"
          onClick={() => window.print()}
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

      {/* ── Report output ─────────────────────────────────────────────────── */}
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#111' }}>

        {/* Report header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #014D4E', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#014D4E', margin: 0 }}>
                Custom Report
              </p>
              <p style={{ fontSize: '14px', color: '#374151', margin: '2px 0 0' }}>{orgName}</p>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Generated {generatedAt}</p>
          </div>
          {selectedKQs.size < keyQuestions.length && (
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
              Filtered to: {[...selectedKQs].join(' · ')}
            </p>
          )}
        </div>

        {/* ── Section 1: KLOE Summary ──────────────────────────────────────── */}
        {showKloes && (
          <div>
            <SectionHeading>KLOE Summary ({filteredKloes.length} KLOEs)</SectionHeading>
            {filteredKloes.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No KLOEs match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Key Question', 'KLOE', 'Status', 'RAG', 'Next Review', 'Priority', 'Assigned To'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredKloes.map((k, i) => (
                    <tr key={k.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>{k.key_question_name}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{k.title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{k.status.replace('_', ' ')}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontWeight: 600 }}>
                          ● {RAG_LABELS[k.rag] ?? k.rag}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(k.next_review_due)}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{k.priority}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{k.assigned_to_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 2: Action Plan Items ─────────────────────────────────── */}
        {showActions && (
          <div>
            <SectionHeading>Action Plan Items ({filteredActions.length})</SectionHeading>
            {filteredActions.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No action items match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['KLOE', 'Action', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completion Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((a, i) => (
                    <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>{a.klo_title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{a.assigned_to_name ?? '—'}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>{a.completion_notes ?? '—'}</td>
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
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No staff records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Name', 'Job Title', 'DBS', 'Supervision', 'Appraisal', 'Mandatory Training'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
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
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{h.job_title ?? '—'}</td>
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
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No completed mock inspections found for {reviewYear}.</p>
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
                          <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '12px' }}>
                            Conducted by {insp.conducted_by_name}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
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
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
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
                                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>
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
                      <p style={{ color: '#6b7280', fontSize: '12px', paddingLeft: '8px' }}>No ratings recorded.</p>
                    )}
                  </div>
                )

                return section
              })
            })()}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>AlwaysReady — {orgName}</span>
          <span>Generated {generatedAt} · For internal governance use only</span>
        </div>
      </div>
    </div>
  )
}
