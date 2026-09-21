/**
 * GET /api/export-data (app/dashboard/account/page.tsx's "Export your
 * data" link) — a ZIP of CSVs covering KLOE records, KLOE history, HR
 * staff/training/holidays, and team members, scoped to the caller's own
 * organisation.
 *
 * Driven directly via an authenticated request (Playwright's `request`
 * fixture shares cookies with `page`) rather than clicking the download
 * link -- a browser-triggered download can't have its content inspected
 * from Playwright, but the route itself can be hit directly and its real
 * response body parsed.
 *
 * Covers: non-admin gets 403 (admin-only); a real admin gets a genuine ZIP
 * with the correct filename/content-type and all 6 expected CSV files;
 * team-members.csv reflects a real row; and the CSV formula-injection
 * guard (escapeCsv) actually neutralises a note that starts with "=" --
 * the specific, security-relevant behaviour this route's own code exists
 * to enforce, not just "the export doesn't crash".
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import JSZip from 'jszip'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('export-data: admin-only, and the real ZIP contains every expected CSV with formula injection neutralised', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // A KLOE untouched by any other spec's own .range() picks (0-3, 8-22 are
  // all claimed elsewhere in this suite).
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(23, 23)
  expect(kloErr).toBeNull()
  const kloId = kloItems![0].id

  // A note starting with "=" is the classic CSV/spreadsheet formula
  // injection vector -- escapeCsv() is supposed to neutralise it with a
  // leading single quote. Kept free of quotes/commas so escapeCsv's SEPARATE
  // quote-wrapping rule doesn't also kick in -- this assertion is
  // specifically about the leading-quote formula guard, not that other rule.
  const dangerousNote = '=1+1+cmd|calc!A0'
  const { error: noteErr } = await admin
    .from('compliance_records')
    .update({ notes: dangerousNote, date_reviewed: new Date().toISOString().slice(0, 10) })
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', kloId)
  expect(noteErr).toBeNull()

  try {
    // ── Non-admin: 403 ──────────────────────────────────────────────────
    const { error: pwErr } = await admin.auth.admin.updateUserById(
      account.teammate.userId,
      { password: account.teammate.password },
    )
    expect(pwErr).toBeNull()
    const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of staleFactors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }

    const teammateContext = await page.context().browser()!.newContext()
    const teammatePage = await teammateContext.newPage()
    await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
    await completeMandatoryMfaSetup(teammatePage)

    const forbiddenResponse = await teammatePage.request.get('/api/export-data')
    expect(forbiddenResponse.status()).toBe(403)
    await teammateContext.close()

    const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of factorsAfter?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }

    // ── Admin: real ZIP ───────────────────────────────────────────────────
    await login(page, account)
    await page.waitForURL('**/dashboard')

    const response = await page.request.get('/api/export-data')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('application/zip')
    expect(response.headers()['content-disposition']).toMatch(/attachment; filename="alwaysready-export-\d{4}-\d{2}-\d{2}\.zip"/)

    const zip = await JSZip.loadAsync(await response.body())
    const names = Object.keys(zip.files)
    for (const expected of [
      'alwaysready-export/kloe-records.csv',
      'alwaysready-export/kloe-history.csv',
      'alwaysready-export/hr-staff.csv',
      'alwaysready-export/hr-training.csv',
      'alwaysready-export/hr-holidays.csv',
      'alwaysready-export/team-members.csv',
    ]) {
      expect(names).toContain(expected)
    }

    const teamCsv = await zip.file('alwaysready-export/team-members.csv')!.async('string')
    expect(teamCsv).toContain(account.email)

    const kloeCsv = await zip.file('alwaysready-export/kloe-records.csv')!.async('string')
    // Neutralised: a leading single quote, not the raw formula.
    expect(kloeCsv).toContain(`'${dangerousNote}`)
    expect(kloeCsv).not.toContain(`,${dangerousNote}`)
  } finally {
    tidy(await admin
      .from('compliance_records')
      .update({ notes: null, date_reviewed: null })
      .eq('organisation_id', account.orgId)
      .eq('klo_item_id', kloId), 'export-data: update compliance_records')
  }
})
