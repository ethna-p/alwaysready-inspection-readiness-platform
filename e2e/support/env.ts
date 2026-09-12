/**
 * Minimal .env.local loader for standalone Node scripts (playwright.config.ts,
 * the seed script) that run outside Next.js's own env loading. Resolves
 * relative to the current working directory rather than import.meta.url,
 * since Playwright's config loader compiles this to CommonJS (where
 * import.meta isn't available) — everything here is always run from the
 * repo root anyway (npm scripts, playwright test).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadEnvLocal(): Record<string, string> {
  const envText = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  return Object.fromEntries(
    envText.split('\n')
      .filter(l => l.includes('=') && !l.trim().startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  )
}
