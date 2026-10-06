import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  vaNumber: z.string().min(1),
  bank: z.string().optional(),
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
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, vaNumber, bank } = parsed.data
    const admin = createAdminClient()

    // Booking harus milik user yang login
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
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
      .eq("status", "pending")

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