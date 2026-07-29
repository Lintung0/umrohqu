import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-callback-token")
    if (!token || token !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { external_id, status } = body

    if (status !== "PAID") {
      return NextResponse.json({ received: true })
    }

    if (!external_id || !external_id.startsWith("booking-")) {
      return NextResponse.json({ received: true })
    }

    const isRemaining = external_id.startsWith("booking-remaining-")
    const bookingId = isRemaining
      ? external_id.replace("booking-remaining-", "")
      : external_id.replace("booking-", "")

    const admin = createAdminClient()

    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, status, payment_type, remaining_amount, total")
      .eq("id", bookingId)
      .single()

    if (error || !booking || booking.status === "confirmed") {
      return NextResponse.json({ received: true })
    }

    if (isRemaining) {
      await admin
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          remaining_amount: 0,
          total: Number(booking.total) + Number(booking.remaining_amount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
    } else {
      await admin
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Xendit callback error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
