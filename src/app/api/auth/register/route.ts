import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendVerificationEmail } from "@/lib/email/resend"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
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
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Data tidak valid"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const lowerEmail = email.toLowerCase().trim()
    const adminClient = createAdminClient()

    // Determine base redirect URL
    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
      "https://umrahqu.com"

    const redirectUrl = `${origin}/auth/callback`

    // Generate signup link (creates user in auth.users without GoTrue SMTP dependency)
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: lowerEmail,
      password,
      options: {
        data: { full_name: name.trim() },
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      const errorMsg = error.message.toLowerCase()

      // If user is already registered in auth.users
      if (errorMsg.includes("already") || errorMsg.includes("duplicate") || errorMsg.includes("exists")) {
        // Attempt to send a fresh verification link so unverified existing users can still complete signup
        try {
          const magicRes = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: lowerEmail,
            options: {
              redirectTo: redirectUrl,
            },
          })

          if (magicRes.data?.properties?.hashed_token || magicRes.data?.properties?.action_link) {
            const verificationUrl = magicRes.data.properties?.hashed_token
              ? `${origin}/auth/callback?token_hash=${magicRes.data.properties.hashed_token}&type=${magicRes.data.properties.verification_type || "magiclink"}`
              : normalizeVerificationLink(magicRes.data.properties.action_link)

            await sendVerificationEmail({
              to: lowerEmail,
              name,
              verificationUrl,
            })

            return NextResponse.json({
              success: true,
              email: lowerEmail,
              message: "Akun dengan email ini sudah terdaftar. Kami telah mengirimkan tautan konfirmasi baru ke email Anda.",
            })
          }
        } catch (resendErr) {
          console.error("Failed to generate fallback link for existing user:", resendErr)
        }

        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan masuk atau gunakan fitur lupa kata sandi." },
          { status: 409 },
        )
      }

      console.error("[Register] Error generating link:", error)
      return NextResponse.json(
        { error: error.message || "Terjadi kesalahan saat pendaftaran." },
        { status: 500 },
      )
    }

    if (!data?.user?.id) {
      return NextResponse.json(
        { error: "Gagal membuat akun pendaftaran." },
        { status: 500 },
      )
    }

    // Upsert into public.users
    const { error: upsertError } = await adminClient.from("users").upsert(
      {
        id: data.user.id,
        email: lowerEmail,
        full_name: name.trim(),
        role: "customer",
      },
      { onConflict: "id", ignoreDuplicates: true },
    )

    if (upsertError) {
      console.warn("[Register] Public users upsert warning:", upsertError.message)
    }

    // Build direct application verification URL (pointing directly to localhost / umrahqu.com instead of db.umrahqu.com)
    const verificationUrl = data.properties?.hashed_token
      ? `${origin}/auth/callback?token_hash=${data.properties.hashed_token}&type=${data.properties.verification_type || "signup"}`
      : normalizeVerificationLink(data.properties.action_link)

    // Send confirmation email via Resend
    const emailResult = await sendVerificationEmail({
      to: lowerEmail,
      name: name.trim(),
      verificationUrl,
    })

    if (!emailResult.success) {
      console.error("[Register] Failed to send email via Resend:", emailResult.error)
      return NextResponse.json(
        {
          error: "Pendaftaran berhasil, namun gagal mengirim email verifikasi: " + (emailResult.error || "Gagal mengirim email"),
          email: lowerEmail,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      email: lowerEmail,
      userId: data.user.id,
    })
  } catch (err) {
    console.error("[Register] Exception:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
