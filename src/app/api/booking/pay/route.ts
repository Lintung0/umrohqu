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
      .select("id, status, price, fee, total, payment_type, dp_amount, remaining_amount, xendit_invoice_id, package_id, pilgrim_count")
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

    let xenditInvoice: { id: string; invoice_url: string }

    try {
      const { createInvoice } = await import("@/lib/services/xendit")
      const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const inv = await createInvoice({
        externalId: `booking-${booking.id}`,
        amount: payAmount,
        description: `Pembayaran ${booking.payment_type === "dp" ? "DP " : ""}booking #${booking.id.slice(0, 8).toUpperCase()}`,
        customer: { email: user.email },
        successRedirectUrl: `${BASE_URL}/dashboard/bookings/${booking.id}`,
        failureRedirectUrl: `${BASE_URL}/dashboard/bookings/${booking.id}?failed=true`,
      })

      xenditInvoice = { id: inv.id, invoice_url: inv.invoice_url }

      await admin
        .from("bookings")
        .update({ xendit_invoice_id: inv.id })
        .eq("id", booking.id)
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
