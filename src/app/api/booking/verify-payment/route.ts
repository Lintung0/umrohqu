import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getInvoice } from "@/lib/services/xendit"
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
      .select("id, status, xendit_invoice_id, payment_type, remaining_amount, total")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const isRemaining = booking.xendit_invoice_id?.startsWith("booking-remaining-") || false
    const canVerify = booking.status === "pending_payment" || (booking.status === "processing" && isRemaining && (booking.remaining_amount || 0) > 0)

    if (!canVerify) {
      return NextResponse.json({ status: booking.status })
    }

    if (!booking.xendit_invoice_id) {
      return NextResponse.json({ error: "Belum ada invoice" }, { status: 400 })
    }

    const invoice = await getInvoice(booking.xendit_invoice_id)

    if (invoice.status !== "PAID") {
      return NextResponse.json({ status: isRemaining ? "processing" : "pending_payment", xendit_status: invoice.status })
    }

    const newStatus = isRemaining ? "confirmed" : "processing"
    const updateData: Record<string, any> = {
      status: newStatus,
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    }
    if (isRemaining) {
      updateData.remaining_amount = 0
      updateData.total = Number(booking.total) + Number(booking.remaining_amount)
    }

    await admin.from("bookings").update(updateData).eq("id", bookingId)

    return NextResponse.json({ status: newStatus, just_verified: true })
  } catch (err) {
    console.error("Verify payment error:", err)
    return NextResponse.json({ error: "Gagal memverifikasi pembayaran" }, { status: 500 })
  }
}
