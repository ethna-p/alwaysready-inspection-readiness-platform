import { redirect } from 'next/navigation'

/**
 * Root route — redirect to /dashboard.
 * Middleware handles the unauthenticated case and sends to /login.
 */
export default function RootPage() {
  redirect('/dashboard')
}
