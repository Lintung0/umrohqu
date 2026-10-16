import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import {
  isSuccessStatus,
  isPendingStatus,
  verifyNotificationSignature,
} from "@/lib/services/midtrans"
import { applyPaymentEvent, type GatewayMoneyEvent } from "@/lib/services/payment-events"

export const dynamic = "force-dynamic"

export async function POST(_request: NextRequest) {
  const admin = createAdminClient()

  try {
    const notification = await _request.json()

    // Keamanan dana: tolak notifikasi tanpa signature valid. Tanpa ini,
    // siapa pun bisa POST settlement palsu dan booking jadi terbayar.
    // Kegagalan dicatat dengan prefix khusus agar kunci yang salah
    // ketahuan dalam menit, bukan hari.
    if (!verifyNotificationSignature(notification)) {
      console.error("[PAYMENT-SECURITY] invalid signature for order:", notification?.order_id || notification?.transaction_id || "?")
      return NextResponse.json({ error: "invalid_signature" }, { status: 403 })
    }

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
    //   - booking-{uuid}[-timestamp] (legacy / baru) atau booking-remaining-{uuid}[-timestamp]
    //   - pay-{paymentId} / pay-remaining-{paymentId} (format baru → lookup via payments)
    const isRemaining =
      orderId.startsWith("booking-remaining-") ||
      orderId.startsWith("pay-remaining-") ||
      (!orderId.startsWith("booking-") && !orderId.startsWith("pay-") && orderId.endsWith("-R"))

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const uuidMatch = orderId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    const uuidPart = uuidMatch?.[0] || null

    let bookingId: string | null = null
    let bookingCode: string | null = null
    let paymentId: string | null = null

    // 1. Jika orderId adalah UUID langsung (misal booking.id asli dari database)
    if (uuidRegex.test(orderId)) {
      const { data: bCheck } = await admin.from("bookings").select("id").eq("id", orderId).maybeSingle()
      if (bCheck?.id) {
        bookingId = bCheck.id
      } else {
        // Cek apakah invoice_id
        const { data: invCheck } = await admin.from("invoices").select("id, booking_id").eq("id", orderId).maybeSingle()
        if (invCheck?.id) {
          bookingId = invCheck.booking_id
        } else {
          // Cek apakah payment_id
          const { data: payCheck } = await admin.from("payments").select("id, booking_id").eq("id", orderId).maybeSingle()
          if (payCheck?.id) {
            paymentId = payCheck.id
            bookingId = payCheck.booking_id
          }
        }
      }
    } else if (orderId.startsWith("INV-")) {
      // 2. Jika orderId adalah nomor invoice (misal cicilan)
      const { data: invByNo } = await admin.from("invoices").select("id, booking_id").eq("invoice_number", orderId).maybeSingle()
      if (invByNo?.booking_id) {
        bookingId = invByNo.booking_id
      }
    } else if (orderId.startsWith("pay-")) {
      // 3. Format legacy: order_id = pay-{paymentId} / pay-remaining-{paymentId}
      const { data: payByRef } = await admin
        .from("payments")
        .select("id, booking_id")
        .or(`gateway_reference.eq.${orderId}${uuidPart ? `,id.eq.${uuidPart}` : ""}`)
        .maybeSingle()
      if (payByRef?.booking_id) {
        paymentId = payByRef.id
        bookingId = payByRef.booking_id
      } else if (uuidPart) {
        bookingId = uuidPart
      }
    } else if (orderId.startsWith("booking-remaining-") || orderId.startsWith("booking-")) {
      bookingId = uuidPart
    } else {
      bookingCode = isRemaining ? orderId.slice(0, -2) : orderId
    }

    let booking: { id: string; status: string; tenant_id: string; price: number; pilgrim_count: number; booking_source: string; package_id: string; payment_scheme: string; total: number; remaining_amount: number } | null = null
    if (bookingId) {
      const { data: b } = await admin
        .from("bookings")
        .select("id, status, tenant_id, price, pilgrim_count, booking_source, package_id, payment_scheme, total, remaining_amount")
        .eq("id", bookingId)
        .maybeSingle()
      booking = b
    } else if (bookingCode) {
      const { data: b } = await admin
        .from("bookings")
        .select("id, status, tenant_id, price, pilgrim_count, booking_source, package_id, payment_scheme, total, remaining_amount")
        .eq("booking_code", bookingCode)
        .maybeSingle()
      booking = b
    }

    if (!booking) {
      console.error("[Midtrans Notification] Booking not found for orderId:", orderId)
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    bookingId = booking.id

    const { data: payment } = paymentId
      ? { data: { id: paymentId } as any }
      : await admin
          .from("payments")
          .select("id, status, amount")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

    // Keamanan dana: nominal Midtrans harus sama dengan tagihan kita.
    // Mencegah kurang-bayar/kelebihan-bayar tercatat sebagai lunas.
    const notifiedGross = Math.round(Number(notification.gross_amount || 0))
    const expectedGross = (payment as any)?.amount != null
      ? Math.round(Number((payment as any).amount))
      : isRemaining
        ? Math.round(Number(booking.remaining_amount || 0))
        : Math.round(Number(booking.total || 0))
    if (notifiedGross > 0 && expectedGross > 0 && notifiedGross !== expectedGross) {
      console.error("[PAYMENT-SECURITY] gross_amount mismatch:", { orderId, notifiedGross, expectedGross, bookingId })
      return NextResponse.json({ error: "amount_mismatch" }, { status: 403 })
    }

    // Satu-satunya jalan perubahan status: state machine tunggal.
    let event: GatewayMoneyEvent
    if (isSuccessStatus(rawStatus)) {
      event = {
        kind: "success",
        transactionId: notification.transaction_id || orderId,
        transactionTime: notification.transaction_time,
        paymentType,
        vaNumber: vaNumber || undefined,
        paymentProvider: paymentProvider || undefined,
      }
    } else if (isPendingStatus(rawStatus)) {
      event = {
        kind: "pending",
        transactionId: notification.transaction_id || orderId,
        paymentType,
        vaNumber: vaNumber || undefined,
        paymentProvider: paymentProvider || undefined,
      }
    } else if (rawStatus === "expire") {
      event = { kind: "terminal", terminalStatus: "expired" }
    } else if (rawStatus === "cancel") {
      event = { kind: "terminal", terminalStatus: "canceled" }
    } else {
      event = { kind: "terminal", terminalStatus: "failed" }
    }

    const result = await applyPaymentEvent(admin, {
      bookingId,
      paymentId,
      isRemaining,
      event,
    })

    return NextResponse.json({ status: "ok", applied: result.applied, booking_status: result.bookingStatus, reason: result.reason })
  } catch (err) {
    console.error("Midtrans notification error:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
