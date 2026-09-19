"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { Locale, Translations, TFunction } from "./i18n-types"
import idTranslations from "../locales/id.json"

type I18nContext = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TFunction
  dir: "ltr" | "rtl"
}

const I18nContext = createContext<I18nContext | null>(null)

const LOCALE_COOKIE = "umrahqu_locale"

function getInitialLocale(): Locale {
  // Market Indonesia — bahasa terkunci ke Bahasa Indonesia.
  return "id"
}

function resolveT(translations: Translations, key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".")
  let value: any = translations
  for (const k of keys) {
    if (value == null || typeof value !== "object") return key
    value = value[k]
  }
  if (typeof value !== "string") return key
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ""))
  }
  return value
}

function createTFunction(translations: Translations): TFunction {
  const fn = (key: string, params?: Record<string, string | number>) => resolveT(translations, key, params)
  return new Proxy(fn, {
    get(target, prop) {
      if (prop in target) return (target as any)[prop]
      if (typeof prop === "string") {
        const val = (translations as any)[prop]
        if (val && typeof val === "object") {
          return createTFunction(val as any)
        }
        return val ?? prop
      }
      return (translations as any)[prop]
    },
  }) as TFunction
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id")
  const [translations, setTranslations] = useState<Translations>(idTranslations as Translations)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getInitialLocale()
    setLocaleState(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (locale === "id") {
      setTranslations(idTranslations as Translations)
    } else {
      import(`../locales/${locale}.json`).then((mod) => setTranslations(mod.default))
    }
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  const dir = locale === "ar" ? "rtl" : "ltr"

  const t = useMemo(() => createTFunction(translations), [translations])

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
