"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Locale, Translations } from "./i18n-types"

type I18nContext = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  dir: "ltr" | "rtl"
}

const I18nContext = createContext<I18nContext | null>(null)

const LOCALE_COOKIE = "umrahqu_locale"

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "id"
  const cookie = document.cookie
    .split("; ")
    .find((r) => r.startsWith(LOCALE_COOKIE + "="))
  if (cookie) {
    const val = cookie.split("=")[1] as Locale
    if (["id", "en", "ar"].includes(val)) return val
  }
  const browserLang = navigator.language?.slice(0, 2)
  if (["id", "en", "ar"].includes(browserLang)) return browserLang as Locale
  return "id"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id")
  const [t, setT] = useState<Translations>({} as Translations)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getInitialLocale()
    setLocaleState(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    import(`../locales/${locale}.json`).then((mod) => setT(mod.default))
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}
