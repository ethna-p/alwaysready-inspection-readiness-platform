/**
 * Playwright E2E config.
 *
 * Runs against a local `next dev` server, deliberately pointed at the
 * `alwaysready-preview` Supabase project (see docs/handoff-preview-production-split.md)
 * — never production. The dev server's env is overridden below rather than
 * touching .env.local, so `npm run dev` on its own still uses whatever you
 * normally use.
 *
 * Before running for the first time (or whenever you want a clean test
 * account): `npm run test:e2e:seed`.
 */
import { defineConfig, devices } from '@playwright/test'
import { loadEnvLocal } from './e2e/support/env'

const env = loadEnvLocal()

const PORT = 3100 // distinct from the port you'd use for `npm run dev` yourself
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // shared seeded fixture account — avoid cross-test races for now
  // `fullyParallel: false` only serializes tests within one file; separate
  // spec files still run in their own workers concurrently by default.
  // Every spec logs in as the same seeded admin (shared TOTP secret), so two
  // files verifying MFA at once can race — one computes/submits a code the
  // instant the other's is still in flight, and Supabase's anti-replay
  // guard on the previously-used code rejects it as "Incorrect code."
  // Force one worker so specs run strictly one after another.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_PREVIEW_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.SUPABASE_PREVIEW_ANON_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_PREVIEW_SERVICE_ROLE_KEY ?? '',
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      SUPERADMIN_EMAIL: env.SUPERADMIN_EMAIL ?? '',
    },
  },
})
