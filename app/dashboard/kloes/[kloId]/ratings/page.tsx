/**
 * /dashboard/kloes/[kloId]/ratings — CQC Rating Characteristics
 *
 * Shows the Outstanding / Good / Requires Improvement / Inadequate
 * descriptors for a single KLOE. Read-only reference page.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HelpWidget from '@/components/HelpWidget'

type Props = { params: Promise<{ kloId: string }> }

const RATINGS = [
  { key: 'rating_outstanding' as const, label: 'Outstanding',           colour: 'border-purple-300 bg-purple-50', heading: 'text-purple-800' },
  { key: 'rating_good'        as const, label: 'Good',                  colour: 'border-green-300  bg-green-50',  heading: 'text-green-800'  },
  { key: 'rating_ri'          as const, label: 'Requires Improvement',  colour: 'border-amber-300  bg-amber-50',  heading: 'text-amber-800'  },
  { key: 'rating_inadequate'  as const, label: 'Inadequate',            colour: 'border-red-300    bg-red-50',    heading: 'text-red-800'    },
]

export default async function RatingsPage({ params }: Props) {
  const { kloId } = await params
  const supabase = await createClient()

  const { data: klo } = await supabase
    .from('klo_items')
    .select('id, title, wording, scope, key_question_id, rating_outstanding, rating_good, rating_ri, rating_inadequate, key_questions(name)')
    .eq('id', kloId)
    .single()

  if (!klo) notFound()

  const kqName = (klo as unknown as { key_questions: { name: string } | null })
    ?.key_questions?.name ?? '—'

  const hasAnyRating = RATINGS.some(r => klo[r.key])

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-dim mb-2" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-brand underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/kloes" className="hover:text-brand underline">KLOEs</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/dashboard/kloes/${kloId}`} className="hover:text-brand underline">{klo.title}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">Rating characteristics</li>
        </ol>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-1">
          {kqName}
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-brand">{klo.title}</h1>
          <HelpWidget title="Mock Inspection Ratings" items={[
            { heading: 'What are these ratings?', body: 'These are your self-assessed CQC ratings for this KLOE from each mock inspection you have run. They use the same scale CQC uses: Outstanding, Good, Requires Improvement, and Inadequate.' },
            { heading: 'Are these ratings official?', body: 'No. These are internal self-assessments only. They are not shared with CQC and do not affect your official rating. They help you track your own progress and identify areas to improve before a real inspection.' },
            { heading: 'What is the trend arrow?', body: 'The arrow shows whether your rating has improved (↑), stayed the same (→), or declined (↓) compared to your previous mock inspection for this KLOE.' },
            { heading: 'How do I add a rating?', body: 'Run a mock inspection from the Mock Inspections section. Ratings are recorded during the session against each KLOE and appear here automatically once the inspection is completed.' },
          ]} />
        </div>
        {klo.wording && (
          <p className="mt-3 text-sm text-ink leading-relaxed">{klo.wording}</p>
        )}
        {klo.scope && (
          <p className="mt-2 text-sm text-ink-dim">
            <span className="font-medium">Scope: </span>{klo.scope}
          </p>
        )}
      </div>

      {/* Rating cards */}
      {hasAnyRating ? (
        <div className="space-y-4">
          <p className="text-xs text-ink-dim uppercase tracking-wide font-medium">
            CQC rating characteristics
          </p>
          {RATINGS.map(({ key, label, colour, heading }) => {
            const text = klo[key]
            if (!text) return null
            return (
              <div
                key={key}
                className={`rounded-xl border p-5 ${colour}`}
              >
                <h2 className={`text-sm font-bold mb-2 ${heading}`}>{label}</h2>
                <p className="text-sm text-ink leading-relaxed">{text}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-ink-dim">
          No rating characteristics are recorded for this KLOE yet.
        </p>
      )}

      {/* Back link */}
      <div className="mt-8 pt-6 border-t border-line">
        <Link
          href={`/dashboard/kloes/${kloId}`}
          className="text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
        >
          ← Back to {klo.title}
        </Link>
      </div>
    </div>
  )
}
