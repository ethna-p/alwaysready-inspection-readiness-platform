import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer as a native Node module — it uses Node APIs
  // that can't be bundled by the Next.js webpack config.
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    // Inline critical CSS and lazy-load the rest, eliminating render-blocking
    // stylesheet requests. Requires `critters` devDependency.
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent this site from being embedded in an iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Prevent browsers from MIME-sniffing a response away from the declared content-type
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Control how much referrer information is included with requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Disable browser features that aren't needed
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },

          // Force HTTPS for 2 years; include subdomains; eligible for preload list
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // Content-Security-Policy is set per request in middleware.ts (lib/csp.ts): it needs a fresh nonce.
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation and project slugs (set in sentry.io)
  org: 'alwaysready',
  project: 'alwaysready-platform',

  // Suppress verbose build output
  silent: !process.env.CI,

  // Upload a wider set of source maps (helps with minified stack traces)
  widenClientFileUpload: true,

  // Don't expose source maps in the client bundle — upload to Sentry only
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  webpack: {
    // Tree-shake Sentry logger statements out of the production bundle
    treeshake: { removeDebugLogging: true },

    // Automatically instrument Next.js data fetching methods for performance monitoring
    autoInstrumentServerFunctions: true,

    // Middleware is already manually wrapped with wrapMiddlewareWithSentry —
    // disable auto-instrumentation to prevent the proxy.ts conflict error.
    autoInstrumentMiddleware: false,
  },
});
