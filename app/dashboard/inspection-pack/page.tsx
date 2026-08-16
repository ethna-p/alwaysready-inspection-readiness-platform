/**
 * /dashboard/inspection-pack — Exportable Inspection Readiness Pack (Step 9)
 *
 * A print-optimised summary that an RCM can hand to an inspector or board
 * member. Uses the browser's built-in print-to-PDF — no PDF library needed.
 *
 * On screen:  breadcrumb + Print button + report preview
 * When printed: just the report (nav, header, footer, button hidden via CSS)
 *
 * Sort order within each KLOE detail table is controlled by URL search params:
 *   ?sort=title|status|rag|priority|last_review|date
 *   ?dir=asc|desc  (default asc; clicking the active column header toggles)
 *
 * Data sources: same tables as the Readiness Dashboard + Daily Report.
 * No new tables.
 */
import { Fragment, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG, RAG_LABELS, type RAGStatus } from '@/lib/rag'
import type { ComplianceRecord } from '@/lib/types'
import PrintButton from './print-button'
import KloeTableHeader, { type KloeDir, type SortColumnDef } from '../kloes/KloeTableHeader'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isCompliant(record: ComplianceRecord | null | undefined, now: Date): boolean {
  if (!record) return false
  return (
    record.status === 'completed' &&
    record.next_review_due !== null &&
    new Date(record.next_review_due) >= now
  )
}

function pctColour(pct: number): string {
  if (pct >= 80) return '#15803d' // green-700
  if (pct >= 50) return '#b45309' // amber-700
  return '#b91c1c'                // red-700
}

// ── Column definitions for the sortable KLOE detail header ───────────────────

const INSPECTION_PACK_COLUMNS: SortColumnDef[] = [
  { key: 'code',        label: 'Code',        classes: '' },
  { key: 'title',       label: 'KLOE',        classes: '' },
  { key: 'status',      label: 'Status',      classes: '' },
  { key: 'rag',         label: 'RAG',         classes: '' },
  { key: 'priority',    label: 'Priority',    classes: '' },
  { key: 'last_review', label: 'Last Review', classes: 'hidden sm:table-cell print:table-cell' },
  { key: 'date',        label: 'Next Due',    classes: 'hidden sm:table-cell print:table-cell' },
]

// ── Sort logic for KLOs within a key question group ───────────────────────────

const STATUS_SORT: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2 }
const RAG_SORT:   Record<string, number>  = { red: 0, amber: 1, green: 2, grey: 3 }

type KloRow = { id: string; title: string; displayOrder: number }

function sortPackKlos(
  klos: KloRow[],
  sort: string,
  dir: KloeDir,
  recordByKloId: Map<string, ComplianceRecord>,
  now: Date,
): KloRow[] {
  if (sort === 'default') return klos
  const m = dir === 'desc' ? -1 : 1
  return [...klos].sort((a, b) => {
    const recA = recordByKloId.get(a.id)
    const recB = recordByKloId.get(b.id)
    switch (sort) {
      case 'code':    return m * (a.displayOrder - b.displayOrder)
      case 'title':   return m * a.title.localeCompare(b.title)
      case 'status': {
        const sA = STATUS_SORT[recA?.status ?? 'not_started'] ?? 0
        const sB = STATUS_SORT[recB?.status ?? 'not_started'] ?? 0
        return m * (sA - sB)
      }
      case 'rag': {
        const rA = RAG_SORT[calculateRAG(recA, now)] ?? 99
        const rB = RAG_SORT[calculateRAG(recB, now)] ?? 99
        return m * (rA - rB)
      }
      case 'priority': {
        const pA = recA?.priority ?? 99
        const pB = recB?.priority ?? 99
        return m * (pA - pB)
      }
      case 'last_review': {
        const dA = recA?.date_reviewed ?? null
        const dB = recB?.date_reviewed ?? null
        if (!dA && !dB) return 0
        if (!dA) return m
        if (!dB) return -m
        return m * dA.localeCompare(dB)
      }
      case 'date': {
        const dA = recA?.next_review_due ?? null
        const dB = recB?.next_review_due ?? null
        if (!dA && !dB) return 0
        if (!dA) return m
        if (!dB) return -m
        return m * dA.localeCompare(dB)
      }
      default: return 0
    }
  })
}

function kloCode(kqName: string, displayOrder: number): string {
  return `${kqName.charAt(0).toUpperCase()}${displayOrder}`
}

/** Status text without a coloured background (reliable in print) */
function statusLabel(status: string | null): string {
  if (status === 'completed')  return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  return 'Not Started'
}

/** Coloured dot character + label for print-safe RAG display */
function RagCell({ status }: { status: RAGStatus }) {
  const colours: Record<RAGStatus, string> = {
    grey:  '#9ca3af',
    red:   '#dc2626',
    amber: '#d97706',
    green: '#16a34a',
  }
  return (
    <span style={{ color: colours[status] }} className="font-medium whitespace-nowrap">
      ● {RAG_LABELS[status]}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function InspectionPackPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>
}) {
  const { sort: sortParam, dir: dirParam } = await searchParams

  const VALID_SORTS = ['code', 'title', 'status', 'rag', 'priority', 'last_review', 'date']
  const sort = VALID_SORTS.includes(sortParam ?? '') ? (sortParam as string) : 'default'
  const dir: KloeDir = dirParam === 'desc' ? 'desc' : 'asc'
  const supabase = await createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()

  // Organisation name (two-step — safest given RLS on organisations)
  const { data: userRow } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user!.id)
    .single()

  const { data: orgRow } = await supabase
    .from('organisations')
    .select('name, logo_url')
    .eq('id', userRow?.organisation_id ?? '')
    .single()

  const orgName   = orgRow?.name     ?? 'Your Organisation'
  const orgLogoUrl = orgRow?.logo_url ?? null

  // Core data
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name').order('display_order'),
      supabase.from('klo_items').select('id, title, key_question_id, display_order').order('display_order'),
      supabase.from('compliance_records').select('*'),
    ])

  const now = new Date()
  const generatedDate = formatDate(now.toISOString())

  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )

  // Per-key-question aggregates
  type KqSummary = {
    id: string
    name: string
    klos: { id: string; title: string; displayOrder: number }[]
    compliant: number
    total: number
    pct: number
  }

  const kqSummaries: KqSummary[] = (keyQuestions ?? []).map(kq => {
    const klos = (kloItems ?? [])
      .filter(k => k.key_question_id === kq.id)
      .map(k => ({ id: k.id, title: k.title, displayOrder: k.display_order }))
    const compliant = klos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
    return {
      id: kq.id,
      name: kq.name,
      klos,
      compliant,
      total: klos.length,
      pct: klos.length > 0 ? Math.round((compliant / klos.length) * 100) : 0,
    }
  })

  const totalKlos = kqSummaries.reduce((a, b) => a + b.total, 0)
  const totalCompliant = kqSummaries.reduce((a, b) => a + b.compliant, 0)
  const overallPct = totalKlos > 0 ? Math.round((totalCompliant / totalKlos) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print-specific CSS — hoisted to <head> by React */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 15mm 15mm 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      {/* ── Screen-only controls ─────────────────────────────────────────── */}
      <div className="print:hidden">
        <nav className="text-sm text-ink-dim mb-2" aria-label="Breadcrumb">
          <ol className="flex gap-1">
            <li>
              <Link href="/dashboard" className="hover:text-brand underline">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink" aria-current="page">
              Inspection Pack
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand">Inspection Pack</h1>
            <p className="text-sm text-ink-dim mt-1">
              A printable snapshot of your current readiness to share with an
              inspector or board member.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrintButton />
          </div>
        </div>

        <p className="text-xs text-ink-dim mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 leading-relaxed">
          <strong className="text-amber-900">Please note:</strong> This pack is a self-compiled summary of the records your team has entered into AlwaysReady. It is not a certification of compliance, an audit report, or an assessment of your readiness for inspection. Your organisation is solely responsible for the accuracy and completeness of the information it contains.
        </p>
      </div>

      {/* ── Report (visible on screen and in print) ──────────────────────── */}
      <div className="bg-card rounded-2xl border border-line p-8 print:border-0 print:rounded-none print:p-0 print:shadow-none">

        {/* Report header — visible on screen and in print */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#014D4E]">
          <div className="flex items-center gap-4">
            {orgLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={`${orgName} logo`}
                style={{ height: '48px', maxWidth: '160px', width: 'auto', objectFit: 'contain' }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-brand">CQC Inspection Readiness Pack</h2>
              <p className="text-sm font-semibold text-ink mt-0.5">{orgName}</p>
            </div>
          </div>
          <div className="text-right text-xs text-ink-dim shrink-0">
            <p>Prepared: {generatedDate}</p>
            <p className="mt-1">alwaysready.uk</p>
          </div>
        </div>

        {/* ── Overall readiness ─────────────────────────────────────────── */}
        <section aria-labelledby="overall-heading" className="mb-8">
          <div className="flex flex-wrap items-center gap-8">
            {/* Big % */}
            <div className="text-center">
              <div
                className="text-3xl font-bold leading-none"
                style={{ color: pctColour(overallPct) }}
                aria-label={`Overall readiness ${overallPct} percent`}
              >
                {overallPct}%
              </div>
              <div className="text-xs text-ink-dim mt-2 uppercase tracking-wide font-medium">
                Overall readiness
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 min-w-[200px]">
              <div
                className="w-full bg-fill-dim rounded-full h-4 overflow-hidden"
                role="progressbar"
                aria-valuenow={overallPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${overallPct}% of KLOEs are up to date`}
              >
                <div
                  className="h-4 rounded-full transition-all"
                  style={{
                    width: `${overallPct}%`,
                    backgroundColor: pctColour(overallPct),
                  }}
                />
              </div>
              <p className="text-sm text-ink-dim mt-2">
                {totalCompliant} of {totalKlos} KLOEs currently up to date
              </p>
            </div>
          </div>
        </section>

        {/* ── Summary by key question ───────────────────────────────────── */}
        <section aria-labelledby="summary-heading" className="mb-8">
          <h2
            id="summary-heading"
            className="text-xs font-bold text-brand uppercase tracking-widest mb-3"
          >
            Summary by Key Question
          </h2>

          <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm border border-line rounded-lg overflow-hidden print:border print:border-line">
            <thead>
              <tr className="bg-[#014D4E] text-white">
                <th scope="col" className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Key Question
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Ready
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Total
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  %
                </th>
                <th scope="col" className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kqSummaries.map(kq => (
                <tr key={kq.id} className="hover:bg-fill print:hover:bg-transparent">
                  <td className="px-4 py-2.5 font-medium text-ink">{kq.name}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums">{kq.compliant}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-ink-dim">{kq.total}</td>
                  <td
                    className="px-4 py-2.5 text-center font-bold tabular-nums"
                    style={{ color: pctColour(kq.pct) }}
                  >
                    {kq.pct}%
                  </td>
                  <td className="px-4 py-2.5">
                    <div
                      className="w-full bg-fill-dim rounded-full h-2"
                      role="presentation"
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${kq.pct}%`,
                          backgroundColor: pctColour(kq.pct),
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        {/* ── Full KLOE detail — one section per key question ───────────── */}
        <div>
          <h2 className="text-xs font-bold text-brand uppercase tracking-widest mb-4">
            Full KLOE Detail
          </h2>

          {kqSummaries.map((kq, kqIndex) => {
            const sortedKlos = sortPackKlos(kq.klos, sort, dir, recordByKloId, now)
            return (
            <section
              key={kq.id}
              aria-labelledby={`kq-${kq.id}-heading`}
              className={kqIndex > 0 ? 'mt-8 print:break-before-page' : 'mt-0'}
            >
              {/* Key question heading */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#014D4E]">
                <h3
                  id={`kq-${kq.id}-heading`}
                  className="font-bold text-brand text-base"
                >
                  {kq.name}
                </h3>
                <span
                  className="text-sm font-bold"
                  style={{ color: pctColour(kq.pct) }}
                >
                  {kq.pct}% ready ({kq.compliant}/{kq.total})
                </span>
              </div>

              {/* KLOE table */}
              <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm table-fixed border border-line print:border-line">
                <colgroup>
                  <col className="w-14" />                                   {/* Code      56px */}
                  <col className="w-72" />                                   {/* KLOE     288px */}
                  <col className="w-32" />                                   {/* Status   128px */}
                  <col className="w-36" />                                   {/* RAG      144px */}
                  <col className="w-20" />                                   {/* Priority  80px */}
                  <col className="hidden sm:table-column w-32 print:table-column" />  {/* Last Review 128px */}
                  <col className="hidden sm:table-column w-32 print:table-column" />  {/* Next Due    128px */}
                </colgroup>
                {/* Suspense needed: useSearchParams() inside KloeTableHeader requires a client boundary */}
                <Suspense fallback={
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
                      {['Code','KLOE','Status','RAG','Priority','Last Review','Next Due'].map(h => (
                        <th key={h} scope="col" className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                }>
                  <KloeTableHeader sort={sort} dir={dir} columns={INSPECTION_PACK_COLUMNS} hasTrailingTh={false} />
                </Suspense>
                <tbody className="divide-y divide-gray-50">
                  {sortedKlos.map(klo => {
                    const record = recordByKloId.get(klo.id)
                    const rag = calculateRAG(record, now)
                    const compliant = isCompliant(record, now)
                    const code = kloCode(kq.name, klo.displayOrder)

                    return (
                      <Fragment key={klo.id}>
                        <tr className={`hover:bg-canvas transition-colors ${compliant ? 'print:bg-transparent' : ''}`}>
                          <td className="px-4 py-3 font-bold text-brand align-top">
                            {code}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink align-top">
                            {klo.title}
                          </td>
                          <td className="px-4 py-3 text-ink align-top">
                            {statusLabel(record?.status ?? null)}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <RagCell status={rag} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            {record?.priority
                              ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold">{record.priority}</span>
                              : <span className="text-ink-dim">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-ink-dim align-top hidden sm:table-cell print:table-cell">
                            {formatDateShort(record?.date_reviewed)}
                          </td>
                          <td
                            className={`px-4 py-3 align-top hidden sm:table-cell print:table-cell font-medium ${
                              rag === 'red' ? 'text-red-700' : 'text-ink-dim'
                            }`}
                          >
                            {formatDateShort(record?.next_review_due)}
                          </td>
                        </tr>
                        {/* Evidence location sub-row — only if present */}
                        {record?.evidence_location && (
                          <tr className="border-t-0">
                            <td />
                            <td colSpan={6} className="px-4 pb-3 text-ink-dim text-xs">
                              Evidence: {record.evidence_location}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </section>
          )
          })}
        </div>

        {/* ── Print footer — disclaimer (hidden on screen; SiteFooter covers it) */}
        <div className="hidden print:block mt-10 pt-6 border-t border-line text-xs text-ink-dim space-y-2">
          <p className="font-semibold text-ink-dim">Important notice</p>
          <p>
            This pack is a self-compiled summary of the records entered into AlwaysReady by your team.
            It is not a certification of compliance, an independent audit, or an assessment of readiness for CQC inspection.
            Your organisation is solely responsible for the accuracy and completeness of the information it contains.
            AlwaysReady does not guarantee any particular CQC inspection outcome.
          </p>
          <p>
            © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services |
            82A James Carter Road, Mildenhall, IP28 7DE
          </p>
        </div>

      </div>
    </>
  )
}
