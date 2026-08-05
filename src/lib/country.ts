import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/server"
import { ASEAN_COUNTRIES, getAseanCountryByCode } from "@/lib/constants"

const COUNTRY_COOKIE = "umrohq_country"
const DEFAULT_COUNTRY = "id"

export async function getCountryFromRequest(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const cookieCountry = cookieStore.get(COUNTRY_COOKIE)?.value
    if (cookieCountry && getAseanCountryByCode(cookieCountry)) {
      return cookieCountry
    }
  } catch {}
  return DEFAULT_COUNTRY
}

export async function setCountryCookie(countryCode: string): Promise<void> {
  const country = getAseanCountryByCode(countryCode)
  if (!country) return

  try {
    const cookieStore = await cookies()
    cookieStore.set(COUNTRY_COOKIE, country.code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  } catch {}
}

export async function getUserCountry(userId?: string | null): Promise<string> {
  if (!userId) return getCountryFromRequest()

  try {
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from("users")
      .select("country")
      .eq("id", userId)
      .single()

    if (profile?.country && getAseanCountryByCode(profile.country)) {
      return profile.country
    }
  } catch {}

  return getCountryFromRequest()
}

export async function saveUserCountry(userId: string | null, countryCode: string): Promise<void> {
  const country = getAseanCountryByCode(countryCode)
  if (!country) return

  if (userId) {
    try {
      const supabase = createAdminClient()
      await supabase
        .from("users")
        .update({ country: country.code })
        .eq("id", userId)
    } catch {}
  }

  await setCountryCookie(country.code)
}

export function getCountryCodeFromName(name: string): string {
  const country = ASEAN_COUNTRIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  )
  return country?.code || DEFAULT_COUNTRY
}

export function getCountryNameFromCode(code: string): string {
  const country = getAseanCountryByCode(code)
  return country?.name || "Indonesia"
}
