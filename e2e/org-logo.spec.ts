/**
 * Organisation logo upload (app/dashboard/account/OrgLogoUpload.tsx ->
 * POST/DELETE /api/org-logo).
 *
 * The bug: the upload control's file picker accepted SVG
 * (accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml") and
 * its own help text advertised "PNG, JPG, WebP, GIF, or SVG" -- but the
 * route's ALLOWED_TYPES set deliberately excludes SVG (a real, intentional
 * security decision: SVGs can embed scripts, an XSS risk if ever served
 * with Content-Type: image/svg+xml). A user could pick an SVG logo exactly
 * as the picker and copy invited them to, upload it, and always get
 * rejected with "File type not allowed" -- confirmed directly against the
 * real route before fixing the frontend to match the backend's actual,
 * correct behaviour.
 *
 * Covers the real upload -> preview -> persisted DB row -> remove cycle
 * with a genuine PNG (real magic bytes, not just a renamed extension), and
 * the SVG rejection as a permanent regression check now that the UI no
 * longer claims to support it.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { must, tidy } from './support/db'

// A genuine, minimal 1x1 transparent PNG -- real magic bytes (file-type
// detects this as image/png), not just a file named ".png".
const VALID_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

// Genuine SVG content (real magic bytes for file-type's content sniffing,
// not just a .svg extension) -- deliberately rejected server-side.
const SVG_BYTES = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
)

test('org logo: real PNG upload persists, SVG is honestly rejected (not advertised as supported), remove clears it', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=organisation')

  try {
    // Start from a known state regardless of what an earlier run left behind.
    const { data: before } = await admin.from('organisations').select('logo_url').eq('id', account.orgId).single()
    if (before?.logo_url) {
      must(await admin.from('organisations').update({ logo_url: null }).eq('id', account.orgId), 'org-logo: update organisations')
      await page.reload()
    }
    await expect(page.getByLabel('No logo uploaded')).toBeVisible()

    // ── SVG: the file picker no longer offers it, and the backend still
    // correctly refuses it even if a file is supplied directly ───────────
    const fileInput = page.locator('#org-logo-input')
    await expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp,image/gif')
    await expect(page.getByText('PNG, JPG, WebP, or GIF', { exact: false })).toBeVisible()

    await fileInput.setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: SVG_BYTES })
    await page.getByRole('button', { name: 'Upload' }).click()
    await expect(page.getByText('File type not allowed', { exact: false })).toBeVisible()

    // ── Real PNG upload: succeeds, preview shown, genuinely persisted ────
    await fileInput.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: VALID_PNG_BYTES })
    await page.getByRole('button', { name: 'Upload' }).click()
    await expect(page.getByText('Logo saved.', { exact: false })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Organisation logo preview' })).toBeVisible()

    const { data: afterUpload, error: afterUploadErr } = await admin
      .from('organisations')
      .select('logo_url')
      .eq('id', account.orgId)
      .single()
    expect(afterUploadErr).toBeNull()
    expect(afterUpload!.logo_url).toContain(`${account.orgId}/logo.png`)

    // ── Remove: genuinely clears it, not just hides the preview ─────────
    await page.getByRole('button', { name: 'Remove logo' }).click()
    await expect(page.getByText('Logo removed.', { exact: false })).toBeVisible()
    await expect(page.getByLabel('No logo uploaded')).toBeVisible()

    const { data: afterRemove } = await admin.from('organisations').select('logo_url').eq('id', account.orgId).single()
    expect(afterRemove!.logo_url).toBeNull()
  } finally {
    tidy(await admin.from('organisations').update({ logo_url: null }).eq('id', account.orgId), 'org-logo: update organisations')
    await admin.storage.from('org-logos').remove([`${account.orgId}/logo.png`]).catch(() => {})
  }
})
