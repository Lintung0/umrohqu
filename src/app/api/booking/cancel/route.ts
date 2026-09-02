import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(2).max(500),
})

const CANCELLABLE = ["pending_payment", "processing", "confirmed"]

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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, reason } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, payment_status, package_id, pilgrim_count, total")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (!CANCELLABLE.includes(booking.status)) {
      return NextResponse.json({ error: "Booking tidak dapat dibatalkan pada status ini" }, { status: 400 })
    }

    const paidAmount = Number(booking.total || 0)
    const hasPayment = booking.status !== "pending_payment" && paidAmount > 0

    // 1. Update booking status
    await admin
      .from("bookings")
      .update({
        status: hasPayment ? "refunded" : "cancelled",
        payment_status: hasPayment ? "refunded" : (booking.payment_status || "pending"),
        cancel_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    // 2. Kembalikan kursi paket
    const { data: pkg } = await admin
      .from("packages")
      .select("quota_taken")
      .eq("id", booking.package_id)
      .single()

    if (pkg) {
      await admin
        .from("packages")
        .update({
          quota_taken: Math.max(0, (pkg.quota_taken ?? 0) - booking.pilgrim_count),
        })
        .eq("id", booking.package_id)
    }

    // 3. Catat refund untuk diproses manual oleh travel
    let refund = null
    if (hasPayment) {
      const { data: refundRow } = await admin
        .from("booking_refunds")
        .insert({
          booking_id: bookingId,
          amount: paidAmount,
          reason,
          status: "pending",
          requested_by: user.id,
        })
        .select("id, amount, status")
        .single()
      refund = refundRow

      // Tandai transaksi pembayaran yang sudah lunas sebagai refunded
      await admin
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("booking_id", bookingId)
        .eq("status", "paid")
    }

    return NextResponse.json({
      success: true,
      status: hasPayment ? "refunded" : "cancelled",
      refund,
    })
  } catch (err) {
    console.error("Cancel booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}