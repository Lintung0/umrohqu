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

    // order_id bisa berupa:
    //   - booking_code (format "UQ-..." / legacy "BKG-..."), dengan sufiks "-R" untuk pelunasan
    //   - booking-{uuid} (legacy) atau booking-remaining-{uuid}
    const isRemaining =
      orderId.startsWith("booking-remaining-") ||
      (!orderId.startsWith("booking-") && orderId.endsWith("-R"))

    let bookingId: string | null = null
    let bookingCode: string | null = null
    if (orderId.startsWith("booking-remaining-")) {
      bookingId = orderId.slice("booking-remaining-".length)
    } else if (orderId.startsWith("booking-")) {
      bookingId = orderId.slice("booking-".length)
    } else {
      bookingCode = isRemaining ? orderId.slice(0, -2) : orderId
    }

    const bookingQuery = admin
      .from("bookings")
      .select("id, status, tenant_id, price, pilgrim_count, booking_source, package_id, dp_type, total, remaining_amount")

    const { data: booking } = bookingCode
      ? await bookingQuery.eq("booking_code", bookingCode).single()
      : await bookingQuery.eq("id", bookingId).single()

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
