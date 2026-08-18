/**
 * Dashboard — At a Glance
 *
 * Fast path: auth + CQC card + overall readiness + per-KQ breakdown.
 * Analytics section streams in via <Suspense> (AnalyticsSectionServer).
 *
 * CQC rating refresh uses next/server after() so it never blocks the render.
 */
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { after } from 'next/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import type { RAGStatus } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import type { ComplianceRecord } from '@/lib/types'
import { fetchCqcLocation, cqcRatingColours, formatCqcDate } from '@/lib/cqc'
import TeamWorkloadTable from '@/components/TeamWorkloadTable'
import type { CqcRating } from '@/lib/cqc'
import AnalyticsSectionServer from '@/components/AnalyticsSectionServer'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCompliant(record: ComplianceRecord | undefined, now: Date): boolean {
  if (!record) return false
  return (
    record.status === 'completed' &&
    record.next_review_due !== null &&
    new Date(record.next_review_due) >= now
  )
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function progressColour(percent: number): string {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 50) return 'bg-amber-400'
  return 'bg-red-500'
}

// ── Analytics loading skeleton ────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="border-t border-line pt-8 mt-2 animate-pulse">
      <div className="h-6 w-24 bg-fill-dim rounded mb-6" />
      <div className="space-y-4">
        <div className="h-48 bg-fill-dim rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-fill-dim rounded-2xl" />
          <div className="h-40 bg-fill-dim rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-fill-dim rounded-2xl" />
          <div className="h-40 bg-fill-dim rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Dashboard — AlwaysReady' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()

  // ── Role-based redirect ───────────────────────────────────────────────────
  const sessionProfile = await getCurrentUserProfile()
  if (sessionProfile?.role === 'user') redirect('/dashboard/my-kloes')

  // ── Auth / profile ────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  type OrgRow = {
    name: string
    cqc_location_id:          string | null
    cqc_location_name:        string | null
    cqc_rating:               string | null
    cqc_last_inspection_date: string | null
    cqc_rating_fetched_at:    string | null
    service_types: { name: string } | null
  }
  type ProfileRow = {
    role: string
    organisation_id: string
    organisations: OrgRow | null
  }
  const { data: profile } = await supabase
    .from('users')
    .select(`
      role,
      organisation_id,
      organisations(
        name,
        cqc_location_id,
        cqc_location_name,
        cqc_rating,
        cqc_last_inspection_date,
        cqc_rating_fetched_at,
        service_types(name)
      )
    `)
    .eq('id', user!.id)
    .single() as { data: ProfileRow | null; error: unknown }

  const orgName = profile?.organisations?.name ?? '—'
  const org     = profile?.organisations
  const orgId   = profile?.organisation_id ?? ''
  const isAdmin = profile?.role === 'admin'

  // ── CQC data — show stored data immediately, refresh in background ────────
  let cqcRating:         CqcRating | null = (org?.cqc_rating as CqcRating) ?? null
  let cqcInspectionDate: string | null    = org?.cqc_last_inspection_date ?? null
  let cqcLocationName:   string | null    = org?.cqc_location_name ?? null

  if (org?.cqc_location_id && profile?.organisation_id) {
    const fetchedAt = org.cqc_rating_fetched_at ? new Date(org.cqc_rating_fetched_at) : null
    const isStale   = !fetchedAt || (Date.now() - fetchedAt.getTime()) > 24 * 60 * 60 * 1000

    if (isStale) {
      // Fire-and-forget: refresh runs AFTER the response is sent — never blocks render
      const locationId = org.cqc_location_id
      const orgIdToUpdate = profile.organisation_id
      after(async () => {
        try {
          const fresh = await fetchCqcLocation(locationId)
          if (fresh.status === 'found') {
            const admin = createAdminClient()
            await admin.from('organisations').update({
              cqc_location_name:        fresh.data.locationName,
              cqc_rating:               fresh.data.overallRating,
              cqc_last_inspection_date: fresh.data.lastInspectionDate,
              cqc_rating_fetched_at:    new Date().toISOString(),
            }).eq('id', orgIdToUpdate)
          }
          if (fresh.status === 'not_found') {
            console.warn('[dashboard] CQC refresh: location no longer on register', locationId)
          }
        } catch (err) {
          console.warn('[dashboard] CQC background refresh failed:', err)
        }
      })
    }
  }

  const cqcColours       = cqcRatingColours(cqcRating)
  const cqcDateFormatted = formatCqcDate(cqcInspectionDate)

  // ── Main data fetch — only what At a Glance needs ─────────────────────────
  const [
    { data: keyQuestions },
    { data: kloItems },
    { data: records },
    { count: openIncidentCount },
  ] = await Promise.all([
    supabase.from('key_questions').select('id, name, display_order').order('display_order'),
    supabase.from('klo_items').select('id, key_question_id'),
    supabase.from('compliance_records').select('*'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .in('status', ['open', 'under_review']),
  ])

  // ── Computations ──────────────────────────────────────────────────────────
  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )
  const allKlos = kloItems ?? []
  const allKqs  = keyQuestions ?? []

  const totalKlos     = allKlos.length
  const compliantKlos = allKlos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
  const overallPct    = pct(compliantKlos, totalKlos)

  const overallRag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
  for (const k of allKlos) overallRag[calculateRAG(recordByKloId.get(k.id), now)]++

  // Governance alerts (admin only)
  let overdueUnassignedCount = 0
  let neverStartedCount      = 0
  let overdueActionCount     = 0

  if (isAdmin) {
    for (const k of allKlos) {
      const rec = recordByKloId.get(k.id)
      const rag = calculateRAG(rec, now)
      if (rag === 'grey') neverStartedCount++
      if (rag === 'red' && !rec?.assigned_to) overdueUnassignedCount++
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overdueActions } = await (supabase as any)
      .from('action_items')
      .select('id')
      .eq('organisation_id', orgId)
      .in('status', ['open', 'in_progress', 'to_do'])
      .lt('due_date', now.toISOString().split('T')[0])
    overdueActionCount = (overdueActions ?? []).length
  }

  const governanceAlerts = isAdmin
    ? [
        overdueUnassignedCount > 0 && { count: overdueUnassignedCount, label: `overdue KLOE${overdueUnassignedCount !== 1 ? 's' : ''} with no assignee`, href: '/dashboard/daily-report', colour: 'red' as const },
        neverStartedCount > 0      && { count: neverStartedCount,      label: `KLOE${neverStartedCount !== 1 ? 's' : ''} never started`,                  href: '/dashboard/kloes',        colour: 'grey' as const },
        overdueActionCount > 0     && { count: overdueActionCount,     label: `overdue action item${overdueActionCount !== 1 ? 's' : ''}`,                 href: '/dashboard/kloes',        colour: 'amber' as const },
        (openIncidentCount ?? 0) > 0 && { count: openIncidentCount as number, label: `open incident${(openIncidentCount ?? 0) !== 1 ? 's' : ''} requiring review`, href: '/dashboard/incidents', colour: 'red' as const },
      ].filter(Boolean) as { count: number; label: string; href: string; colour: 'red' | 'amber' | 'grey' }[]
    : []

  // Team stats (admin only)
  type TeamMemberStats = { id: string; displayName: string; rag: Record<RAGStatus, number>; total: number }
  let teamStats: TeamMemberStats[] = []
  if (isAdmin) {
    const { data: orgUsers } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', profile!.organisation_id)
      .in('role', ['admin', 'user'])
      .order('full_name', { ascending: true })
    const assignedRecords = (records ?? []).filter(r => r.assigned_to)
    const recordsByAssignee = new Map<string, ComplianceRecord[]>()
    for (const r of assignedRecords) {
      if (!recordsByAssignee.has(r.assigned_to!)) recordsByAssignee.set(r.assigned_to!, [])
      recordsByAssignee.get(r.assigned_to!)!.push(r)
    }
    teamStats = (orgUsers ?? [])
      .filter(u => recordsByAssignee.has(u.id))
      .map(u => {
        const memberRecords = recordsByAssignee.get(u.id)!
        const rag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
        for (const r of memberRecords) rag[calculateRAG(r, now)]++
        return { id: u.id, displayName: u.full_name ?? u.email, rag, total: memberRecords.length }
      })
      .sort((a, b) => (b.rag.red + b.rag.grey) - (a.rag.red + a.rag.grey))
  }

  // Per-KQ stats
  type KqStats = { id: string; name: string; total: number; compliant: number; rag: Record<RAGStatus, number> }
  const kqStats: KqStats[] = allKqs.map(kq => {
    const kqKlos = allKlos.filter(k => k.key_question_id === kq.id)
    const rag: Record<RAGStatus, number> = { grey: 0, red: 0, amber: 0, green: 0 }
    let compliant = 0
    for (const k of kqKlos) {
      const rec = recordByKloId.get(k.id)
      if (isCompliant(rec, now)) compliant++
      rag[calculateRAG(rec, now)]++
    }
    return { id: kq.id, name: kq.name, total: kqKlos.length, compliant, rag }
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand">Inspection Readiness</h1>
          <p className="text-sm text-ink-dim mt-1">{orgName}</p>
        </div>
        <Link
          href="/dashboard/kloes"
          className="inline-flex items-center gap-2 bg-[#014D4E] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#013838] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 transition-colors"
        >
          View KLOE tracker →
        </Link>
      </div>

      {/* CQC Rating */}
      <section aria-label="Current CQC rating" className="mb-6">
        <div className="bg-card rounded-2xl border border-line p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cqcColours.bg }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Current CQC rating</p>
                {cqcRating ? (
                  <span className="inline-block text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cqcColours.bg, color: cqcColours.text }}>
                    {cqcRating}
                  </span>
                ) : (
                  <span className="text-sm text-ink-dim">Not yet rated</span>
                )}
              </div>
            </div>
            {cqcLocationName && (
              <div className="hidden sm:block border-l border-line pl-4 min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Registered name</p>
                <p className="text-sm text-ink font-medium truncate">{cqcLocationName}</p>
              </div>
            )}
            {cqcDateFormatted && (
              <div className="border-l border-line pl-4 min-w-0">
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-0.5">Last inspection</p>
                <p className="text-sm text-ink">{cqcDateFormatted}</p>
              </div>
            )}
            {org?.cqc_location_id && (
              <div className="ml-auto shrink-0">
                <a href={`https://www.cqc.org.uk/location/${org.cqc_location_id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-brand underline underline-offset-2 hover:text-[#013636] focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
                  View on CQC website →
                </a>
              </div>
            )}
          </div>
          {!org?.cqc_location_id && (
            <p className="text-sm text-ink-dim">
              No CQC Location ID recorded.{' '}
              <Link href="/dashboard/account" className="text-brand underline hover:text-[#013636]">Add it in your account settings</Link>{' '}
              to see your live CQC rating here.
            </p>
          )}
          <p className="text-sm text-ink-dim mt-3">
            Data sourced from the CQC public register, updated daily. AlwaysReady is not affiliated with or endorsed by the Care Quality Commission.
          </p>
        </div>
      </section>

      {/* Overall readiness */}
      <section aria-labelledby="overall-heading" className="mb-8">
        <div className="bg-card rounded-2xl border border-line p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="text-center sm:text-left shrink-0">
              <p className="text-4xl font-bold text-brand tabular-nums" aria-label={`${overallPct} percent overall readiness`}>
                {overallPct}<span className="text-2xl">%</span>
              </p>
              <p className="text-sm text-ink-dim mt-1">Overall readiness</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs text-ink-dim mb-1">
                <span>{compliantKlos} of {totalKlos} KLOEs up to date</span>
                <span>{overallPct}%</span>
              </div>
              <div className="w-full h-3 bg-fill-dim rounded-full overflow-hidden" role="progressbar" aria-label="Overall readiness" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all ${progressColour(overallPct)}`} style={{ width: `${overallPct}%` }} />
              </div>
              <p className="text-xs text-ink-dim mt-2 leading-relaxed">
                Up to date = status Completed and next review not yet overdue. This score reflects your own self-assessed inputs and does not predict your CQC inspection rating.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(['green', 'amber', 'red', 'grey'] as const).map(rag => (
                  <span key={rag} className="inline-flex items-center gap-1">
                    <RagBadge status={rag} compact />
                    <span className="text-sm font-semibold text-ink">{overallRag[rag]}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governance alerts */}
      {governanceAlerts.length > 0 && (
        <section aria-label="Governance alerts" className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-xl shrink-0" aria-hidden="true">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900 mb-2">Governance attention needed</p>
                <ul className="space-y-2">
                  {governanceAlerts.map((alert, i) => {
                    const dot = alert.colour === 'red' ? 'bg-red-500' : alert.colour === 'amber' ? 'bg-amber-500' : 'bg-gray-400'
                    return (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                        <span className="text-sm text-amber-900">
                          <strong>{alert.count}</strong> {alert.label} —{' '}
                          <Link href={alert.href} className="text-brand underline underline-offset-2 hover:text-[#013636]">review now</Link>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Per-KQ breakdown */}
      <section aria-labelledby="breakdown-heading" className="mb-8">
        <h2 id="breakdown-heading" className="text-lg font-bold text-brand mb-4">Breakdown by key question</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kqStats.map(kq => {
            const kqPct = pct(kq.compliant, kq.total)
            return (
              <div key={kq.id} className="bg-card rounded-xl border border-line p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-brand text-sm leading-tight">{kq.name}</h3>
                  <span className="text-2xl font-bold text-brand tabular-nums shrink-0">{kqPct}<span className="text-base">%</span></span>
                </div>
                <div className="w-full h-2 bg-fill-dim rounded-full overflow-hidden mb-3" role="progressbar" aria-label={`${kq.name} readiness`} aria-valuenow={kqPct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full rounded-full transition-all ${progressColour(kqPct)}`} style={{ width: `${kqPct}%` }} />
                </div>
                <p className="text-xs text-ink-dim mb-3">{kq.compliant} of {kq.total} KLOEs up to date</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(['green', 'amber', 'red', 'grey'] as const).filter(r => kq.rag[r] > 0).map(r => (
                    <span key={r} className="inline-flex items-center gap-1 text-xs">
                      <RagBadge status={r} compact />
                      <span className="font-medium text-ink">{kq.rag[r]}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-line">
                  <Link href="/dashboard/kloes" className="text-xs font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded">
                    View {kq.name} KLOEs →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Analytics — streams in after At a Glance */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsSectionServer
          orgId={orgId}
          records={records ?? []}
          kloItemIds={allKlos.map(k => k.id)}
          totalKlos={totalKlos}
        />
      </Suspense>

      {/* Team workload (admin only) */}
      {isAdmin && teamStats.length > 0 && (
        <section aria-labelledby="team-heading" className="mt-8">
          <h2 id="team-heading" className="text-lg font-bold text-brand mb-4">Team workload</h2>
          <TeamWorkloadTable members={teamStats} />
        </section>
      )}

    </div>
  )
}
