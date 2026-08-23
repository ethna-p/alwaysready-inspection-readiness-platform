/**
 * lib/rate-limit.ts
 *
 * Persistent rate limiter backed by Upstash Redis when env vars are present,
 * falling back to an in-memory sliding-window implementation for local dev.
 *
 * Usage (unchanged from before):
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 })
 *   if (!limiter.check(ip)) return new NextResponse('Too Many Requests', { status: 429 })
 *
 * Production behaviour:
 *   - Uses @upstash/ratelimit with a sliding-window algorithm
 *   - State is stored in Redis so limits are enforced globally across all
 *     serverless instances and warm/cold starts
 *
 * Local dev behaviour:
 *   - Falls back to the original in-memory Map when UPSTASH_REDIS_REST_URL
 *     is not set, so no Redis account is needed to run locally
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
  check: (ip: string) => Promise<boolean>
}

/** Extract the best available client IP from an incoming Next.js request. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Factory — call once at module level so the limiter instance is reused. */
export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  // ── Upstash persistent limiter ─────────────────────────────────────────────
  if (redisUrl && redisToken) {
    // Lazy imports — only loaded when Redis is configured
    const { Redis }       = require('@upstash/redis')
    const { Ratelimit }   = require('@upstash/ratelimit')

    const redis = new Redis({ url: redisUrl, token: redisToken })

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowMs}ms` as `${number}ms`),
      analytics: false,
      prefix: 'ar:rl',
    })

    return {
      async check(ip: string): Promise<boolean> {
        try {
          const { success } = await ratelimit.limit(ip)
          return success
        } catch (err) {
          // If Redis is unreachable, fail open rather than blocking all traffic
          console.error('[rate-limit] Redis error — failing open:', err)
          return true
        }
      },
    }
  }

  // ── In-memory fallback (local dev) ─────────────────────────────────────────
  const store = new Map<string, number[]>()

  return {
    async check(ip: string): Promise<boolean> {
      const now    = Date.now()
      const window = (store.get(ip) ?? []).filter(t => now - t < windowMs)

      if (window.length >= max) return false

      window.push(now)
      store.set(ip, window)

      // Prune stale entries to prevent unbounded Map growth
      if (store.size > 5_000) {
        for (const [k, v] of store) {
          if (v.every(t => now - t >= windowMs)) store.delete(k)
        }
      }

      return true
    },
  }
}
