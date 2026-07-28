import { createAdminClient } from "@/lib/supabase/server"

const OTP_TTL = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function generateOtp(phone: string, purpose = "password_reset"): Promise<string> {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + OTP_TTL).toISOString()

  const admin = createAdminClient()
  await admin.from("otp_codes").insert({
    phone,
    code,
    purpose,
    expires_at: expiresAt,
  })

  return code
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose = "password_reset",
): Promise<{ valid: boolean; reason?: string }> {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .is("verified_at", null)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)

  const otp = rows?.[0]
  if (!otp) return { valid: false, reason: "Kode OTP tidak ditemukan atau sudah kadaluwarsa." }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: "Terlalu banyak percobaan. Silakan kirim ulang OTP." }
  }

  await admin.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id)

  if (otp.code !== code) return { valid: false, reason: "Kode OTP salah." }

  await admin.from("otp_codes").update({ verified_at: new Date().toISOString() }).eq("id", otp.id)
  return { valid: true }
}

export async function clearOtp(phone: string, purpose = "password_reset"): Promise<void> {
  const admin = createAdminClient()
  await admin.from("otp_codes").delete().eq("phone", phone).eq("purpose", purpose)
}
