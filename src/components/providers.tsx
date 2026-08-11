"use client"

import { I18nProvider } from "@/lib/i18n"
import { CompareProvider } from "@/lib/compare-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CompareProvider>{children}</CompareProvider>
    </I18nProvider>
  )
}
