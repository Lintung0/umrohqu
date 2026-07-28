export type WhatsAppProvider = "console" | "twilio" | "meta"

interface SendOtpParams {
  phone: string
  code: string
  name?: string
}

function getProvider(): WhatsAppProvider {
  const p = process.env.WHATSAPP_PROVIDER
  if (p === "twilio" || p === "meta") return p
  return "console"
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return "62" + digits.slice(1)
  if (digits.startsWith("62")) return digits
  return "62" + digits
}

async function sendViaConsole({ phone, code }: SendOtpParams): Promise<void> {
  console.log("========================================")
  console.log("[WHATSAPP DEV] OTP to:", phone)
  console.log("[WHATSAPP DEV] Code :", code)
  console.log("[WHATSAPP DEV] Message: Kode OTP Anda adalah", code)
  console.log("========================================")
}

async function sendViaTwilio({ phone, code }: SendOtpParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials not configured")
  }

  const to = `whatsapp:${formatPhone(phone)}`
  const msg = `Kode OTP UmrohQ Anda: ${code}\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapapun.`

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    body: new URLSearchParams({ To: to, From: from, Body: msg }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Twilio error: ${body}`)
  }
}

async function sendViaMeta({ phone, code }: SendOtpParams): Promise<void> {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    throw new Error("Meta WhatsApp credentials not configured")
  }

  const to = formatPhone(phone)
  const template = process.env.META_OTP_TEMPLATE || "otp"

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: "id" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta WhatsApp error: ${body}`)
  }
}

const senders: Record<WhatsAppProvider, (p: SendOtpParams) => Promise<void>> = {
  console: sendViaConsole,
  twilio: sendViaTwilio,
  meta: sendViaMeta,
}

export async function sendOtpWhatsApp(params: SendOtpParams): Promise<void> {
  const provider = getProvider()
  await senders[provider](params)
}
