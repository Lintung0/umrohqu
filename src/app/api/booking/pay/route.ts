import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
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
      return NextResponse.json({ error: "ID booking tidak valid" }, { status: 400 })
    }

    const { bookingId } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, price, fee, total, payment_type, dp_amount, remaining_amount, xendit_invoice_id, package_id, pilgrim_count, tenant_id")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json({ error: "Booking sudah dibayar atau dibatalkan" }, { status: 400 })
    }

    const payAmount = booking.payment_type === "dp" ? (booking.dp_amount || 0) : booking.total

    // Pastikan record transaksi ada (payments + invoices) untuk booking ini
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("gateway", "xendit")
      .eq("status", "pending")
      .maybeSingle()

    let paymentId: string | null = existingPayment?.id || null
    if (!paymentId) {
      const { data: newPayment } = await admin
        .from("payments")
        .insert({
          booking_id: booking.id,
          tenant_id: booking.tenant_id,
          status: "pending",
          gateway: "xendit",
          amount: payAmount,
        })
        .select("id")
        .single()
      paymentId = newPayment?.id || null
    }

    const { data: existingInvoice } = await admin
      .from("invoices")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("type", "booking")
      .eq("status", "issued")
      .maybeSingle()

    if (!existingInvoice) {
      await admin.from("invoices").insert({
        invoice_no: `INV-B-${booking.id.slice(0, 8).toUpperCase()}`,
        booking_id: booking.id,
        tenant_id: booking.tenant_id,
        total: Number(booking.total) + Number(booking.remaining_amount),
        status: "issued",
        amount: payAmount,
        type: "booking",
        description: `Pembayaran ${booking.payment_type === "dp" ? "DP " : ""}booking #${booking.id.slice(0, 8).toUpperCase()}`,
      })
    }

    let xenditInvoice: { id: string; invoice_url: string }

    try {
      const { createInvoice } = await import("@/lib/services/xendit")
      const host = request.headers.get("host") || ""
      const protocol = host.includes("localhost") ? "http" : "https"
      const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
      const inv = await createInvoice({
        externalId: `booking-${booking.id}`,
        amount: payAmount,
        description: `Pembayaran ${booking.payment_type === "dp" ? "DP " : ""}booking #${booking.id.slice(0, 8).toUpperCase()}`,
        customer: { email: user.email },
        successRedirectUrl: `${BASE_URL}/booking-success/${booking.id}`,
        failureRedirectUrl: `${BASE_URL}/dashboard/bookings/${booking.id}?failed=true`,
      })

      xenditInvoice = { id: inv.id, invoice_url: inv.invoice_url }

      await admin
        .from("bookings")
        .update({ xendit_invoice_id: inv.id })
        .eq("id", booking.id)

      if (paymentId) {
        await admin
          .from("payments")
          .update({ gateway_reference: inv.id })
          .eq("id", paymentId)
      }
    } catch (xerr: any) {
      console.error("Xendit invoice error:", xerr.message)
      return NextResponse.json({ error: "Gagal membuat invoice pembayaran" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      xendit: xenditInvoice,
    })
  } catch (err) {
    console.error("Pay booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
