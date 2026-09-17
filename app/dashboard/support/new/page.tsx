/**
 * /dashboard/support/new — submit a new support ticket.
 */
import Link from 'next/link'
import NewTicketForm from './NewTicketForm'

const DEFAULT_MESSAGE_PLACEHOLDER = "Please describe what you need help with, including any steps you've already tried."
const FEATURE_SUGGESTION_MESSAGE_PLACEHOLDER = "Tell us what feature you'd like to see, and how it would help you and your team."

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const isFeatureSuggestion = type === 'feature-suggestion'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-dim mb-6" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-brand underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/support" className="hover:text-brand underline">Support</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">New ticket</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-brand mb-2">Get in touch</h1>
      <p className="text-sm text-ink mb-6">
        We aim to respond within three business days. You can track your ticket here once it&apos;s submitted.
      </p>

      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-brand mb-8">
        Before submitting, it&apos;s worth checking our{' '}
        <Link href="/dashboard/help" className="font-semibold underline hover:text-brand">
          Help page
        </Link>
        {' '}— it covers common questions about KLOEs, roles, and using the platform.
      </div>

      <NewTicketForm
        defaultSubject={isFeatureSuggestion ? 'New Feature Suggestion' : ''}
        messagePlaceholder={isFeatureSuggestion ? FEATURE_SUGGESTION_MESSAGE_PLACEHOLDER : DEFAULT_MESSAGE_PLACEHOLDER}
      />
    </div>
  )
}
