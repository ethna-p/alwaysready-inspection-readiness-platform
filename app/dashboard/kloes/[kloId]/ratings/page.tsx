/**
 * /dashboard/kloes/[kloId]/ratings — CQC Rating Characteristics
 *
 * Shows the Outstanding / Good / Requires Improvement / Inadequate
 * descriptors for a single KLOE. Read-only reference page.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
      <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/kloes" className="hover:text-[#014D4E] underline">KLOEs</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/dashboard/kloes/${kloId}`} className="hover:text-[#014D4E] underline">{klo.title}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">Rating characteristics</li>
        </ol>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#014D4E] uppercase tracking-widest mb-1">
          {kqName}
        </p>
        <h1 className="text-2xl font-bold text-[#014D4E]">{klo.title}</h1>
        {klo.wording && (
          <p className="mt-3 text-sm text-[#1a1a1a] leading-relaxed">{klo.wording}</p>
        )}
        {klo.scope && (
          <p className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Scope: </span>{klo.scope}
          </p>
        )}
      </div>

      {/* Rating cards */}
      {hasAnyRating ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
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
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          No rating characteristics are recorded for this KLOE yet.
        </p>
      )}

      {/* Back link */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Link
          href={`/dashboard/kloes/${kloId}`}
          className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
        >
          ← Back to {klo.title}
        </Link>
      </div>
    </div>
  )
}
