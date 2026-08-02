import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createInvoice } from "@/lib/services/xendit"
import { DEFAULT_FEE_CONFIG } from "@/lib/business-logic/fees"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, setup_fee, setup_fee_paid, status")
      .eq("id", profile.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ tenant })
  } catch (err) {
    console.error("Setup fee error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, email, tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, setup_fee, setup_fee_paid")
      .eq("id", profile.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    if (tenant.setup_fee_paid) {
      return NextResponse.json({ error: "Setup fee sudah dibayar" }, { status: 400 })
    }

    const feeAmount = Number(tenant.setup_fee) || DEFAULT_FEE_CONFIG.setupFee
    const externalId = `setupfee-${tenant.id}-${Date.now()}`

    const invoice = await createInvoice({
      externalId,
      amount: feeAmount,
      description: `Setup Fee ${tenant.name} - UmrohQu Platform`,
      customer: { email: profile.email || undefined },
    })

    const { error: invoiceErr } = await supabase.from("invoices").insert({
      tenant_id: tenant.id,
      type: "setup_fee",
      amount: feeAmount,
      total: feeAmount,
      status: "draft",
      description: `Setup fee untuk ${tenant.name}`,
    })

    if (invoiceErr) {
      console.error("Invoice insert error:", invoiceErr)
    }

    return NextResponse.json({
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      amount: feeAmount,
      externalId,
    })
  } catch (err) {
    console.error("Setup fee payment error:", err)
    return NextResponse.json({ error: "Gagal membuat invoice setup fee" }, { status: 500 })
  }
}
