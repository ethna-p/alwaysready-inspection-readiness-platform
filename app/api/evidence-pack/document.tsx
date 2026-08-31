/**
 * CQC Evidence Pack — PDF Document
 *
 * Rendered server-side via @react-pdf/renderer. Structures all KLOE
 * compliance records against CQC's six evidence categories, producing
 * an inspection-ready document for the provider.
 *
 * Do NOT add 'use client' — this file is server-only.
 *
 * react/no-unescaped-entities is disabled file-wide: react-pdf <Text> elements
 * do not parse HTML entities, so &apos; etc. must not be used here.
 */
/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import { EVIDENCE_CATEGORIES } from '@/lib/evidence-categories'
import type { RAGStatus } from '@/lib/rag'
import { RAG_LABELS } from '@/lib/rag'

// ── Data types ────────────────────────────────────────────────────────────────

export type KloeRow = {
  id: string
  title: string
  keyQuestion: string
  ragStatus: RAGStatus
  complianceStatus: 'not_started' | 'in_progress' | 'completed' | null
  lastReviewed: string | null
  nextReviewDue: string | null
  evidenceLocation: string | null
  notes: string | null
  evidenceFiles: { fileName: string; uploadedAt: string }[]
}

export type EvidencePackDocumentProps = {
  orgName: string
  cqcLocationId: string | null
  cqcRegisteredName: string | null
  cqcRating: string | null
  serviceType: string | null
  generatedAt: string
  kloesByCategory: Record<string, KloeRow[]>   // key = EvidenceCategoryId
}

// ── Styles ────────────────────────────────────────────────────────────────────

const TEAL   = '#014D4E'
const WHITE  = '#ffffff'
const LIGHT  = '#f3f4f6'
const MUTED  = '#4b5563'   // darkened from #6b7280 for accessibility
const LABEL  = '#6b7280'   // small uppercase labels and footer — intentionally lighter
const DARK   = '#1a1a1a'
const BORDER = '#e5e7eb'

const RAG_COLOURS: Record<RAGStatus, { bg: string; text: string; label: string }> = {
  green: { bg: '#16a34a', text: WHITE,   label: 'Up to Date'  },
  amber: { bg: '#d97706', text: WHITE,   label: 'Due Soon'    },
  red:   { bg: '#dc2626', text: WHITE,   label: 'Overdue'     },
  grey:  { bg: '#9ca3af', text: WHITE,   label: 'Unassessed'  },
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed:   'Completed',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },

  // Cover
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: TEAL,
  },
  coverHeader: {
    backgroundColor: TEAL,
    paddingTop: 64,
    paddingHorizontal: 48,
    paddingBottom: 40,
  },
  coverBrand: {
    fontSize: 11,
    color: '#80cbc4',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    fontSize: 12,
    color: '#b2dfdb',
    marginBottom: 48,
  },
  coverBody: {
    backgroundColor: WHITE,
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  coverMeta: {
    marginBottom: 32,
  },
  coverMetaLabel: {
    fontSize: 8,
    color: LABEL,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 16,
  },
  coverMetaRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  coverMetaCol: {
    flex: 1,
  },
  coverMetaSmallLabel: {
    fontSize: 8,
    color: LABEL,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  coverMetaSmallValue: {
    fontSize: 10,
    color: DARK,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  coverDisclaimer: {
    marginTop: 'auto',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.5,
  },

  // Section header
  sectionHeader: {
    backgroundColor: TEAL,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  sectionCategoryLabel: {
    fontSize: 7,
    color: '#80cbc4',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    lineHeight: 1.2,
  },
  sectionDescription: {
    fontSize: 8.5,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 16,
  },

  // KLOE card
  kloeCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  kloeCardHeader: {
    backgroundColor: LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kloeCardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  kloeTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 2,
  },
  kloeKeyQuestion: {
    fontSize: 7.5,
    color: MUTED,
  },
  kloeCardHeaderRight: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    flexShrink: 0,
  },
  ragBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ragBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  statusBadgeText: {
    fontSize: 7.5,
    color: '#374151',
  },

  kloeCardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  kloeRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  kloeCol: {
    flex: 1,
  },
  kloeFieldLabel: {
    fontSize: 7,
    color: LABEL,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  kloeFieldValue: {
    fontSize: 8.5,
    color: DARK,
    lineHeight: 1.4,
  },
  kloeFieldEmpty: {
    fontSize: 8.5,
    color: MUTED,
    fontStyle: 'normal',
  },

  // Evidence files
  filesList: {
    marginTop: 2,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  fileDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TEAL,
    marginRight: 6,
    marginTop: 1,
  },
  fileText: {
    fontSize: 8,
    color: DARK,
  },

  // Summary table
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: TEAL,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  col1: { width: '32%' },
  col2: { width: '18%' },
  col3: { width: '14%' },
  col4: { width: '18%' },
  col5: { width: '18%' },

  // Page footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: LABEL,
  },

  // Page number
  pageNumber: {
    fontSize: 7,
    color: LABEL,
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function cqcRatingBg(rating: string | null): string {
  switch (rating?.toLowerCase()) {
    case 'outstanding':         return '#003087'
    case 'good':                return '#4a7c2f'
    case 'requires improvement': return '#f4a83a'
    case 'inadequate':          return '#9e2311'
    default:                    return '#9ca3af'
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageFooter({ orgName, generatedAt }: { orgName: string; generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{orgName} — CQC Evidence Pack — Generated {generatedAt}</Text>
      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function KloeCard({ kloe }: { kloe: KloeRow }) {
  const rag = RAG_COLOURS[kloe.ragStatus]
  return (
    <View style={s.kloeCard} wrap={false}>
      <View style={s.kloeCardHeader}>
        <View style={s.kloeCardHeaderLeft}>
          <Text style={s.kloeTitle}>{kloe.title}</Text>
          <Text style={s.kloeKeyQuestion}>{kloe.keyQuestion}</Text>
        </View>
        <View style={s.kloeCardHeaderRight}>
          <View style={[s.ragBadge, { backgroundColor: rag.bg }]}>
            <Text style={s.ragBadgeText}>{rag.label}</Text>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>
              {kloe.complianceStatus ? STATUS_LABELS[kloe.complianceStatus] : 'Not started'}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.kloeCardBody}>
        <View style={s.kloeRow}>
          <View style={s.kloeCol}>
            <Text style={s.kloeFieldLabel}>Last Reviewed</Text>
            <Text style={kloe.lastReviewed ? s.kloeFieldValue : s.kloeFieldEmpty}>
              {kloe.lastReviewed ? formatDate(kloe.lastReviewed) : 'Not reviewed'}
            </Text>
          </View>
          <View style={s.kloeCol}>
            <Text style={s.kloeFieldLabel}>Next Review Due</Text>
            <Text style={kloe.nextReviewDue ? s.kloeFieldValue : s.kloeFieldEmpty}>
              {kloe.nextReviewDue ? formatDate(kloe.nextReviewDue) : '—'}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={s.kloeFieldLabel}>Evidence Location</Text>
          <Text style={kloe.evidenceLocation ? s.kloeFieldValue : s.kloeFieldEmpty}>
            {kloe.evidenceLocation || 'No evidence location recorded'}
          </Text>
        </View>

        {kloe.notes ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.kloeFieldLabel}>Notes</Text>
            <Text style={s.kloeFieldValue}>{kloe.notes}</Text>
          </View>
        ) : null}

        <View>
          <Text style={s.kloeFieldLabel}>
            Uploaded Evidence ({kloe.evidenceFiles.length} file{kloe.evidenceFiles.length !== 1 ? 's' : ''})
          </Text>
          {kloe.evidenceFiles.length > 0 ? (
            <View style={s.filesList}>
              {kloe.evidenceFiles.map((f, i) => (
                <View key={i} style={s.fileItem}>
                  <View style={s.fileDot} />
                  <Text style={s.fileText}>{f.fileName}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.kloeFieldEmpty}>No files uploaded</Text>
          )}
        </View>
      </View>
    </View>
  )
}

// ── Main document ─────────────────────────────────────────────────────────────

export function EvidencePackDocument({
  orgName,
  cqcLocationId,
  cqcRegisteredName,
  cqcRating,
  serviceType,
  generatedAt,
  kloesByCategory,
}: EvidencePackDocumentProps) {
  const allKloes = EVIDENCE_CATEGORIES.flatMap(cat => kloesByCategory[cat.id] ?? [])

  return (
    <Document
      title={`CQC Evidence Pack — ${orgName}`}
      author="AlwaysReady"
      subject="CQC Inspection Readiness Evidence Pack"
      creator="AlwaysReady"
    >
      {/* ── Cover page ──────────────────────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverHeader}>
          <Text style={s.coverBrand}>AlwaysReady</Text>
          <Text style={s.coverTitle}>CQC Evidence Pack</Text>
          <Text style={s.coverSubtitle}>Inspection Readiness Evidence — Structured by CQC Evidence Category</Text>
        </View>

        <View style={s.coverBody}>
          <View style={s.coverMeta}>
            <Text style={s.coverMetaLabel}>Service name</Text>
            <Text style={s.coverMetaValue}>{orgName}</Text>
          </View>

          <View style={s.coverMetaRow}>
            {cqcRegisteredName && cqcRegisteredName !== orgName && (
              <View style={s.coverMetaCol}>
                <Text style={s.coverMetaSmallLabel}>CQC Registered Name</Text>
                <Text style={s.coverMetaSmallValue}>{cqcRegisteredName}</Text>
              </View>
            )}
            {cqcLocationId && (
              <View style={s.coverMetaCol}>
                <Text style={s.coverMetaSmallLabel}>CQC Location ID</Text>
                <Text style={s.coverMetaSmallValue}>{cqcLocationId}</Text>
              </View>
            )}
            {serviceType && (
              <View style={s.coverMetaCol}>
                <Text style={s.coverMetaSmallLabel}>Service Type</Text>
                <Text style={s.coverMetaSmallValue}>{serviceType}</Text>
              </View>
            )}
          </View>

          {cqcRating && (
            <View style={{ marginBottom: 24 }}>
              <Text style={s.coverMetaSmallLabel}>Current CQC Rating</Text>
              <View style={[s.ratingBadge, { backgroundColor: cqcRatingBg(cqcRating) }]}>
                <Text style={s.ratingBadgeText}>{cqcRating}</Text>
              </View>
            </View>
          )}

          <View style={{ marginBottom: 0 }}>
            <Text style={s.coverMetaSmallLabel}>Generated</Text>
            <Text style={s.coverMetaSmallValue}>{generatedAt}</Text>
          </View>

          <Text style={s.coverDisclaimer}>
            This pack contains the compliance evidence recorded by {orgName} in AlwaysReady as at the date above.
            It reflects the service's own self-assessed compliance position and evidence record against the CQC
            KLOE framework, structured by CQC's six evidence categories. It does not represent the view of the
            Care Quality Commission and does not guarantee any particular inspection outcome.{'\n'}
            AlwaysReady is not affiliated with or endorsed by the Care Quality Commission.
          </Text>
        </View>
      </Page>

      {/* ── Six evidence category sections ──────────────────────────────── */}
      {EVIDENCE_CATEGORIES.map(cat => {
        const kloes = kloesByCategory[cat.id] ?? []
        return (
          <Page key={cat.id} size="A4" style={s.page}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionCategoryLabel}>Evidence Category</Text>
              <Text style={s.sectionTitle}>{cat.label}</Text>
            </View>

            <Text style={s.sectionDescription}>{cat.description}</Text>

            {kloes.length === 0 ? (
              <Text style={[s.kloeFieldEmpty, { marginTop: 8 }]}>
                No KLOEs mapped to this category.
              </Text>
            ) : (
              kloes.map(kloe => <KloeCard key={kloe.id} kloe={kloe} />)
            )}

            <PageFooter orgName={orgName} generatedAt={generatedAt} />
          </Page>
        )
      })}

      {/* ── Summary table ────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionCategoryLabel}>AlwaysReady</Text>
          <Text style={s.sectionTitle}>Compliance Summary — All 24 KLOEs</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.col1]}>KLOE</Text>
            <Text style={[s.tableHeaderCell, s.col2]}>Key Question</Text>
            <Text style={[s.tableHeaderCell, s.col3]}>Status</Text>
            <Text style={[s.tableHeaderCell, s.col4]}>Last Reviewed</Text>
            <Text style={[s.tableHeaderCell, s.col5]}>Next Due</Text>
          </View>

          {allKloes.map((kloe, i) => {
            const rag = RAG_COLOURS[kloe.ragStatus]
            return (
              <View key={kloe.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
                <Text style={[s.tableCell, s.col1]}>{kloe.title}</Text>
                <Text style={[s.tableCell, s.col2]}>{kloe.keyQuestion}</Text>
                <View style={s.col3}>
                  <View style={[s.ragBadge, { backgroundColor: rag.bg }]}>
                    <Text style={s.ragBadgeText}>{rag.label}</Text>
                  </View>
                </View>
                <Text style={[s.tableCell, s.col4]}>{formatDate(kloe.lastReviewed)}</Text>
                <Text style={[s.tableCell, s.col5]}>{formatDate(kloe.nextReviewDue)}</Text>
              </View>
            )
          })}
        </View>

        <PageFooter orgName={orgName} generatedAt={generatedAt} />
      </Page>
    </Document>
  )
}
