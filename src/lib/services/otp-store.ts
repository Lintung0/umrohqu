const OTP_TTL = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

interface OtpEntry {
  phone: string
  code: string
  purpose: string
  expiresAt: number
  attempts: number
}

const store = new Map<string, OtpEntry>()

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function keyFor(phone: string, purpose: string): string {
  return `${phone}:${purpose}`
}

export async function generateOtp(phone: string, purpose = "password_reset"): Promise<string> {
  const code = generateCode()
  store.set(keyFor(phone, purpose), {
    phone,
    code,
    purpose,
    expiresAt: Date.now() + OTP_TTL,
    attempts: 0,
  })
  return code
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose = "password_reset",
): Promise<{ valid: boolean; reason?: string }> {
  const otp = store.get(keyFor(phone, purpose))
  if (!otp || otp.expiresAt < Date.now()) {
    if (otp) store.delete(keyFor(phone, purpose))
    return { valid: false, reason: "Kode OTP tidak ditemukan atau sudah kadaluwarsa." }
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    store.delete(keyFor(phone, purpose))
    return { valid: false, reason: "Terlalu banyak percobaan. Silakan kirim ulang OTP." }
  }

  otp.attempts += 1

  if (otp.code !== code) return { valid: false, reason: "Kode OTP salah." }

  store.delete(keyFor(phone, purpose))
  return { valid: true }
}

export async function clearOtp(phone: string, purpose = "password_reset"): Promise<void> {
  store.delete(keyFor(phone, purpose))
}