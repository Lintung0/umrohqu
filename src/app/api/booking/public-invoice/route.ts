import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: link, error: linkErr } = await admin
      .from("payment_links")
      .select("id, invoice_id, token, expires_at, used_at")
      .eq("token", token)
      .maybeSingle()

    if (linkErr || !link) {
      return NextResponse.json({ error: "Link pembayaran tidak valid" }, { status: 404 })
    }

    if (new Date(link.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Link pembayaran sudah kedaluwarsa" }, { status: 410 })
    }

    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, invoice_number, installment_number, invoice_type, amount, status, due_date, paid_at, booking_id, tenant_id")
      .eq("id", link.invoice_id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("id, booking_code, package:packages(name, slug), travel:tenants(name, logo_url)")
      .eq("id", invoice.booking_id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        invoice,
        booking,
        link: {
          expires_at: link.expires_at,
          used_at: link.used_at,
        },
      },
    })
  } catch (err) {
    console.error("Public invoice get error:", err)
    return NextResponse.json({ error: "Gagal memuat informasi tagihan" }, { status: 500 })
  }
}
