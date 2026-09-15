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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { bookingId } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, dp_type, remaining_amount, total, customer_id, tenant_id, booking_code")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.dp_type !== "dp") {
      return NextResponse.json({ error: "Bukan booking DP" }, { status: 400 })
    }

    if (booking.status === "cancelled" || booking.status === "cancellation_pending") {
      return NextResponse.json({ error: "Booking dibatalkan / menunggu persetujuan pembatalan" }, { status: 400 })
    }

    const remaining = Number(booking.remaining_amount)
    if (remaining <= 0) {
      return NextResponse.json({ error: "Sisa pembayaran sudah 0" }, { status: 400 })
    }

    const orderId = booking.booking_code ? `${booking.booking_code}-R` : `booking-remaining-${bookingId}`

    // Pastikan record transaksi (payments) untuk pelunasan ini — booking_id diisi otomatis oleh database
    const { data: paymentId } = await admin.rpc("create_payment", {
      p_booking_id: bookingId,
      p_tenant_id: booking.tenant_id,
      p_status: "pending",
      p_gateway: "midtrans",
      p_amount: remaining,
      p_currency: "IDR",
    })

    // Midtrans Snap untuk pelunasan sisa
    let snap: { token: string; redirect_url: string } | null = null
    try {
      const { createSnapTransaction } = await import("@/lib/services/midtrans")
      snap = await createSnapTransaction({
        orderId,
        grossAmount: remaining,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        finishUrl: appUrl(`checkout/finish?booking_id=${bookingId}`),
        unfinishUrl: appUrl(`checkout/finish?booking_id=${bookingId}&status=unfinish`),
        errorUrl: appUrl(`checkout/finish?booking_id=${bookingId}&status=error`),
      })

      await admin
        .from("bookings")
        .update({ gateway_invoice_id: orderId })
        .eq("id", bookingId)

      if (paymentId) {
        await admin
          .from("payments")
          .update({ gateway_reference: orderId })
          .eq("id", paymentId)
      }
    } catch (merr: any) {
      console.error("Midtrans Snap remaining error:", merr.message)
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      amount_paid: remaining,
      snap,
    })
  } catch (err) {
    console.error("Pay remaining error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
