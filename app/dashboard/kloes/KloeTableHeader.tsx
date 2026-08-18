'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export type KloeSort = 'default' | 'title' | 'status' | 'rag' | 'priority' | 'date' | 'assigned'
export type KloeDir  = 'asc' | 'desc'

export interface SortColumnDef {
  key: string
  label: string
  classes?: string
}

// Default columns for the KLOE Compliance Tracker page
const KLOE_TRACKER_COLUMNS: SortColumnDef[] = [
  { key: 'title',    label: 'KLOE',        classes: '' },
  { key: 'status',   label: 'Status',      classes: 'hidden sm:table-cell' },
  { key: 'rag',      label: 'RAG',         classes: 'hidden md:table-cell' },
  { key: 'priority', label: 'Priority',    classes: 'hidden lg:table-cell' },
  { key: 'date',     label: 'Next due',    classes: 'hidden lg:table-cell' },
  { key: 'assigned', label: 'Assigned to', classes: 'hidden lg:table-cell' },
]

export default function KloeTableHeader({
  sort,
  dir,
  columns = KLOE_TRACKER_COLUMNS,
  hasTrailingTh = true,
  onSort,
}: {
  sort: string
  dir: KloeDir
  /** Column definitions — defaults to KLOE Tracker columns */
  columns?: SortColumnDef[]
  /** Include a trailing Actions <th>? Default true */
  hasTrailingTh?: boolean
  /**
   * If provided, called with (col, newDir) instead of pushing URL params.
   * Use this when the parent is already a client component (e.g. ReportBuilder).
   */
  onSort?: (col: string, dir: KloeDir) => void
}) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function handleSort(col: string) {
    const newDir: KloeDir = sort === col
      ? (dir === 'asc' ? 'desc' : 'asc')
      : 'asc'

    if (onSort) {
      onSort(col, newDir)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', col)
    if (sort === col) {
      params.set('dir', dir === 'asc' ? 'desc' : 'asc')
    } else {
      params.delete('dir') // reset to asc on new column
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <thead>
      <tr className="border-b border-line text-sm text-ink uppercase tracking-wide">
        {columns.map(col => {
          const active = sort === col.key
          return (
            <th
              key={col.key}
              scope="col"
              className={`text-left px-4 py-3 font-semibold ${col.classes ?? ''}`}
              aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
            >
              <button
                type="button"
                onClick={() => handleSort(col.key)}
                className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${active ? 'text-brand' : ''}`}
              >
                {col.label}
                <span aria-hidden="true" className="text-[10px] leading-none">
                  {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </button>
            </th>
          )
        })}
        {hasTrailingTh && (
          <th scope="col" className="px-4 py-3">
            <span className="sr-only">Actions</span>
          </th>
        )}
      </tr>
    </thead>
  )
}
