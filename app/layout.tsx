import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ThemeProvider from "@/components/ThemeProvider";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "AlwaysReady — Inspection Readiness Platform",
  description:
    "Inspection readiness tools for CQC-regulated adult social care providers.",
  openGraph: {
    title: "AlwaysReady — Inspection Readiness Platform",
    description: "Inspection readiness tools for CQC-regulated adult social care providers.",
    url: "https://portal.alwaysready.uk",
    siteName: "AlwaysReady",
    images: [{ url: "https://portal.alwaysready.uk/opengraph-image.png?v=3", width: 1200, height: 630, alt: "AlwaysReady — Inspection Readiness Platform" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlwaysReady — Inspection Readiness Platform",
    description: "Inspection readiness tools for CQC-regulated adult social care providers.",
    images: ["https://portal.alwaysready.uk/opengraph-image.png?v=3"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlwaysReady",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Every page is rendered per request. The Content-Security-Policy carries a fresh nonce for each one
// (middleware.ts, lib/csp.ts), and Next.js can only stamp a nonce on a page rendered at request time.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#014D4E",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <ThemeProvider nonce={nonce}>
          <ServiceWorkerRegistration />
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
