/**
 * Upload evidence to a KLOE -> confirm attachment + virus-scan gate behavior.
 *
 * What this covers, genuinely, end to end through the real UI and the real
 * /api/upload-evidence route (app/api/upload-evidence/route.ts):
 *
 *   1. MIME-type gate (validateFileMime, lib/utils/upload.ts) -- a file
 *      whose real bytes don't match any allowed type is rejected, even when
 *      it's named and presented as a .pdf. Magic-byte inspection, not
 *      extension trust: setInputFiles bypasses the browser's own file-picker
 *      accept filter entirely (exactly what a malicious or just-wrong client
 *      could do), so this is a genuine test of the server-side check, not
 *      the client-side accept="" attribute.
 *
 *   2. The real happy path -- a genuinely clean PDF (verified real magic
 *      bytes) passes MIME validation, passes a REAL Cloudmersive scan (this
 *      environment now has a working CLOUDMERSIVE_API_KEY -- added
 *      2026-09-12, see .env.local), uploads to Storage, gets recorded in
 *      kloe_evidence, and appears in the list with the "Scanned for
 *      viruses" badge.
 *
 *   3. The scan can't be bypassed through a second door -- storage RLS on
 *      the 'evidence' bucket used to let any authenticated org member
 *      INSERT directly via the client SDK, skipping /api/upload-evidence
 *      (and its MAX_SIZE_BYTES/validateFileMime/scanWithCloudmersive checks)
 *      entirely; a file uploaded that way would still get recorded and
 *      served as "verified clean" to colleagues. Closed in
 *      supabase/migrations/20260911000003_close_evidence_scan_bypass.sql.
 *      Confirmed genuinely applied and effective on preview here (not just
 *      "the migration file exists") -- a real authenticated session, using
 *      the same anon key and Storage SDK a real browser client would, gets
 *      a 403 row-level-security rejection attempting the exact same direct
 *      upload the fix's own migration comment describes.
 *
 * Fail-closed behavior when the scanner is unreachable/unconfigured
 * (scanWithCloudmersive's other branch) was verified live in this exact
 * suite before the API key above was added — see commit b805480 — and
 * isn't re-tested here now that a real key is configured; genuinely
 * re-exercising it live would mean unsetting the key mid-run, which isn't
 * practical against one shared webServer instance. The code path itself
 * (lib/utils/upload.ts) is unchanged since then.
 *
 * Not covered, and likely not practically coverable here: a file that is
 * BOTH a well-formed member of an allowed type AND actually trips the
 * scanner. Confirmed directly against the real API: Cloudmersive's EICAR
 * test-signature detection requires the signature at byte offset 0 with
 * nothing before it (any leading bytes at all -- even a single one --
 * silently defeat detection), which structurally conflicts with every
 * allowed type's own magic-byte requirement also needing offset 0
 * (%PDF-, PK\x03\x04 for docx/xlsx, JPEG/PNG headers). There's no
 * allowed-type file that can satisfy both simultaneously by construction.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { loadEnvLocal } from './support/env'

// Detected by file-type as `application/pdf` (verified directly against the
// same package this app uses) -- genuine magic bytes, not just a .pdf name.
const VALID_PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n' +
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n' +
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
  'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n0\n%%EOF'
)

// file-type returns `undefined` for this -- no recognisable signature at all,
// despite the .pdf name and extension.
const FAKE_PDF_BYTES = Buffer.from(
  'This is not actually a PDF, just plain text pretending to be one.'
)

test('KLOE evidence upload: MIME gate, real clean-file happy path, storage RLS scan bypass stays closed', async ({ page }) => {
  const account = loadTestAccount()

  const admin = getAdminClient()
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id')
    .order('display_order')
    .range(1, 1) // a different KLOE than kloe-rating.spec.ts touches, so this test's assertions never depend on that spec's state
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(1)
  const kloId = kloItems![0].id

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto(`/dashboard/kloes/${kloId}`)

  await expect(page.getByText('No files uploaded yet.')).toBeVisible()

  // ── MIME gate: real bytes don't match any allowed type ──────────────────
  await page.getByLabel('Upload evidence file').setInputFiles({
    name: 'fake.pdf',
    mimeType: 'application/pdf',
    buffer: FAKE_PDF_BYTES,
  })

  await expect(page.getByText('File type not accepted')).toBeVisible()
  await expect(page.getByText('No files uploaded yet.')).toBeVisible()

  const { data: evidenceRowsAfterMimeReject } = await admin
    .from('kloe_evidence')
    .select('id')
    .eq('klo_item_id', kloId)
  expect(evidenceRowsAfterMimeReject).toEqual([])

  // ── The real happy path: a genuinely clean PDF goes all the way through ──
  await page.getByLabel('Upload evidence file').setInputFiles({
    name: 'genuine-evidence.pdf',
    mimeType: 'application/pdf',
    buffer: VALID_PDF_BYTES,
  })

  const fileRow = page.locator('li', { hasText: 'genuine-evidence.pdf' })
  await expect(fileRow).toBeVisible()
  await expect(fileRow.getByText('Scanned for viruses')).toBeVisible()
  await expect(page.getByText('No files uploaded yet.')).not.toBeVisible()

  const { data: evidenceRowsAfterSuccess } = await admin
    .from('kloe_evidence')
    .select('id, file_name, scan_status, klo_item_id')
    .eq('klo_item_id', kloId)
  expect(evidenceRowsAfterSuccess).toHaveLength(1)
  expect(evidenceRowsAfterSuccess![0].file_name).toBe('genuine-evidence.pdf')
  expect(evidenceRowsAfterSuccess![0].scan_status).toBe('clean')

  // ── The scan gate has no second, unscanned door ─────────────────────────
  // A real authenticated session, using the anon key and Storage SDK a real
  // browser client would use — not the admin/service-role client — attempts
  // the exact direct-to-bucket upload the 2026-09-11 fix closed.
  const env = loadEnvLocal()
  const anon = createClient(env.SUPABASE_PREVIEW_URL, env.SUPABASE_PREVIEW_ANON_KEY)
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  expect(signInError).toBeNull()

  const bypassPath = `${account.orgId}/rls-bypass-check-${Date.now()}.pdf`
  const { error: bypassUploadError } = await anon.storage
    .from('evidence')
    .upload(bypassPath, new Blob([VALID_PDF_BYTES], { type: 'application/pdf' }))

  expect(bypassUploadError).not.toBeNull()
  expect((bypassUploadError as { statusCode?: string } | null)?.statusCode).toBe('403')

  // Belt and braces: confirm nothing landed in storage even if the above
  // assertion is ever loosened by a future edit — list the exact path.
  const { data: bypassListing } = await admin.storage
    .from('evidence')
    .list(account.orgId, { search: `rls-bypass-check-` })
  expect(bypassListing ?? []).toEqual([])
})
