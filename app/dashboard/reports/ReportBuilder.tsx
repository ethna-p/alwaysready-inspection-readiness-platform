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

import { useState, useMemo, useEffect, useCallback } from 'react'
import type { SavedReportView, ReportViewConfig } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KloeRow = {
  id: string
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder({ orgName, keyQuestions, kloes, actions, hrStaff, mockInspections, isAdmin }: Props) {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [selectedKQs, setSelectedKQs]           = useState<Set<string>>(new Set(keyQuestions))
  const [showKloes, setShowKloes]               = useState(true)
  const [showActions, setShowActions]           = useState(true)
  const [showHr, setShowHr]                     = useState(true)
  const [showAnnualReview, setShowAnnualReview] = useState(true)
  const [actionStatus, setActionStatus]         = useState<ReportViewConfig['actionStatus']>('all')
  const [selectedStaff, setSelectedStaff]       = useState('all')
  const [reviewYear, setReviewYear]             = useState(new Date().getFullYear())

  // ── View state ──────────────────────────────────────────────────────────────
  const [views, setViews]                 = useState<SavedReportView[]>([])
  const [activeViewId, setActiveViewId]   = useState<string | null>(null)
  const [savePrompt, setSavePrompt]       = useState(false)
  const [saveName, setSaveName]           = useState('')
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState<string | null>(null)

  const fetchViews = useCallback(async () => {
    try {
      const res = await fetch('/api/report-views')
      if (res.ok) setViews(await res.json())
    } catch { /* network error — silently ignore */ }
  }, [])

  useEffect(() => { fetchViews() }, [fetchViews])

  // Apply a saved view's config to current filter state
  function applyView(view: SavedReportView) {
    const c = view.config
    setSelectedKQs(c.selectedKQs === 'all' ? new Set(keyQuestions) : new Set(c.selectedKQs))
    setShowKloes(c.showKloes)
    setShowActions(c.showActions)
    // HR section only visible to admins regardless of view config
    setShowHr(c.showHr && isAdmin)
    setShowAnnualReview(c.showAnnualReview)
    setActionStatus(c.actionStatus)
    setActiveViewId(view.id)
  }

  async function handleSaveView() {
    if (!saveName.trim()) { setSaveError('Please enter a name.'); return }
    setSaving(true)
    setSaveError(null)
    const config: ReportViewConfig = {
      selectedKQs:      [...selectedKQs],
      showKloes,
      showActions,
      showHr,
      showAnnualReview,
      actionStatus,
    }
    try {
      const res = await fetch('/api/report-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), config }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setSaveError(err.error ?? 'Failed to save view.')
      } else {
        const newView: SavedReportView = await res.json()
        setViews(prev => [newView, ...prev])
        setActiveViewId(newView.id)
        setSavePrompt(false)
        setSaveName('')
      }
    } catch { setSaveError('Network error — please try again.') }
    finally { setSaving(false) }
  }

  async function handleDeleteView(id: string) {
    if (!confirm('Delete this view?')) return
    const res = await fetch(`/api/report-views?id=${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setViews(prev => prev.filter(v => v.id !== id))
      if (activeViewId === id) setActiveViewId(null)
    }
  }

  function toggleKQ(name: string, checked: boolean) {
    setSelectedKQs(prev => {
      const next = new Set(prev)
      checked ? next.add(name) : next.delete(name)
      return next
    })
    setActiveViewId(null)  // unsaved change
  }

  function toggleAllKQs(checked: boolean) {
    setSelectedKQs(checked ? new Set(keyQuestions) : new Set())
    setActiveViewId(null)
  }

  const systemViews  = views.filter(v => v.is_system)
  const customViews  = views.filter(v => !v.is_system)

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredKloes = useMemo(() =>
    kloes.filter(k => selectedKQs.has(k.key_question_name)),
    [kloes, selectedKQs]
  )

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

        {/* ── Views ──────────────────────────────────────────────────────── */}
        <div className="bg-card border border-line rounded-xl p-5">
          <p className="text-sm font-semibold text-ink mb-3">Views</p>

          {/* System views */}
          {systemViews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Standard views</p>
              <div className="flex flex-wrap gap-2">
                {systemViews.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => applyView(v)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                      ${activeViewId === v.id
                        ? 'bg-[#014D4E] text-white border-[#014D4E]'
                        : 'bg-fill text-ink border-line hover:border-brand hover:text-brand'}
                    `}
                  >
                    {v.name}
                    {v.name === 'HR Compliance' && !isAdmin && (
                      <span className="ml-1 text-xs opacity-60">(admin)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom views */}
          {customViews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Saved views</p>
              <div className="flex flex-wrap gap-2">
                {customViews.map(v => (
                  <div key={v.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyView(v)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                        ${activeViewId === v.id
                          ? 'bg-[#014D4E] text-white border-[#014D4E]'
                          : 'bg-fill text-ink border-line hover:border-brand hover:text-brand'}
                      `}
                    >
                      {v.name}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteView(v.id)}
                        aria-label={`Delete view: ${v.name}`}
                        className="text-ink-muted hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save current view (admin only) */}
          {isAdmin && (
            savePrompt ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => { setSaveName(e.target.value); setSaveError(null) }}
                  placeholder="View name…"
                  className="border border-line rounded-lg px-3 py-1.5 text-sm text-ink bg-card w-48 focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent"
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveView(); if (e.key === 'Escape') { setSavePrompt(false); setSaveName('') } }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveView}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-[#014D4E] text-white text-sm font-medium hover:bg-[#013838] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#014D4E] transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSavePrompt(false); setSaveName(''); setSaveError(null) }}
                  className="px-3 py-1.5 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-fill focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSavePrompt(true)}
                className="mt-1 text-sm font-medium text-brand hover:underline focus:outline-none"
              >
                + Save current filters as a view
              </button>
            )
          )}
        </div>

        {/* Sections */}
        <div className="bg-card border border-line rounded-xl p-5">
          <p className="text-sm font-semibold text-ink mb-3">Sections to include</p>
          <div className="flex flex-wrap gap-4">
            <Toggle label="KLOE Summary"       checked={showKloes}         onChange={v => { setShowKloes(v);        setActiveViewId(null) }} />
            <Toggle label="Action Plan Items"  checked={showActions}       onChange={v => { setShowActions(v);      setActiveViewId(null) }} />
            {isAdmin && <Toggle label="HR Compliance"  checked={showHr}   onChange={v => { setShowHr(v);           setActiveViewId(null) }} />}
            <Toggle label="Annual Review"      checked={showAnnualReview}  onChange={v => { setShowAnnualReview(v); setActiveViewId(null) }} />
          </div>
        </div>

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
              <select value={actionStatus} onChange={e => { setActionStatus(e.target.value as ReportViewConfig['actionStatus']); setActiveViewId(null) }} className={inputClass}>
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
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#111' }}>

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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Key Question', 'KLOE', 'Status', 'RAG', 'Next Review', 'Priority', 'Assigned To'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredKloes.map((k, i) => (
                    <tr key={k.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{k.key_question_name}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{k.title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{k.status.replace('_', ' ')}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontWeight: 600 }}>
                          ● {RAG_LABELS[k.rag] ?? k.rag}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(k.next_review_due)}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{k.priority}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{k.assigned_to_name ?? '—'}</td>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['KLOE', 'Action', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completion Notes'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((a, i) => (
                    <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{a.klo_title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{a.assigned_to_name ?? '—'}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{a.completion_notes ?? '—'}</td>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Name', 'Job Title', 'DBS', 'Supervision', 'Appraisal', 'Mandatory Training'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
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
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{h.full_name ?? '—'}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{h.job_title ?? '—'}</td>
                        {[dbsStatus, supStatus, appStatus].map((s, idx) => (
                          <td key={idx} style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ color: HR_STATUS_COLOURS[s], fontWeight: 600 }}>
                              {HR_STATUS_LABELS[s]}
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
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
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{label}</span>
                        {insp.conducted_by_name && (
                          <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '12px' }}>
                            Conducted by {insp.conducted_by_name}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatDate(insp.started_at)}
                        {insp.completed_at && insp.completed_at !== insp.started_at
                          ? ` – ${formatDate(insp.completed_at)}`
                          : ''}
                      </span>
                    </div>

                    {/* Ratings table */}
                    {insp.ratings.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {['Key Question', 'Self-Assessed Rating', 'Trend'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
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
                                <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{r.name}</td>
                                <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                                  <span style={{ color: MOCK_RATING_COLOURS[r.worstRating] ?? '#374151', fontWeight: 600 }}>
                                    {MOCK_RATING_LABELS[r.worstRating] ?? r.worstRating}
                                  </span>
                                </td>
                                <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                                  {trend ? (
                                    <span style={{ color: trend.colour, fontWeight: 700, fontSize: '14px' }}>
                                      {trend.symbol}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '11px' }}>
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
