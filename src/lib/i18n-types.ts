export type Locale = "id" | "en" | "ar"

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "id", label: "Indonesia", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
]

export const DEFAULT_LOCALE: Locale = "id"

export type Translations = typeof import("../locales/id.json")

export type TFunction = {
  (key: string, params?: Record<string, string | number>): string
  [key: string]: any
}
