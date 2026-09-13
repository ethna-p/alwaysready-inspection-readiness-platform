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

  // Default 5s is tight against an unoptimized `next dev` server, especially
  // for the first hit on a route it hasn't compiled yet mid-suite (KLOE
  // detail pages pull in several sub-panels) — seen directly: a save's
  // "Saving…" button was still correctly pending, just past 5s, not stuck
  // or broken. 10s gives real slow-but-working saves room without masking
  // a genuinely hung one.
  expect: {
    timeout: 10_000,
  },

  // Default per-test timeout (30s) is tight for a spec doing genuinely more
  // real work than most — e.g. kloe-assignment.spec.ts's full mandatory MFA
  // enrolment (enroll() -> render QR -> reveal secret -> compute TOTP ->
  // challengeAndVerify() -> hard navigation) on top of the rest of its
  // steps. Passed standalone in ~16s but exceeded 30s under the full
  // suite's cumulative load (same unoptimized-dev-server class of flake as
  // the expect timeout above). 60s matches the same reasoning.
  timeout: 60_000,

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
      // Only needed so e2e/support-tickets.spec.ts can genuinely exercise
      // /api/inbound-email (simulating what the real Cloudflare Email Worker
      // posts) rather than skip that code path entirely — not a production
      // secret, see .env.local's own comment on this key.
      INBOUND_EMAIL_SECRET: env.INBOUND_EMAIL_SECRET ?? '',
      // Stripe TEST MODE only (sk_test_...) — for e2e/cancel-subscription.spec.ts
      // and e2e/subscribe.spec.ts to drive real Stripe test-mode API calls.
      STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ?? '',
      STRIPE_PRICE_ID: env.STRIPE_PRICE_ID ?? '',
      STRIPE_BETA_PRICE_ID: env.STRIPE_BETA_PRICE_ID ?? '',
      STRIPE_CHARITY_PRICE_ID: env.STRIPE_CHARITY_PRICE_ID ?? '',
      // Printed fresh each time `stripe listen --forward-to
      // localhost:3100/api/stripe-webhook` starts — only valid while that
      // process is running, needed for e2e/subscribe.spec.ts's real
      // checkout-to-webhook round trip.
      STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET ?? '',
    },
  },
})
