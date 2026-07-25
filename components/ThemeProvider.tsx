'use client'

/**
 * ThemeProvider — wraps the app with next-themes.
 * Must be a client component; placed in the root layout.
 * Uses the 'class' strategy so Tailwind's dark: variants activate
 * when next-themes adds the 'dark' class to <html>.
 */
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
