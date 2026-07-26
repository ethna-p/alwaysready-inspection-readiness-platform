'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  defaultTab: string
}

export default function AccountTabNav({ tabs, defaultTab }: Props) {
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? defaultTab

  return (
    <div className="flex gap-0 border-b border-line">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={`?tab=${tab.id}`}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? 'text-brand border-brand'
              : 'text-ink-dim border-transparent hover:text-ink hover:border-line'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
