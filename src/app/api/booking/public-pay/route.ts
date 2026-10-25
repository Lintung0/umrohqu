import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { appUrl } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1),
  payerName: z.string().optional(),
  payerEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data pembayaran tidak valid" }, { status: 400 })
    }

    const { token, payerName, payerEmail } = parsed.data
    const admin = createAdminClient()

    // 1. Cek token
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

    // 2. Cek invoice
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, invoice_number, installment_number, amount, status, booking_id, tenant_id")
      .eq("id", link.invoice_id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 })
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("id, booking_code, package:packages(name)")
      .eq("id", invoice.booking_id)
      .single()

    const payAmount = Number(invoice.amount)

    // 3. Catat payment row
    const { data: paymentId, error: payErr } = await admin.rpc("create_payment", {
      p_booking_id: invoice.booking_id,
      p_tenant_id: invoice.tenant_id,
      p_status: "pending",
      p_gateway: "midtrans",
      p_amount: payAmount,
      p_currency: "IDR",
    })

    if (payErr) {
      console.error("Payment insert error:", payErr)
    }

    if (paymentId) {
      await admin
        .from("payments")
        .update({
          invoice_id: invoice.id,
          gateway_reference: invoice.id,
        })
        .eq("id", paymentId)
    }

    const orderId = invoice.id
    const finishBase = appUrl(`installment/pay/${token}?status=success`)

    let snap: { token: string; redirect_url: string } | null = null
    try {
      const { createSnapTransaction } = await import("@/lib/services/midtrans")
      const packageName = (booking as any)?.package?.name || "Paket Umrah"
      const label = invoice.installment_number === 0
        ? "Uang Muka"
        : `Cicilan Bulan ke-${invoice.installment_number}`

      snap = await createSnapTransaction({
        orderId,
        grossAmount: payAmount,
        customerEmail: payerEmail || "pembayar@umrahqu.com",
        customerName: payerName || "Keluarga Jemaah",
        items: [
          {
            id: invoice.id,
            name: `${packageName} - ${label}`,
            price: payAmount,
            quantity: 1,
          },
        ],
        finishUrl: finishBase,
        unfinishUrl: appUrl(`installment/pay/${token}?status=unfinish`),
        errorUrl: appUrl(`installment/pay/${token}?status=error`),
      })
    } catch (merr: unknown) {
      console.error("Midtrans Snap public error:", merr instanceof Error ? merr.message : merr)
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      snap,
      invoice_id: invoice.id,
      amount: payAmount,
    })
  } catch (err) {
    console.error("Public pay error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
