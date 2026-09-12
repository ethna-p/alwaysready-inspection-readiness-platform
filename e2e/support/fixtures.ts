/**
 * Loads the seeded fixture written by `npm run test:e2e:seed`
 * (e2e/.fixtures/test-account.json). Shared across spec files so the shape
 * only needs to be declared once.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface TeammateAccount {
  userId: string
  email: string
  password: string
  fullName: string
}

export interface TestAccount {
  orgId: string
  userId: string
  email: string
  password: string
  totpSecret: string
  teammate: TeammateAccount
}

export function loadTestAccount(): TestAccount {
  const path = join(__dirname, '..', '.fixtures', 'test-account.json')
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error(
      `Could not read ${path} — run "npm run test:e2e:seed" first to create the test account.`
    )
  }
}
