import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user) {
        const adminClient = createAdminClient()
        const { id, email, user_metadata } = data.user

        const { error: upsertError } = await adminClient.from("users").upsert({
          id,
          email: email!,
          full_name: user_metadata?.full_name || email!.split("@")[0],
          role: "customer",
        }, { onConflict: "id", ignoreDuplicates: true })

        if (upsertError) {
          console.error("Callback upsert error:", upsertError)
        }

        return NextResponse.redirect(`${origin}${next}`)
      }

      if (error) {
        console.error("Auth callback error:", error.message)
      }
    } catch (err) {
      console.error("Auth callback exception:", err)
    }
  }

  const redirected = searchParams.get("redirected")
  if (!redirected) {
    const url = new URL(request.url)
    url.searchParams.set("redirected", "1")
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
