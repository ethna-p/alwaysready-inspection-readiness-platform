/**
 * Sub-service checklist toggle: enabling "Dementia care" (or any other
 * sub-service) in Organisation settings makes its specialist checklist
 * items appear on the relevant KLOE; disabling it hides them again without
 * losing any completion/evidence data already recorded.
 *
 * This is the exact feature where a real, significant bug was found and
 * fixed while building this spec: 'Dementia' was missing from
 * checklist-panel.tsx's SPECIALIST_SUB_SERVICES array, despite
 * SPECIALIST_COLOURS already having a full themed entry for it and 48 real
 * klo_checklist_items rows already existing with sub_service='Dementia' —
 * every other piece was already in place. Toggling "Dementia care" on had
 * zero visible effect anywhere in the app, for any organisation, ever
 * (confirmed directly: those 48 items' item_type is 'Core', not the
 * separate legacy 'Dementia Care' item_type, so they matched none of
 * coreItems/specialistItems/dementiaItems — completely unrendered).
 *
 * Autism (and every other named sub-service besides Dementia) already goes
 * through the same generic specialistGroups code path this fix restores
 * Dementia to, so it isn't separately re-tested here — this spec exercises
 * that shared mechanism via the one sub-service that was actually broken.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('toggling a sub-service on shows its checklist items on the relevant KLOE, off hides them without losing data', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Real, static reference data — not organisation-scoped, not touched by
  // any other spec, safe to reference by exact text.
  const targetItemText = 'All staff receive dementia-specific training covering: types of dementia, communication approaches, behaviour support and person-centred care; training is refreshed regularly'
  const { data: checklistItem, error: itemErr } = await admin
    .from('klo_checklist_items')
    .select('id, klo_item_id')
    .eq('checklist_item', targetItemText)
    .single()
  expect(itemErr).toBeNull()

  const { data: kloItem, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .eq('id', checklistItem!.klo_item_id)
    .single()
  expect(kloErr).toBeNull()

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Before enabling: the item is nowhere on the KLOE page ────────────────
  await page.goto(`/dashboard/kloes/${kloItem!.id}`)
  await expect(page.getByText('Dementia', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel(targetItemText)).toHaveCount(0)

  // ── Enable the sub-service via the real UI ───────────────────────────────
  await page.goto('/dashboard/account?tab=organisation')
  const dementiaCheckbox = page.getByLabel('Dementia care')
  await expect(dementiaCheckbox).not.toBeChecked()
  await dementiaCheckbox.click()
  await expect(dementiaCheckbox).toBeChecked()

  const { data: enabledRow, error: enabledErr } = await admin
    .from('organisation_sub_services')
    .select('sub_service')
    .eq('organisation_id', account.orgId)
    .eq('sub_service', 'Dementia')
    .single()
  expect(enabledErr).toBeNull()
  expect(enabledRow!.sub_service).toBe('Dementia')

  // ── The item now appears, grouped under its own "Dementia" section ──────
  await page.goto(`/dashboard/kloes/${kloItem!.id}`)
  await expect(page.getByText('Dementia', { exact: true })).toBeVisible()
  const itemCheckbox = page.getByLabel(targetItemText)
  await expect(itemCheckbox).toBeVisible()
  await expect(itemCheckbox).not.toBeChecked()

  // ── Mark it complete and add evidence ─────────────────────────────────────
  await itemCheckbox.click()
  // The checkbox's checked state is a useOptimistic update -- it flips
  // instantly on click, ahead of the real server round-trip (startTransition
  // doesn't block the click on the underlying server action completing), so
  // don't treat toBeChecked() as proof the write landed. Poll the DB instead.
  await expect(itemCheckbox).toBeChecked()

  await expect.poll(async () => {
    const { data } = await admin
      .from('klo_checklist_completions')
      .select('is_complete')
      .eq('checklist_item_id', checklistItem!.id)
      .eq('organisation_id', account.orgId)
      .maybeSingle()
    return data?.is_complete ?? null
  }).toBe(true)

  // Evidence location field is always visible, just labeled generically
  // ("Evidence location") on every row -- scope to this item's own row
  // (checkbox -> its wrapper div -> the shared row div, exactly 2 hops).
  const itemRow = itemCheckbox.locator('xpath=../..')
  await itemRow.getByLabel('Evidence location').fill('Dementia training matrix, Sept 2026 — see HR/Training')
  await itemRow.getByRole('button', { name: 'Save' }).click()
  await expect(itemRow.getByText('Saved ✓')).toBeVisible()

  // ── Disable the sub-service again (accepting the confirm dialog) ────────
  await page.goto('/dashboard/account?tab=organisation')
  page.once('dialog', dialog => dialog.accept())
  await dementiaCheckbox.click()
  await expect(dementiaCheckbox).not.toBeChecked()

  const { data: disabledRows } = await admin
    .from('organisation_sub_services')
    .select('sub_service')
    .eq('organisation_id', account.orgId)
    .eq('sub_service', 'Dementia')
  expect(disabledRows).toEqual([])

  // ── The item is hidden again, but its completion + evidence survive ─────
  await page.goto(`/dashboard/kloes/${kloItem!.id}`)
  await expect(page.getByText('Dementia', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel(targetItemText)).toHaveCount(0)

  const { data: completionAfterDisable, error: completionAfterDisableErr } = await admin
    .from('klo_checklist_completions')
    .select('is_complete, evidence_location')
    .eq('checklist_item_id', checklistItem!.id)
    .eq('organisation_id', account.orgId)
    .single()
  expect(completionAfterDisableErr).toBeNull()
  expect(completionAfterDisable!.is_complete).toBe(true)
  expect(completionAfterDisable!.evidence_location).toContain('Dementia training matrix')

  // ── Re-enabling shows the same item still complete, evidence intact ─────
  await page.goto('/dashboard/account?tab=organisation')
  await dementiaCheckbox.click()
  await expect(dementiaCheckbox).toBeChecked()

  await page.goto(`/dashboard/kloes/${kloItem!.id}`)
  const itemCheckboxAgain = page.getByLabel(targetItemText)
  await expect(itemCheckboxAgain).toBeChecked()
})
