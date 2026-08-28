import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTransactionStatus, isSuccessStatus, isPendingStatus, stablePaymentType } from "@/lib/services/midtrans"
import { creditTravelCommission } from "@/lib/business-logic/deposits"
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
      .select("id, status, gateway_invoice_id, dp_type, remaining_amount, total, tenant_id, price, pilgrim_count, booking_source, package_id")
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

    if (!booking.gateway_invoice_id) {
      return NextResponse.json({ error: "Belum ada transaksi gateway" }, { status: 400 })
    }

    const txn = await getTransactionStatus(booking.gateway_invoice_id)

    if (!isSuccessStatus(txn.transaction_status)) {
      return NextResponse.json({
        status: isPendingStatus(txn.transaction_status) ? "pending_payment" : booking.status,
        midtrans_status: txn.transaction_status,
      })
    }

    // Pembayaran berhasil
    await admin
      .from("bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    const paidAt = txn.transaction_time
      ? new Date(txn.transaction_time).toISOString()
      : new Date().toISOString()

    await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: paidAt,
        payment_type: stablePaymentType(txn.payment_type) as never,
        payment_provider: txn.va_numbers?.[0]?.bank || txn.bank || txn.payment_type,
        va_number: txn.va_numbers?.[0]?.va_number || txn.payment_code || "",
        gateway_reference: txn.transaction_id || booking.gateway_invoice_id,
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)

    await creditTravelCommission(admin, {
      tenantId: booking.tenant_id,
      bookingId: bookingId,
      packagePrice: Number(booking.price || 0),
      pilgrimCount: Number(booking.pilgrim_count || 0),
      channel:
        booking.booking_source === "subdomain"
          ? "subdomain"
          : booking.booking_source === "custom_domain"
            ? "custom_domain"
            : "portal",
      actorUserId: user.id,
    })

    return NextResponse.json({ status: "confirmed", just_verified: true })
  } catch (err) {
    console.error("Verify payment error:", err)
    return NextResponse.json({ error: "Gagal memverifikasi pembayaran" }, { status: 500 })
  }
}
