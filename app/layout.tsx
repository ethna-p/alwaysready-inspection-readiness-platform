import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlwaysReady — Inspection Readiness Platform",
  description:
    "Inspection readiness tools for CQC-regulated adult social care providers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-[#1a1a1a]">
        {children}
      </body>
    </html>
  );
}
