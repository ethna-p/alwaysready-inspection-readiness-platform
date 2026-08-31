'use client'

/**
 * ReportBuilder — thin coordinator.
 *
 * Owns all state and derived data. Renders ReportFilterPanel (controls) and
 * ReportOutput (the printable report). All logic for filtering, sorting, and
 * narrative generation lives here; presentation lives in the two sub-components.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { KloeDir } from '../kloes/KloeTableHeader'
import {
  type ViewKey, type KloeRow, type ActionRow, type HrRow,
  type MockInspectionYear, type SnapshotData,
  SYSTEM_VIEWS, GAP_RAG_ORDER,
} from './report-types'
import ReportFilterPanel from './ReportFilterPanel'
import ReportOutput from './ReportOutput'

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder({
  orgName, orgLogoUrl, keyQuestions, kloes, actions, hrStaff, mockInspections, evidenceCounts, isAdmin,
}: Props) {
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

  // ── AI narrative ────────────────────────────────────────────────────────────
  const [narrative, setNarrative]               = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError]     = useState<string | null>(null)

  // ── KLOE table sort ───────────────────────────────────────────────────────
  const [kloeSort,    setKloeSort]    = useState<string>('default')
  const [kloeSortDir, setKloeSortDir] = useState<KloeDir>('asc')

  function handleKloeSort(col: string, newDir: KloeDir) {
    setKloeSort(col)
    setKloeSortDir(newDir)
  }

  // ── Progress vs last run ──────────────────────────────────────────────────
  const [previousSnapshot, setPreviousSnapshot] = useState<SnapshotData | null>(null)

  function selectView(key: ViewKey) {
    setActiveView(key)
    setSelectedKQs(new Set(keyQuestions))
    setNarrative(null)
    setPreviousSnapshot(null)

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
      list = list.sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'attention-needed') {
      list = list
        .filter(k => k.rag !== 'green')
        .sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'evidence-gaps') {
      list = list
        .filter(k => (evidenceCounts[k.klo_item_id] ?? 0) === 0)
        .sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    } else if (activeView === 'pre-inspection') {
      list = list.sort((a, b) => (GAP_RAG_ORDER[a.rag] ?? 99) - (GAP_RAG_ORDER[b.rag] ?? 99))
    }

    return list
  }, [kloes, selectedKQs, activeView, evidenceCounts])

  const sortedKloes = useMemo(() => {
    if (kloeSort === 'default') return filteredKloes
    const RAG_ORDER: Record<string, number>    = { red: 0, amber: 1, green: 2, grey: 3 }
    const STATUS_ORDER: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2 }
    const m = kloeSortDir === 'desc' ? -1 : 1
    return [...filteredKloes].sort((a, b) => {
      switch (kloeSort) {
        case 'kq':       return m * a.key_question_name.localeCompare(b.key_question_name)
        case 'title':    return m * a.title.localeCompare(b.title)
        case 'status':   return m * ((STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0))
        case 'rag':      return m * ((RAG_ORDER[a.rag] ?? 99) - (RAG_ORDER[b.rag] ?? 99))
        case 'date': {
          const dA = a.next_review_due ?? null
          const dB = b.next_review_due ?? null
          if (!dA && !dB) return 0
          if (!dA) return m
          if (!dB) return -m
          return m * dA.localeCompare(dB)
        }
        case 'priority': return m * ((a.priority ?? 99) - (b.priority ?? 99))
        case 'assigned':  return m * (a.assigned_to_name ?? '').localeCompare(b.assigned_to_name ?? '')
        case 'evidence': {
          const eA = evidenceCounts[a.klo_item_id] ?? 0
          const eB = evidenceCounts[b.klo_item_id] ?? 0
          return m * (eA - eB)
        }
        default: return 0
      }
    })
  }, [filteredKloes, kloeSort, kloeSortDir, evidenceCounts])

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

  const availableYears = useMemo(() => {
    const years = [...new Set(mockInspections.map(m => new Date(m.started_at).getFullYear()))]
    return years.sort((a, b) => b - a)
  }, [mockInspections])

  const allKQsSelected = selectedKQs.size === keyQuestions.length

  // ── RAG summary stats ───────────────────────────────────────────────────────
  const ragCounts = useMemo(() => ({
    green:  filteredKloes.filter(k => k.rag === 'green').length,
    amber:  filteredKloes.filter(k => k.rag === 'amber').length,
    red:    filteredKloes.filter(k => k.rag === 'red').length,
    grey:   filteredKloes.filter(k => k.rag === 'grey').length,
    total:  filteredKloes.length,
  }), [filteredKloes])

  const actionCounts = useMemo(() => {
    const now     = new Date()
    const open    = filteredActions.filter(a => a.status !== 'completed')
    const overdue = open.filter(a => a.due_date && new Date(a.due_date) < now)
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
  }, [activeView])

  const generateNarrative = useCallback(async () => {
    setNarrativeLoading(true)
    setNarrativeError(null)
    try {
      const activeViewEntry = activeView ? SYSTEM_VIEWS.find(v => v.key === activeView) : null
      const res = await fetch('/api/report-narrative', {
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
    const images   = Array.from(document.querySelectorAll<HTMLImageElement>('img'))
    const unloaded = images.filter(img => !img.complete)
    if (unloaded.length === 0) { window.print(); return }
    Promise.all(
      unloaded.map(img =>
        new Promise<void>(resolve => {
          img.addEventListener('load',  () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        }),
      ),
    ).then(() => window.print())
  }, [])

  return (
    <div>
      <ReportFilterPanel
        isAdmin={isAdmin}
        keyQuestions={keyQuestions}
        hrStaff={hrStaff}
        mockInspections={mockInspections}
        activeView={activeView}
        onSelectView={selectView}
        onClearView={clearView}
        showKloes={showKloes}
        setShowKloes={setShowKloes}
        showActions={showActions}
        setShowActions={setShowActions}
        showHr={showHr}
        setShowHr={setShowHr}
        showAnnualReview={showAnnualReview}
        setShowAnnualReview={setShowAnnualReview}
        selectedKQs={selectedKQs}
        allKQsSelected={allKQsSelected}
        onToggleKQ={toggleKQ}
        onToggleAllKQs={toggleAllKQs}
        actionStatus={actionStatus}
        setActionStatus={setActionStatus}
        selectedStaff={selectedStaff}
        setSelectedStaff={setSelectedStaff}
        reviewYear={reviewYear}
        setReviewYear={setReviewYear}
        availableYears={availableYears}
        narrative={narrative}
        narrativeLoading={narrativeLoading}
        narrativeError={narrativeError}
        onGenerateNarrative={generateNarrative}
        onPrint={handlePrint}
      />
      <ReportOutput
        orgName={orgName}
        orgLogoUrl={orgLogoUrl}
        activeView={activeView}
        generatedAt={generatedAt}
        selectedKQs={selectedKQs}
        keyQuestions={keyQuestions}
        sortedKloes={sortedKloes}
        filteredKloes={filteredKloes}
        filteredActions={filteredActions}
        filteredHr={filteredHr}
        filteredMocks={filteredMocks}
        evidenceCounts={evidenceCounts}
        ragCounts={ragCounts}
        actionCounts={actionCounts}
        previousSnapshot={previousSnapshot}
        showKloes={showKloes}
        showActions={showActions}
        showHr={showHr}
        showAnnualReview={showAnnualReview}
        reviewYear={reviewYear}
        kloeSort={kloeSort}
        kloeSortDir={kloeSortDir}
        onKloeSort={handleKloeSort}
        narrative={narrative}
      />
    </div>
  )
}
