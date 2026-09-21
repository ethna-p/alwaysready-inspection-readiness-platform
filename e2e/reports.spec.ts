/**
 * Report Builder: pre-built view selection (RAG + action-status filtering),
 * key-question filtering, the Evidence Gaps view, the "progress vs last run"
 * snapshot/delta comparison, and saving/loading a custom view.
 *
 * docs/FEATURE_MAP.md previously claimed this feature had "saved views" and
 * an "AI narrative summary". Neither existed for a real user to reach at the
 * time: grepped the whole app for both -- the narrative summary had zero
 * references anywhere (confirmed with AJ: deliberately removed over API cost
 * concerns, properly deleted, not an oversight -- FEATURE_MAP.md was
 * corrected to omit it rather than describe something that doesn't exist),
 * and while app/api/report-views/route.ts (save/load a custom view) was a
 * real, correctly-built backend, no UI anywhere called it. AJ asked for that
 * UI to be built -- ReportFilterPanel.tsx's "Your saved views" section now
 * wires it up (save the current filter/section state as a named view, apply
 * one, delete one), covered by the second test below.
 *
 * Uses four KLOEs at indices 17-20 (Safe, Well-led, Well-led, Safe
 * respectively -- untouched by any other spec's own .range() picks) with
 * deliberately different RAG states and evidence, so the assertions below
 * are about specific, known KLOEs appearing or not appearing -- not
 * fragile whole-org aggregate totals, which several other specs in this
 * suite also contribute to.
 *
 * The snapshot/delta section seeds a fake "yesterday" snapshot directly
 * (via the admin client) with known offsets from whatever the live counts
 * actually are at that point, rather than trying to predict the org's
 * absolute totals in advance -- this proves the delta math is exactly
 * right regardless of what else in the org has touched these numbers.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { must, tidy } from './support/db'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

test('Report Builder: view filtering (RAG + action status), evidence gaps, key-question filter, and exact snapshot deltas', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const { data: klos, error: klosError } = await admin
    .from('klo_items')
    .select('id, title, key_question_id, key_questions ( name )')
    .order('display_order')
    .range(17, 20)
  expect(klosError).toBeNull()
  expect(klos?.length).toBe(4)
  type KloWithKq = { id: string; title: string; key_question_id: string; key_questions: { name: string } | null }
  const [kloEvidenceGaps, kloWithEvidence, kloGreen, kloRed] = klos as unknown as KloWithKq[]

  // Log in and land on /dashboard *before* seeding compliance_records
  // directly -- the default (grey/unassessed) row per KLOE only gets
  // created by the app's own "seed-compliance" logic on a real first
  // dashboard visit, not by `npm run test:e2e:seed` itself. Updating
  // before that visit would silently affect zero rows, and the later
  // auto-seed would then overwrite these KLOEs with plain grey defaults
  // -- confirmed directly (kloGreen showed up in "Attention Needed"
  // instead of being excluded, exactly what a still-grey record would do).
  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Seed RAG states directly -- this spec is about the Report Builder's
  // filtering, not the KLOE-rating UI (already covered elsewhere). ────────
  must(await admin.from('compliance_records')
    .update({ status: 'completed', date_reviewed: daysFromNow(-5), next_review_due: daysFromNow(90) })
    .eq('organisation_id', account.orgId).eq('klo_item_id', kloGreen.id), 'reports: update compliance_records')

  must(await admin.from('compliance_records')
    .update({ status: 'completed', date_reviewed: daysFromNow(-40), next_review_due: daysFromNow(-10) })
    .eq('organisation_id', account.orgId).eq('klo_item_id', kloRed.id), 'reports: update compliance_records')
  // kloEvidenceGaps and kloWithEvidence are left at their auto-seeded
  // default (grey) -- irrelevant to the Evidence Gaps view, which filters
  // purely on evidence count.

  must(await admin.from('kloe_evidence').insert({
    organisation_id: account.orgId,
    klo_item_id: kloWithEvidence.id,
    file_name: 'e2e-policy.pdf',
    storage_path: `${account.orgId}/e2e-report-test.pdf`,
    scan_status: 'clean',
  }), 'reports: insert kloe_evidence')

  // ── One open action on the red KLOE, one completed action on the green
  // one -- "Attention Needed" filters to open actions only. ───────────────
  const { data: openAction, error: openActionErr } = await admin.from('action_items').insert({
    organisation_id: account.orgId,
    klo_item_id: kloRed.id,
    title: 'E2E: chase overdue MAR chart sign-off',
    priority: 'high',
    status: 'open',
    created_by: account.userId,
  }).select('id').single()
  expect(openActionErr).toBeNull()

  const { error: doneActionErr } = await admin.from('action_items').insert({
    organisation_id: account.orgId,
    klo_item_id: kloGreen.id,
    title: 'E2E: already resolved item',
    priority: 'low',
    status: 'completed',
    created_by: account.userId,
  })
  expect(doneActionErr).toBeNull()

  await page.goto('/dashboard/reports')

  // KLOE titles can legitimately appear twice on the page at once -- once
  // in the KLOE Summary table, and again in the Action Plan Items table's
  // own "KLOE" column (each action item's row names the KLOE it belongs
  // to). Scope to the KLOE Summary section specifically -- its own
  // heading and its table are siblings in one shared wrapper div.
  const kloeSummary = page.getByRole('heading', { name: /KLOE Summary/ }).locator('xpath=..')

  // ── "Attention Needed": excludes green KLOEs and non-open actions ───────
  await page.getByRole('button', { name: 'Attention Needed' }).click()

  await expect(kloeSummary.getByText(kloRed.title, { exact: true })).toBeVisible()
  await expect(page.getByText(kloGreen.title, { exact: true })).not.toBeVisible()
  await expect(page.getByText('E2E: chase overdue MAR chart sign-off')).toBeVisible()
  await expect(page.getByText('E2E: already resolved item')).not.toBeVisible()

  // ── "Evidence Gaps": excludes KLOEs that already have evidence ──────────
  await page.getByRole('button', { name: 'Evidence Gaps' }).click()

  await expect(kloeSummary.getByText(kloEvidenceGaps.title, { exact: true })).toBeVisible()
  await expect(page.getByText(kloWithEvidence.title, { exact: true })).not.toBeVisible()

  // ── Key question filter, standalone: deselecting kloRed's own key
  // question removes it even with no system view active. ──────────────────
  await page.getByRole('button', { name: 'Clear — customise manually' }).click()
  await expect(kloeSummary.getByText(kloRed.title, { exact: true })).toBeVisible()

  const redKqName = kloRed.key_questions!.name
  await page.getByLabel(redKqName, { exact: true }).uncheck()
  await expect(page.getByText(kloRed.title, { exact: true })).not.toBeVisible()

  await page.getByLabel(redKqName, { exact: true }).check()
  await expect(kloeSummary.getByText(kloRed.title, { exact: true })).toBeVisible()

  // ── Snapshot / delta: read the live counts, seed a fake "yesterday" row
  // offset by known amounts, and assert the exact delta text. ─────────────
  await page.getByRole('button', { name: 'Attention Needed' }).click()

  const redLabel = page.getByText('Red', { exact: true })
  const currentRed = parseInt((await redLabel.locator('xpath=preceding-sibling::p[1]').innerText()).trim(), 10)
  const greenLabel = page.getByText('Green', { exact: true })
  const currentGreen = parseInt((await greenLabel.locator('xpath=preceding-sibling::p[1]').innerText()).trim(), 10)
  const amberLabel = page.getByText('Amber', { exact: true })
  const currentAmber = parseInt((await amberLabel.locator('xpath=preceding-sibling::p[1]').innerText()).trim(), 10)
  const greyLabel = page.getByText('Unassessed', { exact: true })
  const currentGrey = parseInt((await greyLabel.locator('xpath=preceding-sibling::p[1]').innerText()).trim(), 10)
  const openLabel = page.getByText('Open actions', { exact: true })
  const currentOpen = parseInt((await openLabel.locator('xpath=preceding-sibling::p[1]').innerText()).trim(), 10)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().slice(0, 10)
  const yesterdayLabel = yesterday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  // Deliberately offset from the live counts just read -- 2 more red than
  // yesterday (worse, expect a red ↑2), 1 fewer green than yesterday
  // (worse, expect a red ↓1 -- fewer green is a regression), same open
  // actions as yesterday (expect no delta badge at all for that one). Amber
  // and grey are seeded at their exact current values (not hardcoded 0) so
  // no unintended third delta badge renders for whatever the org's live
  // amber/grey counts happen to be.
  const { error: snapErr } = await admin.from('report_snapshots').upsert({
    organisation_id: account.orgId,
    view_key: 'attention-needed',
    green: currentGreen + 1,
    amber: currentAmber,
    red: currentRed - 2,
    grey: currentGrey,
    total: 0,
    open_actions: currentOpen,
    overdue_actions: 0,
    captured_date: yesterdayDate,
    captured_at: yesterday.toISOString(),
  }, { onConflict: 'organisation_id,view_key,captured_date' })
  expect(snapErr).toBeNull()

  // Re-select the same view to force a fresh fetch of the previous snapshot.
  await page.getByRole('button', { name: 'Governance Summary' }).click()
  await page.getByRole('button', { name: 'Attention Needed' }).click()

  await expect(page.getByText(`↑2 since ${yesterdayLabel}`)).toBeVisible()
  await expect(page.getByText(`↓1 since ${yesterdayLabel}`)).toBeVisible()
  // Open actions unchanged from yesterday -- delta() returns null for a
  // zero diff, so no badge at all should render for it, unlike Red/Green above.
  await expect(page.getByText(`since ${yesterdayLabel}`)).toHaveCount(2)

  // ── Cleanup: only this spec's own rows, nothing shared. ──────────────────
  tidy(await admin.from('report_snapshots').delete().eq('organisation_id', account.orgId).eq('view_key', 'attention-needed').eq('captured_date', yesterdayDate), 'reports: delete report_snapshots')
  tidy(await admin.from('action_items').delete().in('id', [openAction!.id]), 'reports: delete action_items')
  tidy(await admin.from('action_items').delete().eq('organisation_id', account.orgId).eq('title', 'E2E: already resolved item'), 'reports: delete action_items')
  tidy(await admin.from('kloe_evidence').delete().eq('organisation_id', account.orgId).eq('klo_item_id', kloWithEvidence.id), 'reports: delete kloe_evidence')
})

test('Report Builder: save, apply, and delete a custom saved view', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const viewName = 'E2E: Safeguarding focus'

  // A previous failed run may have left this behind -- start from a known
  // state rather than assuming a clean org (other specs in this suite share
  // the same seeded fixture, and saved_report_views has no per-spec index
  // reservation the way klo_items rows do).
  tidy(await admin.from('saved_report_views').delete().eq('org_id', account.orgId).eq('name', viewName), 'reports: delete saved_report_views')

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/reports')

  await expect(page.getByText('No saved views yet.')).toBeVisible()

  // ── Save the current (manually configured) filters as a named view ───────
  await page.getByRole('button', { name: 'Attention Needed' }).click()
  await page.getByRole('button', { name: '+ Save current filters' }).click()
  await page.getByPlaceholder(/Name this view/).fill(viewName)
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  const viewButton   = page.getByRole('button', { name: viewName, exact: true })
  const deleteButton = page.getByRole('button', { name: `Delete ${viewName}` })
  await expect(viewButton).toBeVisible()

  // The "Action status" select is visible whenever showActions is true,
  // regardless of which view (if any) is active -- a reliable signal that
  // the saved config actually reapplied, not just that the button
  // highlighted. Attention Needed's own config sets actionStatus: 'open'.
  const actionStatusSelect = page.getByText('Action status', { exact: true }).locator('xpath=following-sibling::select')
  await expect(actionStatusSelect).toHaveValue('open')

  // ── Switching to a system view and back re-applies the saved config ──────
  await page.getByRole('button', { name: 'Governance Summary' }).click()
  await expect(actionStatusSelect).toHaveValue('all')
  await viewButton.click()
  await expect(actionStatusSelect).toHaveValue('open')

  // ── Persists across a reload -- it's coming from the API, not local state ─
  await page.reload()
  await expect(viewButton).toBeVisible()

  // ── Delete removes it ─────────────────────────────────────────────────────
  page.once('dialog', d => d.accept())
  await deleteButton.click()
  await expect(viewButton).not.toBeVisible()
  await expect(page.getByText('No saved views yet.')).toBeVisible()

  // ── Cleanup: guard against a failure leaving the row behind ──────────────
  tidy(await admin.from('saved_report_views').delete().eq('org_id', account.orgId).eq('name', viewName), 'reports: delete saved_report_views')
})
