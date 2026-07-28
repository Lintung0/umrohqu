import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateOtp } from "@/lib/services/otp-store"
import { sendOtpWhatsApp } from "@/lib/services/whatsapp"
import { z } from "zod"

const schema = z.object({
  phone: z.string().min(9, "Nomor telepon tidak valid").max(15),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { phone } = parsed.data

    const adminClient = createAdminClient()
    const { data: existing } = await adminClient.from("users").select("id, full_name").eq("phone", phone).maybeSingle()
    if (!existing) {
      return NextResponse.json({ error: "Nomor telepon tidak terdaftar." }, { status: 404 })
    }

    const code = await generateOtp(phone)

    await sendOtpWhatsApp({ phone, code, name: existing.full_name || undefined })

    return NextResponse.json({ success: true, message: "Kode OTP telah dikirim via WhatsApp." })
  } catch (err) {
    console.error("send-otp error:", err)
    return NextResponse.json({ error: "Gagal mengirim OTP. Silakan coba lagi." }, { status: 500 })
  }
}
