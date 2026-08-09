"use client"

import { useTranslation } from "@/lib/i18n"
import { LOCALES } from "@/lib/i18n-types"
import { Languages, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALES.find((l) => l.code === locale)?.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px] max-h-60 overflow-y-auto">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                locale === l.code ? "font-semibold text-emerald-700 bg-emerald-50" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{l.code === "id" ? "🇮🇩" : l.code === "en" ? "🇬🇧" : "🇸🇦"}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
