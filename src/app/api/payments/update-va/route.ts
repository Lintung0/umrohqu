import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  vaNumber: z.string().min(1),
  bank: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, vaNumber, bank } = parsed.data
    const admin = createAdminClient()

    // Verify booking exists and get payment record
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, gateway_invoice_id")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    // Update payments table with VA number
    const { error: paymentError } = await admin
      .from("payments")
      .update({
        va_number: vaNumber,
        bank: bank || null,
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)

    if (paymentError) {
      console.error("Update VA error:", paymentError)
      return NextResponse.json({ error: "Gagal update VA number" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Update VA error:", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}