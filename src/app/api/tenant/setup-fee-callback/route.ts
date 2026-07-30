import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { external_id, status } = body

    if (!external_id || !external_id.startsWith("setupfee-")) {
      return NextResponse.json({ received: true })
    }

    if (status !== "PAID") {
      return NextResponse.json({ received: true })
    }

    const parts = external_id.split("-")
    const tenantId = parts[1]

    const supabase = createAdminClient()

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, setup_fee_paid")
      .eq("id", tenantId)
      .single()

    if (!tenant || tenant.setup_fee_paid) {
      return NextResponse.json({ received: true })
    }

    await supabase
      .from("tenants")
      .update({
        setup_fee_paid: true,
        setup_fee_paid_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId)

    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("type", "setup_fee")
      .eq("status", "draft")

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Setup fee callback error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
