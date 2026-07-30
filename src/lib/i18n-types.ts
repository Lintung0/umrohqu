export type Locale = "id" | "en" | "ar"

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "id", label: "Indonesia", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
]

export const DEFAULT_LOCALE: Locale = "id"

export type Translations = typeof import("../locales/id.json")
