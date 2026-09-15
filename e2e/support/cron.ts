/**
 * The test-only CRON_SECRET value playwright.config.ts's webServer sets
 * for the six /api/cron/* routes -- see that file's own comment for why
 * this is safe to hardcode (an app-internal bearer token, not a
 * third-party credential).
 */
export const CRON_SECRET = 'e2e-test-cron-secret-2f8a4c1d'
