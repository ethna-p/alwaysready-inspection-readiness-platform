'use client'

/**
 * /offline — shown by the service worker when the user is offline
 * and the requested page isn't cached.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#014D4E] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#014D4E] mb-2">You&apos;re offline</h1>
        <p className="text-sm text-gray-600 mb-6">
          AlwaysReady needs an internet connection to load your compliance data.
          Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-[#014D4E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#013838] transition-colors focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
