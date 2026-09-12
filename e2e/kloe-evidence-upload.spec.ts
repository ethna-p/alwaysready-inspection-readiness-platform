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
 *   2. Virus-scan gate (scanWithCloudmersive, lib/utils/upload.ts) -- fails
 *      CLOSED. This environment has no CLOUDMERSIVE_API_KEY configured (not
 *      in .env.local, not passed through playwright.config.ts's webServer
 *      env), which is exactly the condition that function is built to fail
 *      safe on rather than silently accept the file. A real, valid PDF
 *      (genuine %PDF- magic bytes, passes the MIME gate) still gets
 *      rejected here, with the exact fail-closed message the code returns.
 *
 * What this does NOT cover, and can't without a real Cloudmersive API key
 * in this environment: a clean file actually completing the full pipeline
 * and appearing in the evidence list. That's a real gap in this walkthrough
 * -- flagged to the user rather than faked (e.g. by stubbing the scanner),
 * since faking it would mean this suite could never again independently
 * confirm the scan step is genuinely wired up in production.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

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

test('KLOE evidence upload rejects a mistyped file and fails closed with no virus scanner configured', async ({ page }) => {
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

  // ── Virus-scan gate: genuine PDF, but the scanner isn't configured here,
  // and the app must fail closed rather than accept it anyway ─────────────
  await page.getByLabel('Upload evidence file').setInputFiles({
    name: 'genuine.pdf',
    mimeType: 'application/pdf',
    buffer: VALID_PDF_BYTES,
  })

  await expect(page.getByText('File scanning is unavailable')).toBeVisible()
  await expect(page.getByText('No files uploaded yet.')).toBeVisible()

  // Neither attempt should have left anything in Storage or the DB — confirm
  // directly, not just that the UI list stayed empty (the UI adds files
  // optimistically on success, so an empty UI list alone wouldn't catch a
  // scenario where the server accepted the file but the client-side list
  // update failed for some unrelated reason).
  const { data: evidenceRows } = await admin
    .from('kloe_evidence')
    .select('id')
    .eq('klo_item_id', kloId)
  expect(evidenceRows).toEqual([])
})
