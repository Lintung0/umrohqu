import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { external_id, status, id: invoiceId } = body

    if (!external_id || !external_id.startsWith("topup-")) {
      return NextResponse.json({ received: true })
    }

    if (status !== "PAID") {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    const { data: tx } = await supabase
      .from("wallet_transactions")
      .select("id, user_id, amount, status")
      .eq("xendit_invoice_id", invoiceId)
      .single()

    if (!tx || tx.status !== "pending") {
      return NextResponse.json({ received: true })
    }

    await supabase.rpc("topup_wallet", {
      p_user_id: tx.user_id,
      p_amount: tx.amount,
      p_xendit_invoice_id: invoiceId,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Xendit callback error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
