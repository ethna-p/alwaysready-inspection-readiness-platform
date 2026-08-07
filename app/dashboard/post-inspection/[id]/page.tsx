/**
 * /dashboard/post-inspection/[id] — Post-Inspection detail.
 *
 * Shows the full inspection record: ratings by key question, FAC deadline
 * countdown, all FAC items with their dispute type and status, key findings,
 * and the staff briefing section. Admins can edit all fields and manage FAC items.
 */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import {
  updateReview,
  deleteReview,
  createFacItem,
  updateFacItem,
  deleteFacItem,
  type CqcRating,
  type ReviewStatus,
  type FacDisputeType,
  type FacStatus,
} from '../post-inspection-actions'
import PostInspectionDetailClient from './PostInspectionDetailClient'

export const metadata = { title: 'Post-Inspection Detail — AlwaysReady' }

export type FacItem = {
  id: string
  key_question: string
  inspector_finding: string
  dispute_type: FacDisputeType
  our_position: string
  evidence_reference: string | null
  status: FacStatus
  created_at: string
}

export type ReviewDetail = {
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
  created_at: string
}

export default async function PostInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const orgId    = profile.organisation_id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: rowError } = await (supabase as any)
    .from('post_inspection_reviews')
    .select('*')
    .eq('id', id)
    .eq('organisation_id', orgId)
    .maybeSingle()

  if (rowError) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading inspection:</strong> {rowError.message}
      </div>
    )
  }

  if (!row) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: facRows } = await (supabase as any)
    .from('fac_items')
    .select('*')
    .eq('review_id', id)
    .eq('organisation_id', orgId)
    .order('key_question')
    .order('created_at')

  const review: ReviewDetail = {
    id:                  row.id,
    inspection_date:     row.inspection_date,
    draft_received_date: row.draft_received_date,
    final_report_date:   row.final_report_date,
    overall_rating:      row.overall_rating,
    safe_rating:         row.safe_rating,
    effective_rating:    row.effective_rating,
    caring_rating:       row.caring_rating,
    responsive_rating:   row.responsive_rating,
    well_led_rating:     row.well_led_rating,
    inspector_name:      row.inspector_name,
    key_findings:        row.key_findings,
    staff_briefing:      row.staff_briefing,
    status:              row.status,
    created_at:          row.created_at,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const facItems: FacItem[] = (facRows ?? []).map((f: any) => ({
    id:                 f.id,
    key_question:       f.key_question,
    inspector_finding:  f.inspector_finding,
    dispute_type:       f.dispute_type,
    our_position:       f.our_position,
    evidence_reference: f.evidence_reference,
    status:             f.status,
    created_at:         f.created_at,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-dim">
        <Link href="/dashboard/post-inspection" className="hover:text-brand transition-colors">
          Post-Inspection
        </Link>
        <span>/</span>
        <span className="text-ink">
          {new Date(review.inspection_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <PostInspectionDetailClient
        review={review}
        facItems={facItems}
        isAdmin={profile.role === 'admin'}
        updateReview={(fd) => updateReview(review.id, fd)}
        deleteReview={() => deleteReview(review.id)}
        createFacItem={(fd) => createFacItem(review.id, fd)}
        updateFacItem={(id, fd) => updateFacItem(id, review.id, fd)}
        deleteFacItem={(id) => deleteFacItem(id, review.id)}
      />
    </div>
  )
}
