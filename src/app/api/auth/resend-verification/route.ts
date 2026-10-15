import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendVerificationEmail } from "@/lib/email/resend"
import { z } from "zod"

const resendSchema = z.object({
  email: z.string().email("Email tidak valid"),
})

function normalizeVerificationLink(rawLink: string): string {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://db.umrahqu.com").replace(/\/$/, "")
  if (rawLink.startsWith("https:///") || rawLink.startsWith("http:///")) {
    return rawLink.replace(/^https?:\/\/\//, `${supabaseUrl}/`)
  }
  if (rawLink.startsWith("/")) {
    return `${supabaseUrl}${rawLink}`
  }
  return rawLink
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 })
    }

    const { email } = parsed.data
    const lowerEmail = email.toLowerCase().trim()
    const adminClient = createAdminClient()

    // Get user details if available
    const { data: userData } = await adminClient
      .from("users")
      .select("full_name")
      .eq("email", lowerEmail)
      .maybeSingle()

    const name = userData?.full_name || "Sahabat Umrahqu"

    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
      "https://umrahqu.com"

    const redirectUrl = `${origin}/auth/callback`

    // Generate fresh magiclink/verification link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: lowerEmail,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error || (!data?.properties?.hashed_token && !data?.properties?.action_link)) {
      console.error("[Resend-Verification] Failed to generate link:", error)
      return NextResponse.json(
        { error: "Gagal membuat tautan verifikasi baru. Pastikan email terdaftar." },
        { status: 400 },
      )
    }

    // Build direct application verification URL (pointing directly to localhost / umrahqu.com instead of db.umrahqu.com)
    const verificationUrl = data.properties?.hashed_token
      ? `${origin}/auth/callback?token_hash=${data.properties.hashed_token}&type=${data.properties.verification_type || "magiclink"}`
      : normalizeVerificationLink(data.properties.action_link)

    const emailResult = await sendVerificationEmail({
      to: lowerEmail,
      name,
      verificationUrl,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Gagal mengirim email verifikasi." },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Email verifikasi berhasil dikirimkan kembali.",
    })
  } catch (err) {
    console.error("[Resend-Verification] Exception:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    )
  }
}
