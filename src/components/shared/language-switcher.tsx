"use client"

import { useTranslation } from "@/lib/i18n"
import { LOCALES } from "@/lib/i18n-types"
import { Languages } from "lucide-react"
import { useState } from "react"

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALES.find((l) => l.code === locale)?.label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                  locale === l.code ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
