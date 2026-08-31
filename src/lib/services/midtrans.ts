const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || ""
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true"

function baseUrl() {
  return MIDTRANS_IS_PRODUCTION ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com"
}

function snapUrl() {
  return MIDTRANS_IS_PRODUCTION ? "https://app.midtrans.com/snap/v1" : "https://app.sandbox.midtrans.com/snap/v1"
}

function authHeader() {
  return "Basic " + Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")
}

export interface MidtransSnapToken {
  token: string
  redirect_url: string
}

export async function createSnapTransaction(params: {
  orderId: string
  grossAmount: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  items?: { id: string; name: string; price: number; quantity: number }[]
  enabledPayments?: string[]
  finishUrl?: string
  unfinishUrl?: string
  errorUrl?: string
}): Promise<MidtransSnapToken> {
  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
  }
  if (params.items && params.items.length > 0) {
    payload.item_details = params.items.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    }))
  }
  if (params.enabledPayments && params.enabledPayments.length > 0) {
    payload.enabled_payments = params.enabledPayments
  }
  if (params.finishUrl || params.unfinishUrl || params.errorUrl) {
    payload.callbacks = {
      finish: params.finishUrl,
      unfinish: params.unfinishUrl,
      error: params.errorUrl,
    }
  }

  const res = await fetch(`${snapUrl()}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Midtrans Snap create failed: ${body}`)
  }

  const json = await res.json()
  return { token: json.token, redirect_url: json.redirect_url }
}

export async function getTransactionStatus(orderId: string) {
  const res = await fetch(`${baseUrl()}/v2/${orderId}/status`, {
    headers: { Authorization: authHeader() },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Midtrans get status failed: ${body}`)
  }

  return res.json()
}

export function isSuccessStatus(status: string): boolean {
  const success = ["capture", "settlement"]
  return success.includes(status)
}

export function isPendingStatus(status: string): boolean {
  return ["pending", "authorize", "capture", "settlement", "challenge"].includes(status)
}

export function stablePaymentType(raw: string): string {
  // Midtrans returns payment_type like bank_transfer, credit_card, gopay, shopeepay,
  // qris, dana, ovo, echannel, cstore, akulaku, kredivo, bca_klikpay, etc.
  if (!raw) return "bank_transfer"
  if (raw === "bank_transfer" || raw === "echannel" || raw === "cstore") return raw
  if (raw === "credit_card") return "credit_card"
  // e-wallets / others
  return raw.toLowerCase()
}
