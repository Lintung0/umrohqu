import { createHash, timingSafeEqual } from "node:crypto"

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

// Verifikasi signatureKey notifikasi Midtrans:
// SHA512(order_id + status_code + gross_amount + serverKey).
// WAJIB lolos sebelum notifikasi diproses — tanpa ini siapa pun bisa
// POST settlement palsu dan booking jadi terbayar tanpa uang masuk.
export function verifyNotificationSignature(notification: {
  order_id?: string
  status_code?: string
  gross_amount?: string | number
  signature_key?: string
}): boolean {
  const { order_id, status_code, gross_amount, signature_key } = notification
  if (!order_id || !status_code || gross_amount === undefined || !signature_key || !MIDTRANS_SERVER_KEY) {
    return false
  }
  const expected = createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`)
    .digest("hex")
  if (expected.length !== signature_key.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature_key, "hex"))
  } catch {
    return false
  }
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

// ---------- IRIS Payouts (disbursement) ----------
// Diaktifkan via env MIDTRANS_IRIS_ENABLED=true. Tanpa env tersebut,
// pencairan dicatat manual (placeholder ref, tidak memanggil API eksternal).

const MIDTRANS_IRIS_ENABLED = process.env.MIDTRANS_IRIS_ENABLED === "true"

const IRIS_BANK_MAP: Record<string, string> = {
  "014": "bca",
  "008": "mandiri",
  "002": "bri",
  "009": "bni",
  "451": "bsi",
  "013": "permata",
  "022": "cimbniaga",
  "200": "btn",
  "011": "danamon",
  "016": "maybank",
}

export function isIrisEnabled(): boolean {
  return MIDTRANS_IRIS_ENABLED && Boolean(MIDTRANS_SERVER_KEY)
}

export function irisBankCode(bankCode: string): string {
  const code = IRIS_BANK_MAP[bankCode]
  if (!code) throw new Error(`Kode bank ${bankCode} belum terdaftar untuk IRIS`)
  return code
}

async function getIrisAccessToken(): Promise<string> {
  const res = await fetch(`${baseUrl()}/iris/api/v1/access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`IRIS access token failed: ${text}`)
  }
  const json = await res.json()
  return json.access_token as string
}

export interface IrisPayoutResult {
  id: string
  reference_no: string
  status: string
}

export async function createIrisPayout(params: {
  referenceNo: string
  bankCode: string
  accountNumber: string
  accountHolderName: string
  amount: number
  note?: string
}): Promise<IrisPayoutResult> {
  const token = await getIrisAccessToken()
  const res = await fetch(`${baseUrl()}/iris/api/v1/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reference_no: params.referenceNo,
      disbursement_type: "cashout",
      beneficiary_bank: irisBankCode(params.bankCode),
      beneficiary_account: params.accountNumber,
      beneficiary_name: params.accountHolderName,
      amount: Math.round(params.amount),
      notes: params.note || "Pencairan cashback UmrahQu",
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(`IRIS payout failed: ${JSON.stringify(json || res.status)}`)
  }

  return {
    id: String(json.id || ""),
    reference_no: String(json.reference_no || params.referenceNo),
    status: String(json.status || "pending"),
  }
}
