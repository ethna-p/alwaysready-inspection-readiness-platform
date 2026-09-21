import { describe, it, expect } from 'vitest'
import { buildCsp, newNonce } from '../csp'

function directive(csp: string, name: string): string {
  return csp.split('; ').find(d => d.startsWith(name + ' ')) ?? ''
}

describe('buildCsp', () => {
  const prod = buildCsp('abc123', false)

  it('allows scripts only with the nonce (or a nonced loader), never unsafe-inline or unsafe-eval, in production', () => {
    const script = directive(prod, 'script-src')
    expect(script).toContain("'nonce-abc123'")
    expect(script).toContain("'strict-dynamic'")
    expect(script).not.toContain('unsafe-inline')
    expect(script).not.toContain('unsafe-eval')
  })

  it('allows unsafe-eval for scripts in development only (React needs it there)', () => {
    expect(directive(buildCsp('n', true), 'script-src')).toContain("'unsafe-eval'")
    expect(directive(buildCsp('n', true), 'script-src')).not.toContain('unsafe-inline')
  })

  it('locks down object, base and framing, and upgrades insecure requests only in production', () => {
    expect(prod).toContain("object-src 'none'")
    expect(prod).toContain("base-uri 'self'")
    expect(prod).toContain("frame-ancestors 'none'")
    expect(prod).toContain('upgrade-insecure-requests')
    expect(buildCsp('n', true)).not.toContain('upgrade-insecure-requests')
  })

  it('lets the Turnstile challenge iframe load (the bot check on /trial)', () => {
    expect(directive(prod, 'frame-src')).toBe('frame-src https://challenges.cloudflare.com')
  })

  it('keeps the services the browser talks to', () => {
    const connect = directive(prod, 'connect-src')
    for (const host of ['https://*.supabase.co', 'wss://*.supabase.co', 'https://*.ingest.de.sentry.io']) {
      expect(connect).toContain(host)
    }
    expect(directive(prod, 'worker-src')).toContain('blob:')
  })
})

describe('newNonce', () => {
  it('is different every time and safe to put in a header', () => {
    const a = newNonce(), b = newNonce()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/)
  })
})
