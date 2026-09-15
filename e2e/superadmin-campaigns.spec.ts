/**
 * Superadmin Campaigns (app/superadmin/campaigns/) — direct marketing
 * campaign management: create/delete campaigns, and a manual opt-out
 * suppression list (the counterpart to app/api/inbound-optout's own
 * token-based automatic suppression, used when an opt-out request has no
 * verifiable token).
 *
 * Drives the real create -> appears in list -> delete flow for both
 * campaigns and suppressions, including each one's actual confirm()
 * dialog.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('superadmin campaigns: create/delete a campaign, add/remove a manual opt-out', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const campaignName = `E2E Campaign ${Date.now()}`
  const suppressionServiceName = `E2E Suppressed Service ${Date.now()}`

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/campaigns')

    // ── Create campaign ──────────────────────────────────────────────────
    await page.locator('input[name="name"]').fill(campaignName)
    await page.locator('input[name="description"]').fill('E2E test campaign description')
    await page.getByRole('button', { name: 'Create campaign' }).click()

    // .first() -- a `div` locator scoped by `has` matches every ancestor div
    // containing the link (outer card, then progressively nested inner
    // divs), in document order outermost-first. .first() is the real card
    // (status badge, contact count, and the Delete button all live in it);
    // .last() would silently resolve to an inner wrapper missing most of
    // that (same footgun noted in superadmin-organisations.spec.ts).
    const campaignCard = page.locator('div', { has: page.getByRole('link', { name: campaignName, exact: true }) }).first()
    await expect(campaignCard).toBeVisible()
    await expect(campaignCard.getByText('draft', { exact: true })).toBeVisible()
    await expect(campaignCard.getByText('0 contacts', { exact: false })).toBeVisible()

    // ── Delete campaign via its real confirm() dialog ────────────────────
    page.once('dialog', dialog => dialog.accept())
    await campaignCard.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('link', { name: campaignName, exact: true })).toHaveCount(0)

    // ── Add a manual opt-out suppression ──────────────────────────────────
    await page.locator('input[name="location_name"]').fill(suppressionServiceName)
    await page.locator('input[name="postcode"]').fill('ip28 7de') // lowercase in -- action uppercases it
    await page.locator('input[name="email"]').fill('OptOut@Example.org') // mixed case -- action lowercases it
    await page.getByRole('button', { name: 'Add opt-out' }).click()

    const suppressionRow = page.locator('tr', { hasText: suppressionServiceName })
    await expect(suppressionRow).toBeVisible()
    await expect(suppressionRow.getByText('IP28 7DE', { exact: true })).toBeVisible()
    await expect(suppressionRow.getByText('optout@example.org', { exact: true })).toBeVisible()
    await expect(suppressionRow.getByText('Manual', { exact: true })).toBeVisible()

    // ── Remove it via its real confirm() dialog ──────────────────────────
    page.once('dialog', dialog => dialog.accept())
    await suppressionRow.getByRole('button', { name: 'Remove' }).click()
    await expect(page.locator('tr', { hasText: suppressionServiceName })).toHaveCount(0)
  } finally {
    await admin.from('marketing_campaigns').delete().eq('name', campaignName)
    await admin.from('marketing_suppressions').delete().eq('location_name', suppressionServiceName)
  }
})
