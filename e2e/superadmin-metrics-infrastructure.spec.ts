/**
 * Superadmin Metrics and Infrastructure (app/superadmin/metrics/,
 * app/superadmin/infrastructure/) — two purely read-only operational
 * dashboards, no forms or mutating actions on either page.
 *
 * Smoke-level coverage: both pages load successfully as the superadmin
 * (rather than erroring on one of their many aggregation queries) and
 * render every section heading. For Infrastructure specifically, this
 * environment has none of the external monitoring API keys configured
 * (Upstash, Sentry, Vercel, Cloudflare), so those four cards are expected
 * to show their "API key not configured" fallback rather than live data --
 * asserting on that documents the expected degraded state instead of
 * silently passing or failing on absent live numbers.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('superadmin metrics: loads and renders every section', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await page.waitForURL('**/superadmin/provision')
  await page.goto('/superadmin/metrics')

  await expect(page.getByRole('heading', { name: 'Metrics', exact: true })).toBeVisible()
  for (const heading of [
    'Subscription health',
    'Marketing funnel',
    'Trial signups — last 12 weeks',
    'Trial to paid conversion — last 6 months',
    'Active subscribers',
    'Evidence uploads by org',
    'Notifications sent — last 30 days',
    'DBS checks expiring in 60 days',
    'Training completions — last 90 days',
    'Engagement quality',
    'Mock inspection usage',
    'Support tickets',
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})

test('superadmin infrastructure: loads and shows honest fallbacks for unconfigured services', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await page.waitForURL('**/superadmin/provision')
  await page.goto('/superadmin/infrastructure')

  await expect(page.getByRole('heading', { name: 'Infrastructure', exact: true })).toBeVisible()

  // DB-backed cards are always live -- no env-gating.
  await expect(page.getByText('Resend — emails this month')).toBeVisible()
  await expect(page.getByText('Supabase — active users')).toBeVisible()

  // No Upstash/Sentry/Vercel/Cloudflare credentials in this environment --
  // each of these must honestly show "not configured" rather than a blank
  // or fabricated meter.
  // Scoped to '.bg-card' specifically, not a bare 'div' -- a plain `div`
  // filter matches every ancestor div containing the label, including the
  // shared grid wrapper around ALL four cards, so `.first()` on that
  // resolved to the wrapper and the "API key not configured" assertion
  // then strict-mode-violated on all 4 badges at once (confirmed live).
  // Each real card is its own '.bg-card' element -- the same scoping
  // already used in superadmin-organisations.spec.ts and
  // superadmin-campaigns.spec.ts.
  for (const label of [
    'Upstash Redis — commands today',
    'Sentry — errors this month',
    'Vercel — bandwidth this month',
    'Cloudflare Workers — requests today',
  ]) {
    const card = page.locator('.bg-card').filter({ hasText: label })
    await expect(card.getByText('API key not configured', { exact: false })).toBeVisible()
  }
})
