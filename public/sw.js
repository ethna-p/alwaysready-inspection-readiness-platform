/**
 * AlwaysReady Service Worker
 *
 * Strategy:
 *   - Static assets (JS, CSS, fonts, images): cache-first with background revalidation
 *   - Navigation requests (HTML pages): network-first, fall back to offline page
 *   - Supabase API calls: network-only (never cache sensitive compliance data)
 */

const CACHE_NAME = 'alwaysready-v1'

const STATIC_PRECACHE = [
  '/offline',
]

// Install: precache the offline fallback page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_PRECACHE))
  )
  self.skipWaiting()
})

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept: Supabase API, auth callbacks, API routes
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // Static assets: cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
        return cached ?? networkFetch
      })
    )
    return
  }

  // Navigation (HTML): network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline').then(r => r ?? Response.error())
      )
    )
    return
  }
})
