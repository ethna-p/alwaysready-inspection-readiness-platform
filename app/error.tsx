'use client'

/**
 * Route-level error boundary for everything outside the dashboard (login, trial,
 * superadmin, and so on). Reports the error to Sentry and shows a friendly page.
 * The dashboard has its own boundary (app/dashboard/error.tsx) so its header stays.
 */
import ErrorPanel from '@/components/ErrorPanel'
import SiteFooter from '@/components/SiteFooter'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <ErrorPanel error={error} reset={reset} homeHref="/login" homeLabel="Back to sign in" />
      <SiteFooter />
    </>
  )
}
