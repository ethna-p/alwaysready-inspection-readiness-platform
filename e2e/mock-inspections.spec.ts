/**
 * Mock Inspections: run a partial self-assessment, generate the action-plan
 * report, and create a real action item from a finding.
 *
 * Found and fixed one real, substantive bug while building this spec:
 * app/dashboard/mock-inspections/[id]/report/page.tsx's tier-classification
 * logic for a "good"-rated KLOE was inverted for two real cases:
 *   - A KLOE rated "good" but with only "not met" checklist gaps (zero
 *     "partial" ones) fell through to "Maintain" -- telling the provider a
 *     KLOE with a genuinely unaddressed evidence gap was "performing well".
 *   - A KLOE rated "good" with ZERO gaps at all (everything "met") landed
 *     in "Strengthen" instead of "Maintain".
 * In a regulated CQC-readiness context this is a real correctness bug, not
 * cosmetic -- it could tell a care provider their evidence is fine when it
 * genuinely isn't. Fixed so any gap (partial or not met) puts a "good"
 * finding in "Strengthen", and only a genuine zero-gap KLOE reaches
 * "Maintain". This spec's KLO2 case ("good" rating, one "not met" gap, zero
 * "partial" gaps) is exactly the scenario that used to be misclassified --
 * it directly proves the fix.
 *
 * Also fixed a real, misleading HelpWidget claim on the session page: "What
 * happens to my responses?" said results are "saved to the KLOE ratings
 * history" -- they aren't. Mock inspection findings live entirely in their
 * own tables (mock_inspection_findings / mock_inspection_checklist_responses),
 * completely separate from compliance_records (the real KLOE Compliance
 * Tracker / RAG history). This spec proves that isolation directly: it
 * snapshots a KLOE's real compliance_records row before the mock inspection
 * and confirms it is byte-for-byte unchanged after, despite the mock
 * inspection rating that same KLOE "Requires Improvement".
 *
 * Uses the "Caring" key question (3 KLOEs -- the smallest, most manageable
 * for a real partial-inspection walkthrough) and the shared fixture admin
 * account. Mock inspection data never touches compliance_records, so this
 * doesn't need a dedicated, unclaimed KLOE range the way specs that rate
 * KLOEs for real (e.g. daily-report.spec.ts, kloe-assignment.spec.ts) do --
 * this spec's writes can't collide with theirs.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('Mock Inspections: partial inspection, correct tiering, action item creation, and real-RAG isolation', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // ── Look up the three "Caring" KLOEs and snapshot one's real compliance
  // record before touching anything, to prove isolation afterward. ─────────
  const { data: caringKq, error: kqError } = await admin
    .from('key_questions')
    .select('id')
    .eq('name', 'Caring')
    .single()
  expect(kqError).toBeNull()

  const { data: caringKlos, error: klosError } = await admin
    .from('klo_items')
    .select('id, title')
    .eq('key_question_id', caringKq!.id)
    .order('display_order')
  expect(klosError).toBeNull()
  expect(caringKlos?.length).toBe(3)
  const [kloMustAddress, kloStrengthen, kloMaintain] = caringKlos!

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // Snapshot AFTER the dashboard's own first-visit compliance-record
  // auto-seeding has already run (confirmed via the dev server's own
  // "[seed-compliance] ... has no compliance records — seeding now" log) --
  // taking this snapshot any earlier would make the isolation check below
  // fail on that unrelated seeding, not on anything the mock inspection
  // itself did.
  const { data: recordBefore } = await admin
    .from('compliance_records')
    .select('*')
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', kloMustAddress.id)
    .maybeSingle()

  // ── Start a partial inspection on "Caring" ───────────────────────────────
  await page.goto('/dashboard/mock-inspections')
  // "Partial inspection" is the default selected type -- no click needed.
  await page.locator('#key_question').selectOption({ label: 'Caring' })
  await page.getByRole('button', { name: 'Begin mock inspection →' }).click()
  await page.waitForURL('**/mock-inspections/**')

  // ── KLOE 1: "Kindness, compassion and dignity" -- a real gap, rated
  // Requires Improvement -> must land in "Must address". ───────────────────
  await expect(page.getByRole('heading', { name: kloMustAddress.title })).toBeVisible()
  await page.getByRole('button', { name: 'Not met' }).first().click()
  await page.getByRole('button', { name: 'Requires Improvement' }).click()
  await page.getByRole('button', { name: 'Save & continue →' }).click()

  // ── KLOE 2: "Person-centred care" -- rated Good, but with a "not met" gap
  // (no "partial" gaps) -- the exact case that used to wrongly fall through
  // to "Maintain". Must land in "Strengthen" after the fix. ────────────────
  await expect(page.getByRole('heading', { name: kloStrengthen.title })).toBeVisible()
  await page.getByRole('button', { name: 'Not met' }).first().click()
  await page.getByRole('button', { name: 'Good' }).click()
  await page.getByRole('button', { name: 'Save & continue →' }).click()

  // ── KLOE 3: "Independence, choice and control" -- rated Good, all
  // checklist items met -- genuinely zero gaps, must land in "Maintain". ───
  await expect(page.getByRole('heading', { name: kloMaintain.title })).toBeVisible()
  await page.getByRole('button', { name: 'Met' }).first().click()
  await page.getByRole('button', { name: 'Good' }).click()
  await page.getByRole('button', { name: 'Complete inspection →' }).click()

  // ── Report ────────────────────────────────────────────────────────────────
  await page.waitForURL('**/report')
  // exact: true -- a plain substring match also catches Next.js's route
  // announcer (#__next-route-announcer__, from the page's own <title>),
  // whose text is "Mock Inspection Report — AlwaysReady", not this exact string.
  await expect(page.getByText('Mock Inspection Report', { exact: true })).toBeVisible()

  // Overall finding is the worst of {requires_improvement, good, good} = requires_improvement
  await expect(page.getByText('Overall finding: Requires Improvement')).toBeVisible()

  // Each tier's <h3> sits inside its own heading-row div, itself inside the
  // tier's own bare outer div (no distinguishing class of its own) -- go up
  // two levels from the heading to land on exactly that tier's own section,
  // not the whole "Your focus areas" card all three tiers share. A plain
  // `locator('div', {has: heading})` would resolve just as validly to that
  // shared outer card (an ancestor of all three), which would silently
  // defeat the "not in Maintain" regression checks below since every tier's
  // text lives somewhere inside that broader scope too.
  const mustAddressSection = page.getByRole('heading', { name: 'Must address' }).locator('xpath=../..')
  const strengthenSection  = page.getByRole('heading', { name: 'Strengthen before inspection' }).locator('xpath=../..')
  const maintainSection    = page.getByRole('heading', { name: 'Maintain' }).locator('xpath=../..')

  await expect(mustAddressSection.getByText(kloMustAddress.title)).toBeVisible()

  // The regression check: KLOE 2 must be in Strengthen, and explicitly NOT
  // in Maintain -- the exact inversion the bug produced.
  await expect(strengthenSection.getByText(kloStrengthen.title)).toBeVisible()
  await expect(maintainSection.getByText(kloStrengthen.title)).not.toBeVisible()

  await expect(maintainSection.getByText(kloMaintain.title)).toBeVisible()
  await expect(strengthenSection.getByText(kloMaintain.title)).not.toBeVisible()

  // ── Create a real action item from the "must address" finding ───────────
  // Scoped via the finding card's own distinguishing class (border-red-100
  // bg-red-50, unique to "must address" cards) rather than a plain div/text
  // filter, which could otherwise resolve to a wrapping ancestor.
  const mustAddressCard = page.locator('.border-red-100.bg-red-50').filter({ hasText: kloMustAddress.title })
  await mustAddressCard.getByRole('button', { name: '+ Create action item' }).click()
  await mustAddressCard.getByRole('button', { name: 'Create action item' }).click()
  await expect(mustAddressCard.getByText('✓ Action item created')).toBeVisible()

  // Confirm it genuinely landed on the KLOE's own page, not just a client-side "done" flag.
  await page.goto(`/dashboard/kloes/${kloMustAddress.id}`)
  await expect(page.getByText(`Address findings: ${kloMustAddress.title}`)).toBeVisible()

  // ── Isolation: the real compliance record for kloMustAddress is
  // completely untouched, despite the mock inspection rating it "Requires
  // Improvement" -- mock inspection data never writes to compliance_records. ─
  const { data: recordAfter } = await admin
    .from('compliance_records')
    .select('*')
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', kloMustAddress.id)
    .maybeSingle()
  expect(recordAfter).toEqual(recordBefore)
})
