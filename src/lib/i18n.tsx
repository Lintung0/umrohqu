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
  let value: unknown = translations
  for (const k of keys) {
    if (value == null || typeof value !== "object") return key
    value = (value as Record<string, unknown>)[k]
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
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver)
      if (typeof prop === "string") {
        const val: unknown = (translations as unknown as Record<string, unknown>)[prop]
        if (val && typeof val === "object") {
          return createTFunction(val as Translations)
        }
        return val ?? prop
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as TFunction
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Lazily initialized from cookie/navigator during render instead of via a
  // mount effect; id translations are the built-in default.
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())
  const [cached, setCached] = useState<{ locale: Locale; translations: Translations } | null>(null)

  // Derived during render: id always uses the bundled strings, a non-id
  // locale uses its loaded chunk once cached (id as fallback meanwhile).
  const translations: Translations =
    locale === "id" || cached?.locale !== locale
      ? (idTranslations as Translations)
      : cached.translations

  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
    if (locale === "id" || cached?.locale === locale) return
    // Async continuation with cancellation guard: setCached runs only
    // after the locale chunk resolves, never synchronously in the effect.
    let cancelled = false
    ;(async () => {
      const mod = await import(`../locales/${locale}.json`)
      if (!cancelled) setCached({ locale, translations: mod.default as Translations })
    })()
    return () => {
      cancelled = true
    }
  }, [locale, cached])

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
