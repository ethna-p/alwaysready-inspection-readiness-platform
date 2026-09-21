/**
 * Error reporting (Sentry) in the browser.
 *
 * Why this spec exists: the browser-side Sentry setup used to live in
 * sentry.client.config.ts, which @sentry/nextjs says stops working under Turbopack (the
 * bundler this site builds with). Nothing noticed, because nothing tested it: no error
 * from a user's browser was ever reported, and the deployed scripts carried no Sentry
 * address at all. instrumentation-client.ts is the file Next.js actually loads.
 *
 * This proves the whole chain in a real browser: the SDK starts from
 * NEXT_PUBLIC_SENTRY_DSN, catches an uncaught error, and sends a report to the Sentry
 * address. playwright.config.ts gives the dev server a fake DSN and this spec intercepts
 * the request, so nothing ever leaves the machine.
 */
import { test, expect } from '@playwright/test'

test('an uncaught browser error is sent to Sentry', async ({ page }) => {
  const reports: string[] = []
  await page.route('**/*.ingest.de.sentry.io/**', async route => {
    reports.push(route.request().postData() ?? '')
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Throw from a timer so it is genuinely uncaught, the way a real bug in a page would be.
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('e2e sentry browser test error')
    }, 0)
  })

  await expect
    .poll(() => reports.some(body => body.includes('e2e sentry browser test error')), {
      message: 'Sentry never received the browser error, so browser error reporting is not working',
      timeout: 15_000,
    })
    .toBe(true)
})
