/**
 * /dashboard/newsletter — AI newsletter drafting tool.
 * Admin only. Generates draft newsletters for staff, families, or both.
 * Limited to 10 AI generations per organisation per calendar month.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/session'
import { getNewsletterUsage } from '@/app/actions/newsletter'
import NewsletterForm from './NewsletterForm'

export const metadata = { title: 'Newsletter drafting — AlwaysReady' }

export default async function NewsletterPage() {
  const profile = await getCurrentUserProfile()

  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { remaining } = await getNewsletterUsage()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">Newsletter drafting</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#014D4E] mb-2">Newsletter drafting</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Generate a draft newsletter for your staff or families. Copy the finished text and send it
          however you like — email, print, or message. AlwaysReady doesn&apos;t send on your behalf.
        </p>
      </div>

      <NewsletterForm initialRemaining={remaining} />
    </div>
  )
}
