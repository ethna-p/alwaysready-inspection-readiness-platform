'use client'

/**
 * MockInspectionsList — client-side filtered list of past mock inspections.
 *
 * Filters:
 *   Date range  — Last 3 months / Last 6 months / This year / All time
 *   Type        — All / Full inspection / Partial (per key question)
 *   Status      — All / In progress / Completed
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'

export type InspectionListItem = {
  id: string
  type: 'full' | 'partial'
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at: string | null
  key_questions: { name: string } | null
  overall_rating: string | null
}

interface Props {
  inspections: InspectionListItem[]
  keyQuestions: { id: string; name: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
}

const RATING_LABEL: Record<string, string> = {
  outstanding:          'Outstanding',
  good:                 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate:           'Inadequate',
}

const RATING_STYLE: Record<string, string> = {
  outstanding:          'bg-purple-100 text-purple-700 border-purple-200',
  good:                 'bg-green-100 text-green-700 border-green-200',
  requires_improvement: 'bg-amber-100 text-amber-700 border-amber-200',
  inadequate:           'bg-red-100 text-red-700 border-red-200',
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs font-medium text-ink-dim">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          border border-line rounded-lg px-3 py-2 text-sm text-ink bg-card
          focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
          min-w-[160px]
        "
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MockInspectionsList({ inspections, keyQuestions }: Props) {
  const [dateRange, setDateRange] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const typeOptions = useMemo(() => [
    { value: 'all',  label: 'All types' },
    { value: 'full', label: 'Full inspection' },
    ...keyQuestions.map(kq => ({
      value: `partial:${kq.name}`,
      label: `Partial — ${kq.name}`,
    })),
  ], [keyQuestions])

  const dateRangeOptions = [
    { value: 'all',     label: 'All time' },
    { value: '3months', label: 'Last 3 months' },
    { value: '6months', label: 'Last 6 months' },
    { value: 'year',    label: 'This year' },
  ]

  const statusOptions = [
    { value: 'all',         label: 'All statuses' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed',   label: 'Completed' },
  ]

  // Apply filters
  const filtered = useMemo(() => {
    const now = new Date()

    return inspections.filter(insp => {
      // ── Date range ──────────────────────────────────────────────────
      if (dateRange !== 'all') {
        const started = new Date(insp.started_at)
        if (dateRange === '3months') {
          const cutoff = new Date(now)
          cutoff.setMonth(cutoff.getMonth() - 3)
          if (started < cutoff) return false
        } else if (dateRange === '6months') {
          const cutoff = new Date(now)
          cutoff.setMonth(cutoff.getMonth() - 6)
          if (started < cutoff) return false
        } else if (dateRange === 'year') {
          if (started.getFullYear() !== now.getFullYear()) return false
        }
      }

      // ── Type ────────────────────────────────────────────────────────
      if (typeFilter !== 'all') {
        if (typeFilter === 'full') {
          if (insp.type !== 'full') return false
        } else if (typeFilter.startsWith('partial:')) {
          const kqName = typeFilter.slice('partial:'.length)
          if (insp.type !== 'partial' || insp.key_questions?.name !== kqName) return false
        }
      }

      // ── Status ──────────────────────────────────────────────────────
      if (statusFilter !== 'all' && insp.status !== statusFilter) return false

      return true
    })
  }, [inspections, dateRange, typeFilter, statusFilter])

  const hasActiveFilters = dateRange !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'

  function resetFilters() {
    setDateRange('all')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  if (inspections.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-brand">Previous inspections</h2>
        <div className="bg-card border border-line rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-ink-dim">No mock inspections yet. Start your first one above.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-brand">Previous inspections</h2>

      {/* Filter bar */}
      <div className="bg-card border border-line rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <FilterSelect
            label="Date range"
            value={dateRange}
            onChange={setDateRange}
            options={dateRangeOptions}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-ink-dim hover:text-ink underline self-end pb-2 focus:outline-none"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-ink-dim mt-3">
          {filtered.length === inspections.length
            ? `${inspections.length} inspection${inspections.length === 1 ? '' : 's'}`
            : `${filtered.length} of ${inspections.length} inspection${inspections.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-line rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-ink-dim">No inspections match the selected filters.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 text-sm font-medium text-brand hover:underline focus:outline-none"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insp => {
            const label = insp.type === 'full'
              ? 'Full inspection'
              : `Partial — ${insp.key_questions?.name ?? 'Unknown'}`
            const statusLabel = insp.status === 'completed' ? 'Completed' : 'In progress'
            const statusStyle = STATUS_STYLE[insp.status] ?? 'bg-fill-dim text-ink-muted'
            const target = insp.status === 'completed'
              ? `/dashboard/mock-inspections/${insp.id}/report`
              : `/dashboard/mock-inspections/${insp.id}`

            const dateLabel = insp.status === 'completed' && insp.completed_at
              ? `Completed ${formatDate(insp.completed_at)}`
              : `Started ${formatDate(insp.started_at)}`

            return (
              <Link
                key={insp.id}
                href={target}
                className="flex items-center justify-between bg-card border border-line rounded-xl px-5 py-4 hover:border-[#00b8a6] transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-ink group-hover:text-brand">{label}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{dateLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                  {insp.overall_rating && RATING_LABEL[insp.overall_rating] && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${RATING_STYLE[insp.overall_rating]}`}>
                      {RATING_LABEL[insp.overall_rating]}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>
                    {statusLabel}
                  </span>
                  <span className="text-ink-muted group-hover:text-brand text-sm">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
