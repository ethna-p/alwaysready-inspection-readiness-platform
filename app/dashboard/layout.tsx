/**
 * Authenticated layout — wraps all /dashboard/* routes.
 * Adds SiteHeader and SiteFooter. Server component — verifies
 * the user session server-side before rendering.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Belt-and-braces: middleware already redirects, but this
  // guards against any edge case where middleware doesn't run.
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <SiteHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
