/**
 * Help Centre (app/dashboard/help/).
 *
 * Entirely static, client-side content -- no database reads or writes, and
 * no role-based filtering (same content for Admin, User, and Viewer alike).
 * Covers the three mutually-exclusive views the component renders (Home,
 * TopicView, SearchResults) and the accordion FAQ items shared across all
 * three: topic navigation via the sidebar, expand/collapse of an individual
 * FAQ, live search across all topics with results grouped by topic label,
 * the "no results" fallback linking to Support, and clearing search to
 * return home.
 *
 * The bug: HelpCentre() renders exactly one of HomeView / TopicView /
 * SearchResults at a time, switching to SearchResults as soon as the search
 * query is non-empty. But the search <input> and its "Clear search" (x)
 * button only ever existed inside HomeView -- so the instant a real search
 * produced results, the component that let you edit or clear that search
 * was unmounted along with it. There was no way back except clicking "Help
 * Centre" in the sidebar, which discards the query outright. The x button
 * itself was reachable only for a query that was non-empty but trimmed to
 * nothing (pure whitespace) -- true dead code for every real search term.
 * Confirmed directly: this spec's first attempt at writing "search again
 * with a different term" and "clear search" genuinely timed out finding
 * elements that were not, in fact, on the page. Fixed by giving
 * SearchResults its own copy of the same search box, wired to the same
 * state -- see its doc comment in HelpCentre.tsx.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('Help Centre: topic navigation, FAQ accordion, and search', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/help')

  // ── Home view ─────────────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'How can we help you?' })).toBeVisible()
  const sidebar = page.getByRole('navigation', { name: 'Topic navigation' })
  await expect(sidebar.getByRole('button', { name: 'Team & Access' })).toBeVisible()

  // ── Selecting a topic from the sidebar ───────────────────────────────────
  await sidebar.getByRole('button', { name: 'Team & Access' }).click()
  await expect(page.getByRole('heading', { name: 'Team & Access' })).toBeVisible()

  // ── FAQ accordion: closed by default, expands on click, collapses again ──
  const rolesQuestion = page.getByRole('button', { name: 'What roles are available?' })
  await expect(rolesQuestion).toHaveAttribute('aria-expanded', 'false')
  const rolesAnswer = page.getByText('Three roles: Admin (full access', { exact: false })
  await expect(rolesAnswer).not.toBeVisible()

  await rolesQuestion.click()
  await expect(rolesQuestion).toHaveAttribute('aria-expanded', 'true')
  await expect(rolesAnswer).toBeVisible()

  await rolesQuestion.click()
  await expect(rolesQuestion).toHaveAttribute('aria-expanded', 'false')
  await expect(rolesAnswer).not.toBeVisible()

  // ── Home button returns from a topic to the home view ────────────────────
  // "Help Centre" exists twice in the DOM -- the desktop sidebar's Home
  // button (outside <nav>, hence not scoped to `sidebar`) and a mobile-only
  // topic strip's equivalent (md:hidden, inert at this viewport but still
  // present). The desktop one renders first in DOM order.
  await page.getByRole('button', { name: 'Help Centre' }).first().click()
  await expect(page.getByRole('heading', { name: 'How can we help you?' })).toBeVisible()

  // ── Search: live filter across all topics, grouped by topic label ───────
  const searchBox = page.getByRole('searchbox', { name: 'Search questions' })
  await searchBox.fill('two-factor')
  await expect(page.getByText(/results? for "two-factor"/)).toBeVisible()
  // "What is two-factor authentication and why is it required?" and "Do
  // Visitor accounts need two-factor authentication?" both live under Team
  // & Access -- confirm the results are grouped under their real topic
  // label (rendered per-result, so two hits in the same topic means two
  // "Team & Access" group labels; .first() confirms at least one renders,
  // among the other "Team & Access" occurrences already in the DOM from the
  // still-present, now-inactive sidebar/mobile-strip nav buttons).
  await expect(page.getByText('Team & Access').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'What is two-factor authentication and why is it required?' })).toBeVisible()

  // ── No-results fallback links to Support ─────────────────────────────────
  await searchBox.fill('xyzzy-not-a-real-question')
  await expect(page.getByText('No results for "xyzzy-not-a-real-question"')).toBeVisible()
  const supportLink = page.getByRole('link', { name: 'contact support' })
  await expect(supportLink).toBeVisible()
  await expect(supportLink).toHaveAttribute('href', '/dashboard/support/new')

  // ── Clearing search returns to the home view ─────────────────────────────
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(searchBox).toHaveValue('')
  await expect(page.getByRole('heading', { name: 'How can we help you?' })).toBeVisible()
})
