"use client"

import { useTranslation } from "@/lib/i18n"
import { LOCALES } from "@/lib/i18n-types"
import { Globe, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function CompactLanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LOCALES.find((l) => l.code === locale)

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
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Globe className="w-4 h-4" />
        <span>{current?.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[150px] max-h-60 overflow-y-auto">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                locale === l.code ? "font-semibold text-emerald-700 bg-emerald-50" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{l.code === "id" ? "🇮🇩" : l.code === "en" ? "🇬🇧" : "🇸🇦"}</span>
              <span>{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
