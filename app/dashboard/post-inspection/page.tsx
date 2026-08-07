/**
 * /dashboard/post-inspection — Post-Inspection Review list.
 *
 * Lists all CQC inspection records for the organisation. Admins can log a new
 * inspection, track FAC deadlines, and drill into the detail page to manage
 * FAC items and the staff briefing. All roles can view.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { createReview, type CqcRating, type ReviewStatus } from './post-inspection-actions'
import PostInspectionListClient from './PostInspectionListClient'

export const metadata = { title: 'Post-Inspection — AlwaysReady' }

export type PostInspectionReview = {
  id: string
  inspection_date: string
  draft_received_date: string | null
  final_report_date: string | null
  overall_rating: CqcRating
  safe_rating: CqcRating
  effective_rating: CqcRating
  caring_rating: CqcRating
  responsive_rating: CqcRating
  well_led_rating: CqcRating
  inspector_name: string | null
  key_findings: string | null
  staff_briefing: string | null
  status: ReviewStatus
  fac_count: number
  created_at: string
}

export default async function PostInspectionPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const orgId    = profile.organisation_id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from('post_inspection_reviews')
    .select('*')
    .eq('organisation_id', orgId)
    .order('inspection_date', { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading inspections:</strong> {error.message}
      </div>
    )
  }

  // Fetch FAC item counts per review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: facRows } = await (supabase as any)
    .from('fac_items')
    .select('review_id')
    .eq('organisation_id', orgId)

  const facCountByReview = new Map<string, number>()
  ;(facRows ?? []).forEach((f: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    facCountByReview.set(f.review_id, (facCountByReview.get(f.review_id) ?? 0) + 1)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: PostInspectionReview[] = (rows ?? []).map((r: any) => ({
    id:                   r.id,
    inspection_date:      r.inspection_date,
    draft_received_date:  r.draft_received_date,
    final_report_date:    r.final_report_date,
    overall_rating:       r.overall_rating,
    safe_rating:          r.safe_rating,
    effective_rating:     r.effective_rating,
    caring_rating:        r.caring_rating,
    responsive_rating:    r.responsive_rating,
    well_led_rating:      r.well_led_rating,
    inspector_name:       r.inspector_name,
    key_findings:         r.key_findings,
    staff_briefing:       r.staff_briefing,
    status:               r.status,
    fac_count:            facCountByReview.get(r.id) ?? 0,
    created_at:           r.created_at,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Post-Inspection</h1>
        <p className="text-sm text-ink-dim">
          Manage CQC inspection outcomes, Factual Accuracy Challenges, and improvement plans.
        </p>
      </div>

      {/* Guidance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p>
          <strong>After receiving a draft CQC report</strong>, you have{' '}
          <strong>10 working days</strong> to submit a Factual Accuracy Challenge (FAC) disputing
          any errors. Log the inspection here, record each point you wish to challenge, and track
          its outcome. If the final rating is Requires Improvement or Inadequate, use the{' '}
          <Link href="/dashboard/kloes" className="underline hover:text-blue-900">KLOE action plans</Link>{' '}
          to build your formal improvement programme.
        </p>
      </div>

      <PostInspectionListClient
        reviews={reviews}
        isAdmin={profile.role === 'admin'}
        createReview={createReview}
      />
    </div>
  )
}
