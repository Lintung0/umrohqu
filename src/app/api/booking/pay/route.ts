import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { appUrl } from "@/lib/utils"
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
    const finishBase = appUrl(`checkout/finish?booking_id=${bookingId}`)
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, total, remaining_amount, dp_amount, gateway_invoice_id, booking_code, package_id, pilgrim_count, tenant_id")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json({ error: "Booking sudah dibayar atau dibatalkan" }, { status: 400 })
    }

    const payAmount = Number(booking.total)
    const orderId = booking.booking_code || `booking-${booking.id}`

    // Pastikan record transaksi ada (payments)
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("status", "pending")
      .maybeSingle()

    let paymentId: string | null = existingPayment?.id || null
    if (!paymentId) {
      const { data: newPaymentId } = await admin.rpc("create_payment", {
        p_booking_id: booking.id,
        p_tenant_id: booking.tenant_id,
        p_status: "pending",
        p_gateway: "midtrans",
        p_amount: payAmount,
        p_currency: "IDR",
      })
      paymentId = newPaymentId || null
    }

    let snap: { token: string; redirect_url: string } | null = null
    try {
      const { createSnapTransaction } = await import("@/lib/services/midtrans")
      snap = await createSnapTransaction({
        orderId,
        grossAmount: payAmount,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        finishUrl: finishBase,
        unfinishUrl: appUrl(`checkout/finish?booking_id=${bookingId}&status=unfinish`),
        errorUrl: appUrl(`checkout/finish?booking_id=${bookingId}&status=error`),
      })

      await admin
        .from("bookings")
        .update({ gateway_invoice_id: orderId })
        .eq("id", booking.id)

      if (paymentId) {
        await admin
          .from("payments")
          .update({ gateway_reference: orderId })
          .eq("id", paymentId)
      }
    } catch (merr: any) {
      console.error("Midtrans Snap error:", merr.message)
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 })
    }

    return NextResponse.json({ success: true, snap })
  } catch (err) {
    console.error("Pay booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
