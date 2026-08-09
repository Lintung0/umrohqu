import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "ID booking tidak valid" }, { status: 400 })
    }

    const { bookingId } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error } = await admin
      .from("bookings")
      .select("*, package:packages(name, slug, image_url, departure_city, duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars), participants:booking_participants(id, full_name, nik, passport_no, gender, phone, relation)")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: booking })
  } catch (err) {
    console.error("Booking detail API error:", err)
    return NextResponse.json({ error: "Gagal memuat detail booking" }, { status: 500 })
  }
}
