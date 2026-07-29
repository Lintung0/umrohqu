import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { verifyOtp } from "@/lib/services/otp-store"
import { z } from "zod"
import { normalizePhone } from "@/lib/utils/phone"

const schema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6, "Kode OTP harus 6 digit"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { phone, code, password } = parsed.data
    const normalizedPhone = normalizePhone(phone)

    const otpResult = await verifyOtp(normalizedPhone, code)
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.reason || "Kode OTP tidak valid." }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: users } = await adminClient.from("users").select("id").eq("phone", normalizedPhone).maybeSingle()
    if (!users) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 })
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(users.id, { password })

    if (updateError) {
      console.error("Reset password error:", updateError)
      return NextResponse.json({ error: "Gagal mengubah kata sandi." }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diubah." })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 })
  }
}
