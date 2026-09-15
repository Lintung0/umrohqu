import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import {
  isSuccessStatus,
  isPendingStatus,
  stablePaymentType,
} from "@/lib/services/midtrans"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  try {
    const notification = await request.json()

    const orderId: string = notification.order_id || notification.transaction_id || ""
    const rawStatus: string = notification.transaction_status || ""
    const paymentType: string = notification.payment_type || ""
    const vaNumber: string =
      notification.va_numbers?.[0]?.va_number ||
      notification.permata_va_number ||
      notification.bill_key ||
      notification.payment_code ||
      ""
    const paymentProvider: string =
      notification.va_numbers?.[0]?.bank || notification.bank || paymentType

    const isRemaining =
      orderId.startsWith("booking-remaining-") ||
      (orderId.startsWith("BKG-") && orderId.endsWith("-R"))

    let bookingId: string | null = null
    if (orderId.startsWith("BKG-")) {
      bookingId = null
    } else if (orderId.startsWith("booking-")) {
      bookingId = orderId.startsWith("booking-remaining-")
        ? orderId.slice("booking-remaining-".length)
        : orderId.slice("booking-".length)
    } else {
      // Bukan notifikasi booking kami
      return NextResponse.json({ status: "ignored" })
    }

    const bookingQuery = admin
      .from("bookings")
      .select("id, status, tenant_id, price, pilgrim_count, booking_source, package_id, dp_type, total, remaining_amount")

    const { data: booking } = bookingId
      ? await bookingQuery.eq("id", bookingId).single()
      : await bookingQuery.eq("booking_code", isRemaining ? orderId.slice(0, -2) : orderId).single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    bookingId = booking.id

    const { data: payment } = await admin
      .from("payments")
      .select("id, status")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const paidAt = notification.transaction_time
      ? new Date(notification.transaction_time).toISOString()
      : new Date().toISOString()

    if (isSuccessStatus(rawStatus)) {
      if (isRemaining) {
        // Pelunasan sisa DP — booking lunas; status mengikuti verifikasi travel (jika sudah confirmed, tetap confirmed)
        await admin
          .from("bookings")
          .update({
            remaining_amount: 0,
            total: Number(booking.total || 0) + Number(booking.remaining_amount || 0),
            updated_at: paidAt,
          })
          .eq("id", bookingId)
      } else if (booking.status === "pending_payment") {
        // Pembayaran awal sukses → booking masuk antrian verifikasi travel (DO NOT auto-confirm)
        await admin
          .from("bookings")
          .update({ status: "processing", updated_at: paidAt })
          .eq("id", bookingId)
      }

      if (payment) {
        await admin
          .from("payments")
          .update({
            status: "paid",
            paid_at: paidAt,
            payment_type: stablePaymentType(paymentType) as never,
            payment_provider: paymentProvider,
            va_number: vaNumber,
            gateway_reference: notification.transaction_id || orderId,
            updated_at: paidAt,
          })
          .eq("id", payment.id)
      }
    } else if (isPendingStatus(rawStatus) && payment) {
      // Tetap pending — catat detail pembayaran yang terpilih
      await admin
        .from("payments")
        .update({
          payment_type: stablePaymentType(paymentType) as never,
          payment_provider: paymentProvider,
          va_number: vaNumber,
          gateway_reference: notification.transaction_id || orderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
    }

    return NextResponse.json({ status: "ok" })
  } catch (err) {
    console.error("Midtrans notification error:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
