'use client'

/**
 * ThemeProvider — wraps the app with next-themes.
 * Must be a client component; placed in the root layout.
 * Uses the 'class' strategy so Tailwind's dark: variants activate
 * when next-themes adds the 'dark' class to <html>.
 */
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export default function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider
      // next-themes puts a small inline script in the page (to set light/dark before first paint).
      // Under the Content-Security-Policy that script only runs if it carries this request's nonce.
      nonce={nonce}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
