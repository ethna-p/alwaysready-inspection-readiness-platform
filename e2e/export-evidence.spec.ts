/**
 * GET /api/export-evidence (app/dashboard/account/page.tsx's "Export
 * evidence files" link) — downloads every evidence file the org has
 * uploaded to Supabase Storage as one ZIP, organised as
 * {KLOE title}/{original filename}, with the upload-time timestamp prefix
 * stripped from each filename.
 *
 * Uploads a real evidence file through the actual KLOE evidence uploader
 * first (same technique as kloe-evidence-upload.spec.ts), then drives the
 * export route directly via an authenticated request and inspects the
 * real ZIP contents -- confirms the KLOE-title folder name, the stripped
 * (no timestamp prefix) filename, and that the byte content itself
 * round-trips correctly. Also covers the documented empty-org case (404,
 * not a crash) using a disposable org with no uploads at all.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import JSZip from 'jszip'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

// Genuine PDF magic bytes (file-type detects this as application/pdf),
// same minimal structure used by kloe-evidence-upload.spec.ts.
const VALID_PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n' +
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n' +
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
  'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n0\n%%EOF'
)

test('export-evidence: real ZIP has the KLOE-title folder, stripped filename, and correct byte content', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // A KLOE untouched by any other spec's own .range() picks.
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(4, 4)
  expect(kloErr).toBeNull()
  const [{ id: kloId, title: kloTitle }] = kloItems!

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto(`/dashboard/kloes/${kloId}`)

  await page.getByLabel('Upload evidence file').setInputFiles({
    name: 'export-evidence-test.pdf',
    mimeType: 'application/pdf',
    buffer: VALID_PDF_BYTES,
  })
  await expect(page.locator('li', { hasText: 'export-evidence-test.pdf' })).toBeVisible()

  try {
    const response = await page.request.get('/api/export-evidence')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('application/zip')
    expect(response.headers()['content-disposition']).toBe('attachment; filename="evidence-files.zip"')

    const zip = await JSZip.loadAsync(await response.body())
    const safeFolder = kloTitle.replace(/[/\\:*?"<>|]/g, '_').trim()
    const expectedPath = `${safeFolder}/export-evidence-test.pdf`

    const names = Object.keys(zip.files)
    // The timestamp prefix (e.g. "1721234567890-") added at upload time
    // must be gone -- a real, likely case where the fix could regress back
    // to leaking internal upload bookkeeping into the user-facing filename.
    expect(names).toContain(expectedPath)
    expect(names.some(n => /^\d+-export-evidence-test\.pdf$/.test(n.split('/').pop() ?? ''))).toBe(false)

    const content = await zip.file(expectedPath)!.async('nodebuffer')
    expect(content.equals(VALID_PDF_BYTES)).toBe(true)
  } finally {
    await admin.from('kloe_evidence').delete().eq('klo_item_id', kloId)
    const { data: files } = await admin.storage.from('evidence').list(`${account.orgId}/${kloId}`)
    if (files && files.length > 0) {
      await admin.storage.from('evidence').remove(files.map(f => `${account.orgId}/${kloId}/${f.name}`))
    }
  }
})

test('export-evidence: an org with nothing uploaded gets a clear 404, not a crash', async ({ page }) => {
  test.setTimeout(60_000)
  const admin = getAdminClient()

  const orgName = `E2E Export Evidence Empty Org ${Date.now()}`
  const adminEmail = `e2e-export-evidence-empty-${Date.now()}@example.org`
  const adminPassword = `E2E-export-evidence-pw-${Date.now()}!`

  const { data: svcType, error: svcTypeErr } = await admin.from('service_types').select('id').limit(1).single()
  expect(svcTypeErr).toBeNull()

  const { data: org, error: orgErr } = await admin
    .from('organisations')
    .insert({ name: orgName, service_type_id: svcType!.id, subscription_tier: 'active' })
    .select('id')
    .single()
  expect(orgErr).toBeNull()
  const orgId = org!.id

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })
  expect(authErr).toBeNull()
  const userId = authUser!.user.id

  const { error: profileErr } = await admin.from('users').insert({
    id: userId,
    organisation_id: orgId,
    email: adminEmail,
    role: 'admin',
    full_name: 'E2E Export Evidence Admin',
    username: `e2e_export_evidence_${Date.now()}`,
    onboarding_complete: true,
  })
  expect(profileErr).toBeNull()

  try {
    // A freshly-created account has no MFA factor yet -- middleware
    // correctly forces mandatory enrolment before /dashboard is reachable.
    await login(page, { email: adminEmail, password: adminPassword })
    await completeMandatoryMfaSetup(page)

    const response = await page.request.get('/api/export-evidence')
    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toContain('No evidence files')
  } finally {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    await admin.from('users').delete().eq('organisation_id', orgId)
    await admin.from('organisations').delete().eq('id', orgId)
  }
})
