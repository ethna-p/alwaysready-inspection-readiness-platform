import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

          // Content Security Policy
          // Note: Next.js App Router requires 'unsafe-inline' and 'unsafe-eval' for
          // its built-in script optimisation. These will be removable once Next.js
          // ships stable nonce/hash support in the App Router.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              // Supabase (auth, database), Anthropic (newsletter AI)
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
              // No iframes anywhere — same effect as X-Frame-Options above, but CSP version
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
