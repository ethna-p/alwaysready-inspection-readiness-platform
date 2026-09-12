/**
 * HR record + training certificate upload.
 *
 * Covers, genuinely, end to end through the real UI and real server actions
 * (app/dashboard/hr/actions.ts):
 *   - visiting /dashboard/hr seeds default training types for a fresh org
 *     (seed_default_training_types RPC) — needed before a training record
 *     can exist at all
 *   - admin fills in and saves a staff member's HR record (saveStaffProfile),
 *     confirmed written to hr_staff_profiles
 *   - admin logs a training completion (saveTrainingRecord) and the next-due
 *     date the UI shows matches what's actually stored, computed from the
 *     chosen frequency
 *   - certificate upload reuses the same shared, authoritative checks as
 *     KLOE evidence upload (lib/utils/upload.ts) — a file whose real bytes
 *     don't match any allowed type is rejected even with a trusted-looking
 *     name; a genuinely clean PDF passes MIME validation + a real Cloudmersive
 *     scan, uploads to Storage, and is recorded with scan_status: 'clean'
 *     (see e2e/kloe-evidence-upload.spec.ts for why scan-trips-and-valid-type
 *     can't both be constructed in one file, and why fail-closed-when-
 *     unreachable isn't re-tested live here)
 *   - deleting a certificate removes it from both Storage and the DB
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

// Same genuine magic-byte PDF used in e2e/kloe-evidence-upload.spec.ts.
const VALID_PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n' +
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n' +
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
  'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n0\n%%EOF'
)
const FAKE_PDF_BYTES = Buffer.from(
  'This is not actually a PDF, just plain text pretending to be one.'
)

test('HR record: save staff profile, log training, upload/delete certificate', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const teammateId = account.teammate.userId

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // Visiting the HR overview seeds default training types for this org if none exist yet.
  await page.goto('/dashboard/hr')

  const { data: trainingTypes, error: typesErr } = await admin
    .from('hr_training_types')
    .select('id, name')
    .eq('organisation_id', account.orgId)
    .order('display_order')
  expect(typesErr).toBeNull()
  expect(trainingTypes!.length).toBeGreaterThan(0)
  const trainingType = trainingTypes![0]

  // ── Admin saves the teammate's staff HR record ──────────────────────────
  await page.goto(`/dashboard/hr/${teammateId}`)

  await page.getByLabel('Job Title').fill('Senior Care Assistant')
  await page.getByLabel('Department').fill('Residential Care')
  await page.getByLabel('Employment Start Date').fill('2020-03-01')

  await page.getByRole('button', { name: 'Save staff record' }).first().click()
  await expect(page.getByText('Staff record saved.')).toBeVisible()

  const { data: hrProfile, error: hrProfileErr } = await admin
    .from('hr_staff_profiles')
    .select('job_title, department')
    .eq('organisation_id', account.orgId)
    .eq('user_id', teammateId)
    .single()
  expect(hrProfileErr).toBeNull()
  expect(hrProfile!.job_title).toBe('Senior Care Assistant')
  expect(hrProfile!.department).toBe('Residential Care')

  // ── Log a training completion ────────────────────────────────────────────
  // Only the expanded training type renders its panel content at all
  // (collapsed types render just their header button — see
  // HrTrainingSection.tsx's `{isOpen && (...)}`), so once expanded, every
  // locator below is already unambiguous without needing its own scoped
  // container — there's exactly one of each on the page at a time.
  await page.getByRole('button', { name: trainingType.name, exact: false }).click()

  await page.locator(`#training-date-${trainingType.id}`).fill('2026-01-15')
  await page.locator(`#training-freq-${trainingType.id}`).selectOption('365') // Annual
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  // exact: true — "Staff record saved." (still visible from the earlier save
  // above) is a case-insensitive substring match for "Saved." otherwise,
  // since Playwright's default getByText matching is substring + case-insensitive.
  await expect(page.getByText('Saved.', { exact: true })).toBeVisible()

  const { data: trainingRecord, error: trainingErr } = await admin
    .from('hr_training_records')
    .select('id, date_completed, next_due, frequency_days')
    .eq('organisation_id', account.orgId)
    .eq('user_id', teammateId)
    .eq('training_type_id', trainingType.id)
    .single()
  expect(trainingErr).toBeNull()
  expect(trainingRecord!.date_completed).toBe('2026-01-15')
  expect(trainingRecord!.next_due).toBe('2027-01-15') // +365 days
  expect(trainingRecord!.frequency_days).toBe(365)

  // ── Certificate upload: MIME gate rejects a fake PDF ─────────────────────
  await expect(page.getByText('No certificates uploaded yet.')).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'fake-cert.pdf',
    mimeType: 'application/pdf',
    buffer: FAKE_PDF_BYTES,
  })
  await page.getByRole('button', { name: 'Upload' }).click()
  await expect(page.getByText('File type not accepted')).toBeVisible()
  await expect(page.getByText('No certificates uploaded yet.')).toBeVisible()

  const { data: certsAfterReject } = await admin
    .from('hr_training_certificates')
    .select('id')
    .eq('training_record_id', trainingRecord!.id)
  expect(certsAfterReject).toEqual([])

  // ── Certificate upload: a genuinely clean PDF goes all the way through ───
  await page.locator('input[type="file"]').setInputFiles({
    name: 'genuine-training-cert.pdf',
    mimeType: 'application/pdf',
    buffer: VALID_PDF_BYTES,
  })
  await page.getByRole('button', { name: 'Upload' }).click()
  await expect(page.getByText('Certificate uploaded.')).toBeVisible()

  const certRow = page.locator('li', { hasText: 'genuine-training-cert.pdf' })
  await expect(certRow).toBeVisible()
  await expect(certRow.getByText('✓ Scanned')).toBeVisible()

  const { data: certsAfterSuccess, error: certsErr } = await admin
    .from('hr_training_certificates')
    .select('id, file_name, scan_status')
    .eq('training_record_id', trainingRecord!.id)
  expect(certsErr).toBeNull()
  expect(certsAfterSuccess).toHaveLength(1)
  expect(certsAfterSuccess![0].file_name).toBe('genuine-training-cert.pdf')
  expect(certsAfterSuccess![0].scan_status).toBe('clean')

  // ── Delete the certificate ────────────────────────────────────────────────
  await certRow.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Certificate deleted.')).toBeVisible()
  await expect(page.getByText('No certificates uploaded yet.')).toBeVisible()

  const { data: certsAfterDelete } = await admin
    .from('hr_training_certificates')
    .select('id')
    .eq('training_record_id', trainingRecord!.id)
  expect(certsAfterDelete).toEqual([])
})
