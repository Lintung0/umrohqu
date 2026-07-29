import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = []

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach((cookie) => {
                request.cookies.set(cookie.name, cookie.value)
                pendingCookies.push(cookie)
              })
            },
          },
        },
      )

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

        const redirectResponse = NextResponse.redirect(`${origin}${next}`)
        pendingCookies.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options)
        })

        return redirectResponse
      }

      if (error) {
        console.error("Auth callback error:", error.message)
      }
    } catch (err) {
      console.error("Auth callback exception:", err)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
