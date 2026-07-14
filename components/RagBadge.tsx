/**
 * RagBadge — coloured dot + text label.
 *
 * Accessibility: colour is never the sole signal.
 * The text label conveys the same information for screen readers
 * and colour-blind users. The aria-label on the wrapper spells it
 * out in full for assistive technology.
 */
import type { RAGStatus } from '@/lib/rag'
import { RAG_LABELS } from '@/lib/rag'

const STYLES: Record<RAGStatus, { dot: string; pill: string }> = {
  grey:  { dot: 'bg-gray-400',  pill: 'bg-gray-100  text-gray-600' },
  red:   { dot: 'bg-red-500',   pill: 'bg-red-50    text-red-700'  },
  amber: { dot: 'bg-amber-400', pill: 'bg-amber-50  text-amber-700' },
  green: { dot: 'bg-green-500', pill: 'bg-green-50  text-green-700' },
}

interface Props {
  status: RAGStatus
  /** If true, renders smaller (for compact table rows) */
  compact?: boolean
}

export default function RagBadge({ status, compact = false }: Props) {
  const { dot, pill } = STYLES[status]
  const label = RAG_LABELS[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pill} ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
      aria-label={`RAG status: ${label}`}
    >
      <span className={`rounded-full shrink-0 ${dot} ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} aria-hidden="true" />
      {label}
    </span>
  )
}
