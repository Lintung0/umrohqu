import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { external_id, status } = body
    const xenditInvoiceId = body.id as string | undefined

    if (!external_id) {
      return NextResponse.json({ received: true })
    }

    const isRemaining = external_id.startsWith("booking-remaining-")
    const bookingId = isRemaining
      ? external_id.replace("booking-remaining-", "")
      : external_id.replace("booking-", "")

    if (!bookingId) {
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()

    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, status, payment_status, payment_type, remaining_amount, total")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ received: true })
    }

    // ── Idempotency: skip if already paid ──
    if (status === "PAID" && booking.payment_status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    const now = new Date().toISOString()

    // ── invoice.paid ──
    if (status === "PAID") {
      const newStatus = isRemaining ? "confirmed" : "confirmed"
      const updateData: Record<string, any> = {
        status: newStatus,
        payment_status: "paid",
        updated_at: now,
      }
      if (isRemaining) {
        updateData.remaining_amount = 0
        updateData.total = Number(booking.total) + Number(booking.remaining_amount)
      }
      await admin.from("bookings").update(updateData).eq("id", bookingId)

      // Update record transaksi: payments + invoices
      let payQuery = admin
        .from("payments")
        .update({ status: "paid", paid_at: now, updated_at: now })
        .eq("booking_id", bookingId)
        .eq("gateway", "xendit")
      if (xenditInvoiceId) {
        payQuery = payQuery.eq("gateway_reference", xenditInvoiceId)
      } else {
        payQuery = payQuery.eq("status", "pending")
      }
      await payQuery

      await admin
        .from("invoices")
        .update({ status: "paid", paid_at: now, updated_at: now })
        .eq("booking_id", bookingId)
        .eq("status", "issued")

      return NextResponse.json({ success: true })
    }

    // ── invoice.expired ──
    if (status === "EXPIRED" || status === "FAILED") {
      await admin.from("bookings").update({
        status: "cancelled",
        payment_status: "expired",
        updated_at: now,
      }).eq("id", bookingId)

      await admin
        .from("payments")
        .update({ status: "failed", updated_at: now })
        .eq("booking_id", bookingId)
        .eq("gateway", "xendit")
        .eq("status", "pending")

      await admin
        .from("invoices")
        .update({ status: "cancelled", updated_at: now })
        .eq("booking_id", bookingId)
        .eq("status", "issued")

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Xendit callback error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
