import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createInvoice } from "@/lib/services/xendit"
import { z } from "zod"

const schema = z.object({
  amount: z.number().min(10000, "Minimal topup Rp 10.000").max(100000000, "Maksimal topup Rp 100.000.000"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("email, phone")
      .eq("id", user.id)
      .single()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }

    const { amount } = parsed.data
    const externalId = `topup-${user.id}-${Date.now()}`

    const invoice = await createInvoice({
      externalId,
      amount,
      description: `Topup dompet UmrahQu Rp ${amount.toLocaleString("id-ID")}`,
      customer: {
        email: profile?.email || undefined,
        phone: profile?.phone || undefined,
      },
    })

    // Save pending transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "topup",
      amount,
      balance_before: 0,
      balance_after: 0,
      status: "pending",
      xendit_invoice_id: invoice.id,
      description: `Topup via Xendit - ${invoice.id}`,
    })

    return NextResponse.json({
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      externalId,
    })
  } catch (err) {
    console.error("Topup error:", err)
    return NextResponse.json({ error: "Gagal membuat invoice topup" }, { status: 500 })
  }
}
