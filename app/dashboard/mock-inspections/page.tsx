/**
 * /dashboard/mock-inspections — list of past mock inspections + start new.
 * Admin only.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import StartMockInspectionForm from './StartMockInspectionForm'

export const metadata = { title: 'Mock Inspections — AlwaysReady' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
}

export default async function MockInspectionsPage() {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch key questions for the start form
  const { data: keyQuestions } = await supabase
    .from('key_questions')
    .select('id, name')
    .order('display_order')

  // Fetch past mock inspections for this org
  const { data: inspections } = await (supabase as any)
    .from('mock_inspections')
    .select(`
      id, type, status, started_at, completed_at,
      key_questions ( name )
    `)
    .order('started_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Mock Inspections</h1>
        <p className="text-sm text-ink-dim">
          Run a mock inspection to identify areas for improvement before a real CQC visit.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Guidance only.</strong> Mock inspections are a self-assessment tool designed to help you identify areas for improvement. Ratings and recommendations do not represent the view of CQC. AlwaysReady makes no claim about how a CQC inspector would rate your service. CQC inspectors exercise independent professional judgement when forming their conclusions.
      </div>

      {/* Start new */}
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand mb-4">Start a new mock inspection</h2>
        <StartMockInspectionForm keyQuestions={keyQuestions ?? []} />
      </div>

      {/* Past inspections */}
      {inspections && inspections.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-brand mb-3">Previous inspections</h2>
          <div className="space-y-3">
            {inspections.map((insp: any) => {
              const label = insp.type === 'full'
                ? 'Full inspection'
                : `Partial — ${(insp.key_questions as any)?.name ?? 'Unknown'}`
              const statusLabel = insp.status === 'completed' ? 'Completed' : 'In progress'
              const statusStyle = STATUS_STYLE[insp.status] ?? 'bg-fill-dim text-ink-muted'
              const target = insp.status === 'completed'
                ? `/dashboard/mock-inspections/${insp.id}/report`
                : `/dashboard/mock-inspections/${insp.id}`

              return (
                <Link
                  key={insp.id}
                  href={target}
                  className="flex items-center justify-between bg-card border border-line rounded-xl px-5 py-4 hover:border-[#00b8a6] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink group-hover:text-brand">{label}</p>
                    <p className="text-xs text-ink-muted mt-0.5">Started {formatDate(insp.started_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    <span className="text-ink-muted group-hover:text-brand text-sm">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
