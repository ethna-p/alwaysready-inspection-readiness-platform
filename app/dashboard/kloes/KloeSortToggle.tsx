'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export type KloeSort = 'default' | 'urgency' | 'date'

const OPTIONS: { value: KloeSort; label: string }[] = [
  { value: 'default',  label: 'Default'   },
  { value: 'urgency',  label: 'Urgency'   },
  { value: 'date',     label: 'Date due'  },
]

export default function KloeSortToggle({ current }: { current: KloeSort }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function setSort(value: KloeSort) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Sort KLOEs by">
      <span className="text-xs text-ink-dim font-medium">Sort:</span>
      <div className="flex rounded-lg border border-line overflow-hidden text-xs font-medium">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            aria-pressed={current === opt.value}
            className={`
              px-3 py-1.5 transition-colors
              ${current === opt.value
                ? 'bg-[#014D4E] text-white'
                : 'bg-card text-ink-dim hover:text-ink hover:bg-fill'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
