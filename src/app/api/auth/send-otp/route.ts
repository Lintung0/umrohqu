import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateOtp } from "@/lib/services/otp-store"
import { sendOtpWhatsApp } from "@/lib/services/whatsapp"
import { z } from "zod"
import { normalizePhone } from "@/lib/utils/phone"

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
    const normalizedPhone = normalizePhone(phone)

    const adminClient = createAdminClient()
    const { data: existing } = await adminClient.from("users").select("id, full_name").eq("phone", normalizedPhone).maybeSingle()
    if (!existing) {
      return NextResponse.json({ error: "Nomor telepon tidak terdaftar." }, { status: 404 })
    }

    const code = await generateOtp(normalizedPhone)

    await sendOtpWhatsApp({ phone: normalizedPhone, code, name: existing.full_name || undefined })

    return NextResponse.json({ success: true, message: "Kode OTP telah dikirim via WhatsApp." })
  } catch (err) {
    console.error("send-otp error:", err)
    return NextResponse.json({ error: "Gagal mengirim OTP. Silakan coba lagi." }, { status: 500 })
  }
}
