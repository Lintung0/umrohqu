import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTransactionStatus, isSuccessStatus, isPendingStatus } from "@/lib/services/midtrans"
import { applyPaymentEvent } from "@/lib/services/payment-events"
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

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, payment_scheme, remaining_amount, total, tenant_id, price, pilgrim_count, booking_source, package_id")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const canVerify = booking.status === "pending_payment"

    if (!canVerify) {
      return NextResponse.json({ status: booking.status })
    }

    // Get gateway reference from payments table
    const { data: payment } = await admin
      .from("payments")
      .select("id, status, gateway_reference")
      .eq("booking_id", bookingId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!payment?.gateway_reference) {
      return NextResponse.json({ error: "Belum ada transaksi gateway", gateway_found: false }, { status: 400 })
    }

    // Cari transaksi di Midtrans lewat beberapa kandidat order_id:
    // referensi internal terbaru dulu, lalu format legacy booking-{uuid}.
    // Jujur ke UI kalau tidak ada yang dikenal gateway.
    const candidates = [payment.gateway_reference, `booking-${bookingId}`]
    let txn: Awaited<ReturnType<typeof getTransactionStatus>> | null = null
    let matchedOrderId: string | null = null
    for (const orderId of candidates) {
      try {
        txn = await getTransactionStatus(orderId)
        matchedOrderId = orderId
        break
      } catch (statusErr) {
        console.error("Verify payment status check error:", orderId, statusErr)
      }
    }

    if (!txn) {
      return NextResponse.json({ status: booking.status, midtrans_status: null, gateway_found: false })
    }

    const isRemaining = (payment.gateway_reference || "").startsWith("pay-remaining-")

    if (isSuccessStatus(txn.transaction_status)) {
      // Bukti sukses gateway → state machine (processing, DO NOT auto-confirm)
      const result = await applyPaymentEvent(admin, {
        bookingId,
        paymentId: payment.id,
        isRemaining,
        event: {
          kind: "success",
          transactionId: txn.transaction_id || matchedOrderId || undefined,
          transactionTime: txn.transaction_time,
          paymentType: txn.payment_type,
          vaNumber: txn.va_numbers?.[0]?.va_number || (txn as any).payment_code || undefined,
          paymentProvider: txn.va_numbers?.[0]?.bank || (txn as any).bank || undefined,
        },
      })

      try {
        const { createNotification } = await import("@/lib/notify/create-notification")
        await createNotification({
          userId: user.id,
          tenantId: booking.tenant_id,
          title: "Pembayaran berhasil diterima",
          body: "Pembayaran Anda telah kami terima. Booking sedang menunggu verifikasi travel.",
          templateKey: "booking_paid",
          linkUrl: `/dashboard/bookings/${booking.id}`,
          payload: { booking_id: booking.id },
        })
      } catch (notifErr) {
        console.error("[notify verify payment]", notifErr)
      }

      return NextResponse.json({ status: result.bookingStatus, just_verified: result.applied, gateway_found: true })
    }

    if (isPendingStatus(txn.transaction_status)) {
      // Masih pending di gateway — catat detail VA bila sudah ada (state machine)
      await applyPaymentEvent(admin, {
        bookingId,
        paymentId: payment.id,
        isRemaining,
        event: {
          kind: "pending",
          transactionId: txn.transaction_id || matchedOrderId || undefined,
          paymentType: txn.payment_type,
          vaNumber: txn.va_numbers?.[0]?.va_number || (txn as any).payment_code || undefined,
          paymentProvider: txn.va_numbers?.[0]?.bank || (txn as any).bank || undefined,
        },
      })
      return NextResponse.json({ status: "pending_payment", midtrans_status: txn.transaction_status, gateway_found: true })
    }

    // Terminal di gateway (expire/cancel/deny) — tutup payment row, booking
    // tetap pending agar user bisa bayar ulang (state machine).
    const terminal = txn.transaction_status === "expire" ? "expired" as const
      : txn.transaction_status === "cancel" ? "canceled" as const
      : "failed" as const
    const termResult = await applyPaymentEvent(admin, {
      bookingId,
      paymentId: payment.id,
      isRemaining,
      event: { kind: "terminal", terminalStatus: terminal },
    })
    return NextResponse.json({ status: termResult.bookingStatus, midtrans_status: txn.transaction_status, gateway_found: true })
  } catch (err) {
    console.error("Verify payment error:", err)
    return NextResponse.json({ error: "Gagal memverifikasi pembayaran" }, { status: 500 })
  }
}
