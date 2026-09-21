'use client'

/**
 * Error boundary for the dashboard. Lives inside app/dashboard/layout.tsx, so the header,
 * navigation and footer stay in place while only the failed page is replaced.
 */
import ErrorPanel from '@/components/ErrorPanel'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} reset={reset} homeHref="/dashboard" homeLabel="Back to the dashboard" />
}
