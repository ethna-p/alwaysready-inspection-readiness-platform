'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export type KloeSort = 'default' | 'title' | 'status' | 'rag' | 'priority' | 'date' | 'assigned'
export type KloeDir  = 'asc' | 'desc'

const COLUMNS: { key: KloeSort; label: string; classes: string }[] = [
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
}: {
  sort: KloeSort
  dir: KloeDir
}) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function handleSort(col: KloeSort) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('sort') === col) {
      // same column — toggle direction
      params.set('dir', dir === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', col)
      params.delete('dir') // reset to default asc
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <thead>
      <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
        {COLUMNS.map(col => {
          const active = sort === col.key
          return (
            <th
              key={col.key}
              scope="col"
              className={`text-left px-4 py-3 font-medium ${col.classes}`}
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
        <th scope="col" className="px-4 py-3">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  )
}
