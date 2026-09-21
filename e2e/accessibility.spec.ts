/**
 * Accessibility gate: WCAG 2.1 A and AA, checked by axe-core on the running app.
 *
 * Accessibility is a hard requirement for this product. This scans the main screens of each kind of
 * user and FAILS on any serious or critical violation, so a regression (a low-contrast colour, an
 * unlabelled control, a scrollable area a keyboard cannot reach) cannot ship unnoticed.
 *
 * Automated scanning finds only part of WCAG (roughly a third of the issues). It does not replace a
 * manual keyboard and screen-reader pass, which is a separate item in docs/PRE_LAUNCH_CHECKLIST.md.
 *
 * axe is evaluated with page.evaluate (not injected as a <script>), because the Content-Security-Policy
 * would refuse an inline script. Requires the seeded fixture from `npm run test:e2e:seed`.
 */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

interface Violation { id: string; impact: string; help: string; nodes: { target: unknown[] }[] }

async function serious(page: Page, label: string): Promise<string[]> {
  await page.waitForLoadState('networkidle')
  await page.evaluate(AXE_SOURCE)
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: Violation[] }> } }).axe
    const r = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations'],
    })
    return r.violations
  })
  return violations
    .filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${label}: ${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}; first: ${JSON.stringify(v.nodes[0].target)}`)
}

async function scanAll(page: Page, paths: string[]): Promise<string[]> {
  const found: string[] = []
  for (const path of paths) {
    await page.goto(path)
    found.push(...await serious(page, path))
  }
  return found
}

test('accessibility: member pages have no serious or critical WCAG 2.1 AA violations', async ({ page }) => {
  test.setTimeout(240_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const { data: klo } = await admin.from('klo_items').select('id').order('display_order').limit(1).single()

  await login(page, account)
  await page.waitForURL('**/dashboard')

  const found = await scanAll(page, [
    '/dashboard',
    '/dashboard/kloes',
    `/dashboard/kloes/${klo!.id}`,
    '/dashboard/reports',
    '/dashboard/mock-inspections',
    '/dashboard/peoples-voice',
    '/dashboard/inspection-pack',
    '/dashboard/incidents',
    '/dashboard/governance',
    '/dashboard/feedback',
    '/dashboard/hr',
    '/dashboard/account',
    '/dashboard/support',
    '/dashboard/daily-report',
    '/dashboard/help',
    '/dashboard/post-inspection',
  ])
  expect(found, found.join('\n')).toEqual([])
})

test('accessibility: member pages in dark mode have no serious or critical violations', async ({ page }) => {
  test.setTimeout(240_000)
  const account = loadTestAccount()
  await page.emulateMedia({ colorScheme: 'dark' })
  await login(page, account)
  await page.waitForURL('**/dashboard')
  const found = await scanAll(page, [
    '/dashboard', '/dashboard/kloes', '/dashboard/reports', '/dashboard/incidents',
    '/dashboard/governance', '/dashboard/feedback', '/dashboard/account', '/dashboard/help',
  ])
  expect(found, found.join('\n')).toEqual([])
})

test('accessibility: superadmin pages have no serious or critical WCAG 2.1 AA violations', async ({ page }) => {
  test.setTimeout(240_000)
  const account = loadTestAccount()
  await login(page, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await page.waitForURL('**/superadmin/provision')

  const found = await scanAll(page, [
    '/superadmin/provision',
    '/superadmin/organisations',
    '/superadmin/leads',
    '/superadmin/campaigns',
    '/superadmin/tickets',
    '/superadmin/metrics',
    '/superadmin/infrastructure',
    '/superadmin/broadcast',
    '/superadmin/email-log',
    '/superadmin/email-templates',
    '/superadmin/notification-feedback',
    '/superadmin/test-emails',
    '/superadmin/account',
  ])
  expect(found, found.join('\n')).toEqual([])
})

test('accessibility: public pages have no serious or critical WCAG 2.1 AA violations', async ({ page }) => {
  test.setTimeout(120_000)
  const found = await scanAll(page, ['/login', '/trial', '/upgrade'])
  expect(found, found.join('\n')).toEqual([])
})
