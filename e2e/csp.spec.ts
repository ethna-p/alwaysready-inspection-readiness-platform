/**
 * Content-Security-Policy: scripts need a per-request nonce, and the pages still work.
 *
 * The policy (lib/csp.ts, applied in middleware.ts) used to allow 'unsafe-inline' and 'unsafe-eval'
 * for scripts, so an injected script would have run. Now only scripts carrying the request's nonce run.
 * This proves, against the real running app:
 *   - the header is present, has a nonce that changes on every request, and does not allow
 *     'unsafe-inline' for scripts
 *   - the nonce in the header is the one stamped on the page's own scripts (Next.js applied it)
 *   - the pages actually work under it: a real login and a dashboard visit raise no CSP violations,
 *     and injected inline JavaScript (an onerror handler) is refused
 *
 * (Development serves 'unsafe-eval' for React's debugging; the production policy drops it, which
 * lib/__tests__/csp.test.ts pins.)
 */
import { test, expect, type Page } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

function scriptSrc(csp: string): string {
  return csp.split('; ').find(d => d.startsWith('script-src ')) ?? ''
}

async function collectViolations(page: Page) {
  const violations: string[] = []
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', e => {
      ;(window as unknown as { __csp?: string[] }).__csp ??= []
      ;(window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'} ${(e.sample || '').slice(0, 80)}`)
    })
  })
  return {
    read: async () => {
      violations.push(...((await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])) as string[]))
      return violations
    },
  }
}

test('CSP: per-request nonce, no unsafe-inline scripts, nonce reaches the page scripts', async ({ request }) => {
  const first = await request.get('/login')
  const second = await request.get('/login')
  const csp1 = first.headers()['content-security-policy']
  const csp2 = second.headers()['content-security-policy']
  expect(csp1).toBeTruthy()

  expect(scriptSrc(csp1)).toContain("'strict-dynamic'")
  expect(scriptSrc(csp1)).not.toContain('unsafe-inline')

  const nonce1 = /'nonce-([^']+)'/.exec(csp1)![1]
  const nonce2 = /'nonce-([^']+)'/.exec(csp2)![1]
  expect(nonce1).not.toBe(nonce2)

  // Next.js stamped THIS request's nonce on the page's scripts.
  const html = await first.text()
  expect(html).toContain(`nonce="${nonce1}"`)
})

test('CSP: login and dashboard work with no violations, and injected inline JavaScript is refused', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const violations = await collectViolations(page)

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/kloes')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

  // Every page load above ran with the policy enforced and nothing was blocked.
  const seen = (await violations.read()).filter(v => !v.includes('sentry'))
  expect(seen).toEqual([])

  // The realistic attack: markup injected into the page carrying inline JavaScript (here an onerror handler,
  // the classic XSS payload). With no 'unsafe-inline' and no nonce, the browser must refuse to run it.
  // (Scripts created by the page's own trusted JavaScript are allowed by 'strict-dynamic' by design, so
  // creating a <script> element from the test would not prove anything.)
  const ran = await page.evaluate(async () => {
    ;(window as unknown as { __injected?: boolean }).__injected = false
    document.body.insertAdjacentHTML('beforeend', '<img src="x:invalid" onerror="window.__injected = true">')
    await new Promise(r => setTimeout(r, 500))
    return (window as unknown as { __injected: boolean }).__injected
  })
  expect(ran).toBe(false)
  expect((await violations.read()).some(v => v.startsWith('script-src'))).toBe(true)
})
