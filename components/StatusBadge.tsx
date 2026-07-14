/**
 * StatusBadge — displays a compliance_records.status value as a readable pill.
 */
import type { ComplianceStatus } from '@/lib/types'

const STYLES: Record<ComplianceStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50  text-blue-700',
  completed:   'bg-green-50 text-green-700',
}

const LABELS: Record<ComplianceStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed:   'Completed',
}

export default function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
