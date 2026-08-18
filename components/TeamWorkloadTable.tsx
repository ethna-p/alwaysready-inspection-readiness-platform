'use client'

import { useState } from 'react'
import RagBadge from '@/components/RagBadge'
import type { RAGStatus } from '@/lib/rag'

type TeamMemberStats = {
  id: string
  displayName: string
  rag: Record<RAGStatus, number>
  total: number
}

type SortMode = 'risk' | 'name-asc' | 'name-desc'

export default function TeamWorkloadTable({ members }: { members: TeamMemberStats[] }) {
  const [sort, setSort] = useState<SortMode>('risk')

  function toggleNameSort() {
    setSort(s => s === 'name-asc' ? 'name-desc' : 'name-asc')
  }

  const sorted = [...members].sort((a, b) => {
    if (sort === 'name-asc') return a.displayName.localeCompare(b.displayName)
    if (sort === 'name-desc') return b.displayName.localeCompare(a.displayName)
    return (b.rag.red + b.rag.grey) - (a.rag.red + a.rag.grey) // risk
  })

  const nameArrow = sort === 'name-asc' ? '↑' : sort === 'name-desc' ? '↓' : null

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
            <th scope="col" className="text-left px-4 py-3 font-medium">
              <button
                onClick={toggleNameSort}
                className="inline-flex items-center gap-1 hover:text-ink transition-colors"
                aria-label={`Sort by name ${sort === 'name-asc' ? 'descending' : 'ascending'}`}
              >
                Team member
                <span className="text-[10px] w-3 text-center" aria-hidden="true">
                  {nameArrow ?? <span className="opacity-30">⇅</span>}
                </span>
              </button>
            </th>
            <th scope="col" className="text-left px-4 py-3 font-medium">Assigned KLOEs</th>
            <th scope="col" className="text-left px-4 py-3 font-medium hidden sm:table-cell">RAG breakdown</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map(member => (
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
  )
}
