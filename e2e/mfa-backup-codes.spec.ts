/**
 * MFA backup codes — self-service recovery for a sole admin who loses their
 * authenticator device with nobody else able to reset it for them
 * (resetTeamMemberMfa needs another admin in the same org; the superadmin
 * "Reset MFA" button on /superadmin/organisations needs AJ). Built after a
 * real production lockout in this session — see app/login/mfa/actions.ts's
 * redeemBackupCode and app/dashboard/account/mfa/actions.ts's
 * generateBackupCodesForCurrentUser for the design rationale.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { currentTotpCode } from './support/totp'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('a valid backup code resets the stuck factor and routes to mandatory re-setup', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Known state regardless of what an earlier spec left behind.
  const { error: pwErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwErr).toBeNull()
  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
  tidy(await admin.from('mfa_backup_codes').delete().eq('user_id', account.teammate.userId), 'mfa-backup-codes: delete mfa_backup_codes')

  try {
    // ── Enrol TOTP for real, capture the backup codes shown ──────────────
    await login(page, { email: account.teammate.email, password: account.teammate.password })
    await page.waitForURL('**/dashboard/account/mfa/setup**')
    await page.getByRole('button', { name: "Can't scan? Enter code manually" }).click()
    const secret = (await page.getByText('Manual entry key:').locator('xpath=following-sibling::p[1]').innerText()).trim()
    await page.locator('#totp-code').fill(currentTotpCode(secret))
    await page.getByRole('button', { name: 'Activate two-factor authentication' }).click()

    await page.getByRole('heading', { name: 'Save your backup codes' }).waitFor()
    const codeCells = page.locator('.font-mono.text-sm.text-ink > div')
    const codes = await codeCells.allInnerTexts()
    expect(codes.length).toBe(10)
    // Every code looks like XXXXX-XXXXX from the real, non-ambiguous charset.
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/)

    await page.getByLabel("I've saved these codes somewhere safe").check()
    await page.getByRole('button', { name: 'Finish setup' }).click()
    await page.waitForURL(url => url.searchParams.get('mfa') === 'enrolled')

    const { data: factorsBefore } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    expect(factorsBefore?.factors.length).toBe(1)
    const { count: codesBefore } = await admin
      .from('mfa_backup_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.teammate.userId)
    expect(codesBefore).toBe(10)

    // ── Fresh login: lost the device, use a backup code instead ──────────
    const newContext = await page.context().browser()!.newContext()
    const newPage = await newContext.newPage()
    await login(newPage, { email: account.teammate.email, password: account.teammate.password })
    await newPage.waitForURL('**/login/mfa')

    await newPage.getByRole('button', { name: 'Lost your device? Use a backup code instead' }).click()
    await newPage.getByRole('heading', { name: 'Use a backup code' }).waitFor()
    await newPage.locator('#backup-code').fill(codes[0])
    await newPage.getByRole('button', { name: 'Use this code' }).click()

    // Factor gone -> middleware's existing "no factor enrolled" guard fires.
    await newPage.waitForURL('**/dashboard/account/mfa/setup**')
    await expect(newPage.getByText('Action required.')).toBeVisible()
    await newContext.close()

    // ── Genuinely reset server-side, not just a UI redirect ──────────────
    // Checked as "no VERIFIED factor" rather than "no factor at all" --
    // landing on mandatory setup immediately kicks off a fresh enrol() on
    // its own (mfa/setup/page.tsx's own effect), which can create a new
    // *unverified* factor before this assertion runs. That's expected
    // behaviour, not evidence the old one survived.
    const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    expect((factorsAfter?.factors ?? []).filter(f => f.status === 'verified').length).toBe(0)
    const { count: codesAfter } = await admin
      .from('mfa_backup_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.teammate.userId)
    expect(codesAfter).toBe(0)
  } finally {
    const { data: cleanupFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of cleanupFactors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }
    tidy(await admin.from('mfa_backup_codes').delete().eq('user_id', account.teammate.userId), 'mfa-backup-codes: delete mfa_backup_codes')
  }
})

test('an invalid backup code is rejected without touching the real factor', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const { error: pwErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwErr).toBeNull()
  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  try {
    await login(page, { email: account.teammate.email, password: account.teammate.password })
    const secret = await completeMandatoryMfaSetup(page)

    const newContext = await page.context().browser()!.newContext()
    const newPage = await newContext.newPage()
    await login(newPage, { email: account.teammate.email, password: account.teammate.password })
    await newPage.waitForURL('**/login/mfa')

    await newPage.getByRole('button', { name: 'Lost your device? Use a backup code instead' }).click()
    await newPage.locator('#backup-code').fill('AAAAA-AAAAA')
    await newPage.getByRole('button', { name: 'Use this code' }).click()
    await expect(newPage.getByText('Invalid or already-used backup code.')).toBeVisible()

    // Nothing was touched server-side — the real factor still verifies.
    const { data: factorsStillThere } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    expect(factorsStillThere?.factors.length).toBe(1)

    await newPage.getByRole('button', { name: '← Back to authenticator code' }).click()
    await newPage.locator('#code').fill(currentTotpCode(secret))
    await newPage.getByRole('button', { name: 'Verify' }).click()
    await newPage.waitForURL('**/dashboard')
    await newContext.close()
  } finally {
    const { data: cleanupFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of cleanupFactors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }
    tidy(await admin.from('mfa_backup_codes').delete().eq('user_id', account.teammate.userId), 'mfa-backup-codes: delete mfa_backup_codes')
  }
})

test('Account -> Security: generating backup codes, then regenerating, invalidates the old batch', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  page.on('dialog', dialog => dialog.accept())

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=security')

  const panel = page.locator('.bg-card').filter({ hasText: 'Backup codes' })
  await expect(panel.getByText('No backup codes saved')).toBeVisible()

  await panel.getByRole('button', { name: 'Generate backup codes' }).click()
  await expect(page.getByRole('heading', { name: 'Save your backup codes' })).toBeVisible()
  const firstBatch = await page.locator('.font-mono.text-sm.text-ink > div').allInnerTexts()
  expect(firstBatch.length).toBe(10)

  await page.getByLabel("I've saved these codes somewhere safe").check()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(panel.getByText('Saved', { exact: true })).toBeVisible()

  const { count: afterFirst } = await admin
    .from('mfa_backup_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', account.userId)
  expect(afterFirst).toBe(10)

  // Regenerate -- confirm() is auto-accepted above.
  await panel.getByRole('button', { name: 'Regenerate backup codes' }).click()
  await expect(page.getByRole('heading', { name: 'Save your backup codes' })).toBeVisible()
  const secondBatch = await page.locator('.font-mono.text-sm.text-ink > div').allInnerTexts()
  expect(secondBatch.length).toBe(10)
  expect(secondBatch).not.toEqual(firstBatch)

  await page.getByLabel("I've saved these codes somewhere safe").check()
  await page.getByRole('button', { name: 'Done' }).click()

  // Still exactly 10 -- the old batch was deleted, not appended to.
  const { count: afterRegenerate } = await admin
    .from('mfa_backup_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', account.userId)
  expect(afterRegenerate).toBe(10)

  tidy(await admin.from('mfa_backup_codes').delete().eq('user_id', account.userId), 'mfa-backup-codes: delete mfa_backup_codes')
})
