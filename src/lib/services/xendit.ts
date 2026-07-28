const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY || ""
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function authHeader() {
  return "Basic " + Buffer.from(XENDIT_SECRET + ":").toString("base64")
}

export interface XenditInvoice {
  id: string
  invoice_url: string
  status: string
  external_id: string
}

export async function createInvoice(params: {
  externalId: string
  amount: number
  description: string
  customer?: { email?: string; phone?: string }
  successRedirectUrl?: string
  failureRedirectUrl?: string
}): Promise<XenditInvoice> {
  const res = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      description: params.description,
      success_redirect_url: params.successRedirectUrl || `${BASE_URL}/dashboard/bookings`,
      failure_redirect_url: params.failureRedirectUrl || `${BASE_URL}/checkout?failed=true`,
      customer: params.customer,
      currency: "IDR",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Xendit create invoice failed: ${body}`)
  }

  return res.json()
}

export async function getInvoice(invoiceId: string): Promise<XenditInvoice> {
  const res = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
    headers: { Authorization: authHeader() },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Xendit get invoice failed: ${body}`)
  }

  return res.json()
}

export function verifyWebhook(token: string): boolean {
  const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || ""
  return token === XENDIT_WEBHOOK_TOKEN
}
