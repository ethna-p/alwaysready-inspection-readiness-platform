/**
 * lib/rate-limit.ts
 *
 * Lightweight in-memory rate limiter for public API endpoints.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 })
 *   if (!limiter.check(ip)) return new NextResponse('Too Many Requests', { status: 429 })
 *
 * Implementation notes:
 * - Each serverless function instance has its own Map, so the limit is
 *   per-instance, not global. This is fine — it catches rapid burst attacks
 *   from a single IP within one instance, which is the most common case.
 * - The Map is pruned when it grows large to prevent unbounded memory use.
 */

import { NextRequest } from 'next/server'

export interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests per IP per window */
  max: number
}

export interface RateLimiter {
  /** Returns true if the request is allowed; false if it should be blocked. */
  check: (ip: string) => boolean
}

/** Extract the best available client IP from an incoming Next.js request. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Factory — call once at module level so the Map persists across requests. */
export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  const store = new Map<string, number[]>()

  return {
    check(ip: string): boolean {
      const now = Date.now()
      const window = (store.get(ip) ?? []).filter(t => now - t < windowMs)

      if (window.length >= max) return false // blocked

      window.push(now)
      store.set(ip, window)

      // Prune stale entries periodically to prevent unbounded Map growth
      if (store.size > 5_000) {
        for (const [k, v] of store) {
          if (v.every(t => now - t >= windowMs)) store.delete(k)
        }
      }

      return true // allowed
    },
  }
}
