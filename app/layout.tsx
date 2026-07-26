import type { Metadata, Viewport } from "next";
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
    images: [{ url: "https://portal.alwaysready.uk/opengraph-image.png", width: 512, height: 512, alt: "AlwaysReady — Inspection Readiness Platform" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AlwaysReady — Inspection Readiness Platform",
    description: "Inspection readiness tools for CQC-regulated adult social care providers.",
    images: ["https://portal.alwaysready.uk/opengraph-image.png"],
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

export const viewport: Viewport = {
  themeColor: "#014D4E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <ThemeProvider>
          <ServiceWorkerRegistration />
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
