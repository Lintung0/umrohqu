import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { appUrl } from "@/lib/utils"
import { z } from "zod"
import crypto from "crypto"

const schema = z.object({
  invoiceId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "ID invoice tidak valid" }, { status: 400 })
    }

    const { invoiceId } = parsed.data
    const admin = createAdminClient()

    // 1. Cek invoice & kepemilikan booking
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, invoice_number, installment_number, amount, status, due_date, booking_id")
      .eq("id", invoiceId)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 })
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("id, customer_id, tenant_id")
      .eq("id", invoice.booking_id)
      .single()

    if (!booking || booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke tagihan ini" }, { status: 403 })
    }

    // 2. Cek apakah sudah ada payment link aktif yang belum dipakai
    const nowIso = new Date().toISOString()
    const { data: existingLink } = await admin
      .from("payment_links")
      .select("id, token, expires_at")
      .eq("invoice_id", invoiceId)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let token = existingLink?.token

    if (!token) {
      token = crypto.randomUUID().replace(/-/g, "")
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { error: insErr } = await admin.from("payment_links").insert({
        invoice_id: invoiceId,
        token,
        expires_at: expiresAt,
      })

      if (insErr) {
        console.error("Payment link insert error:", insErr)
        return NextResponse.json({ error: "Gagal membuat link pembayaran" }, { status: 500 })
      }
    }

    const paymentUrl = appUrl(`installment/pay/${token}`)

    return NextResponse.json({
      success: true,
      token,
      paymentUrl,
    })
  } catch (err) {
    console.error("Generate payment link error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
