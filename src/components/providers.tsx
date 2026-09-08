"use client"

import { ThemeProvider } from "next-themes"
import { I18nProvider } from "@/lib/i18n"
import { CompareProvider } from "@/lib/compare-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <I18nProvider>
        <CompareProvider>{children}</CompareProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
