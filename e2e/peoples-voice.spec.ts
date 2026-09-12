/**
 * People's Voice: record evidence against an "I" statement, track its RAG
 * review status and history, and manage an action plan for it.
 *
 * Covers, genuinely, end to end through the real UI and real server actions
 * (app/dashboard/peoples-voice/actions.ts):
 *   - recording evidence (confidence + summary + review dates) via
 *     upsertIStatementEvidence, confirmed written to i_statement_evidence
 *   - the evidence-quality badge and read-only summary reflect what was
 *     just saved once the edit panel closes
 *   - the review history log picks up the save as a new entry
 *   - creating and signing off an action item (createIStatementAction /
 *     signOffIStatementAction), confirmed written to i_statement_actions
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('Peoples Voice: record evidence, review history, and action plan', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // No other spec touches i_statements — safe to just take the first one.
  const { data: statements, error: stmtErr } = await admin
    .from('i_statements')
    .select('id, statement_text')
    .order('statement_order')
    .range(0, 0)
  expect(stmtErr).toBeNull()
  const statement = statements![0]

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/peoples-voice')

  // `border-b` is an extremely common Tailwind utility used all over the
  // page, so a class-based container selector matches far more than just
  // this one StatementRow. The statement text's <p> sits two levels inside
  // the row's own root div (p -> collapsed-row flex div -> StatementRow
  // root), so walk up exactly that far instead.
  const row = page.getByText(statement.statement_text, { exact: true }).locator('xpath=../..')

  // ── Record evidence ───────────────────────────────────────────────────────
  await row.getByRole('button', { name: 'Add evidence' }).click()

  const today = new Date().toISOString().split('T')[0]
  const farFuture = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // well past the 14-day "due soon" window -> green

  await row.locator(`#date-reviewed-${statement.id}`).fill(today)
  await row.locator(`#next-review-${statement.id}`).fill(farFuture)
  await row.getByRole('button', { name: 'Evidence strong' }).click()
  await row.locator(`#evidence-${statement.id}`).fill('Resident survey (March 2026) shows 94% satisfaction with how dignity is upheld during personal care.')

  await row.getByRole('button', { name: 'Save' }).click()
  await expect(row.getByText('Saved ✓')).toBeVisible()

  const { data: evidenceRow, error: evidenceErr } = await admin
    .from('i_statement_evidence')
    .select('confidence, evidence_summary, date_reviewed, next_review_due')
    .eq('i_statement_id', statement.id)
    .single()
  expect(evidenceErr).toBeNull()
  expect(evidenceRow!.confidence).toBe('green')
  expect(evidenceRow!.evidence_summary).toContain('94% satisfaction')
  expect(evidenceRow!.date_reviewed).toBe(today)
  expect(evidenceRow!.next_review_due).toBe(farFuture)

  // The panel stays open after a successful save (see the fix above) --
  // close it manually to see the collapsed view's quality badge and
  // read-only summary.
  await row.getByRole('button', { name: 'Close' }).click()
  await expect(row.getByText('Evidence strong', { exact: true })).toBeVisible()
  await expect(row.getByText('94% satisfaction', { exact: false })).toBeVisible()

  // ── Review history picks up the save ─────────────────────────────────────
  await row.getByRole('button', { name: 'Show history (1 update)' }).click()
  const historyEntry = row.locator('div.border-l-2')
  await expect(historyEntry).toBeVisible()
  await expect(historyEntry.getByText('94% satisfaction', { exact: false })).toBeVisible()

  // ── Action plan: create, then sign off ───────────────────────────────────
  await row.getByRole('button', { name: '+ Action plan' }).click()
  // The "+" is inside an aria-hidden span, so it's excluded from the
  // button's accessible name -- the real name is just "Add action item".
  await row.getByRole('button', { name: 'Add action item' }).click()

  await row.getByPlaceholder('e.g. Collect resident feedback on dignity').fill('Follow up with residents who gave lower scores')
  await row.getByRole('button', { name: 'Add action' }).click()

  await expect(row.getByText('Follow up with residents who gave lower scores')).toBeVisible()

  const { data: actionRow, error: actionErr } = await admin
    .from('i_statement_actions')
    .select('id, title, status')
    .eq('i_statement_id', statement.id)
    .single()
  expect(actionErr).toBeNull()
  expect(actionRow!.title).toBe('Follow up with residents who gave lower scores')
  expect(actionRow!.status).not.toBe('completed')

  await row.getByRole('button', { name: 'Sign off' }).click()
  await row.getByRole('button', { name: 'Confirm sign-off' }).click()

  await expect(row.getByText('No open action items.')).toBeVisible()
  await row.getByRole('button', { name: /Show completed actions/ }).click()
  await expect(row.getByText('Follow up with residents who gave lower scores')).toBeVisible()

  const { data: completedAction, error: completedErr } = await admin
    .from('i_statement_actions')
    .select('status, completed_by')
    .eq('id', actionRow!.id)
    .single()
  expect(completedErr).toBeNull()
  expect(completedAction!.status).toBe('completed')
  expect(completedAction!.completed_by).toBe(account.userId)
})
