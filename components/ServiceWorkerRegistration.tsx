'use client'

/**
 * ServiceWorkerRegistration — registers the PWA service worker on mount.
 * Client component so it can access navigator. Renders nothing.
 */

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(err => console.error('[SW] Registration failed:', err))
    }
  }, [])

  return null
}
