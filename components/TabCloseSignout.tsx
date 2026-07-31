'use client'

/**
 * TabCloseSignout — zero-render security component.
 *
 * Listens for the `pagehide` event, which fires when the user closes the tab,
 * closes the browser window, or hard-refreshes the page. On that event it
 * calls navigator.sendBeacon() to POST to /api/signout-beacon, which revokes
 * the Supabase session server-side.
 *
 * Note: `pagehide` also fires on hard refresh, so the user will be signed out
 * and prompted to log in again after refreshing. This is intentional for a
 * shared-device security model.
 *
 * Client-side navigation within the platform (Next.js soft navigation) does
 * NOT trigger `pagehide`, so normal in-app navigation is unaffected.
 */
import { useEffect } from 'react'

export default function TabCloseSignout() {
  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      // event.persisted = true means the browser is saving the page to
      // the back/forward cache (bfcache) — e.g. Mac sleep, tab suspension,
      // or the browser optimising back-button navigation.  The user hasn't
      // left; don't revoke their session.  Only fire the beacon when the
      // page is genuinely being unloaded (tab close, hard navigation away).
      if (!event.persisted) {
        navigator.sendBeacon('/api/signout-beacon')
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [])

  return null
}
