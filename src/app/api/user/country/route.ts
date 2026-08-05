import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAseanCountryByCode } from "@/lib/constants"
import { setCountryCookie, getCountryFromRequest } from "@/lib/country"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("country")
        .eq("id", user.id)
        .single()

      if (profile?.country && getAseanCountryByCode(profile.country)) {
        return NextResponse.json({ country: profile.country })
      }
    }

    const cookieCountry = await getCountryFromRequest()
    return NextResponse.json({ country: cookieCountry })
  } catch {
    return NextResponse.json({ country: "id" })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { country } = body

    if (!country || !getAseanCountryByCode(country)) {
      return NextResponse.json({ error: "Invalid country code" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from("users")
        .update({ country })
        .eq("id", user.id)
    }

    await setCountryCookie(country)

    return NextResponse.json({ success: true, country })
  } catch {
    return NextResponse.json({ error: "Failed to save country" }, { status: 500 })
  }
}
