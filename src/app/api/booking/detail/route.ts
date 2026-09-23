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
      .select("*, package:packages(name, slug, duration_nights, departures:package_departures(departure_city, departure_date), flights:package_flights(airline_name, flight_number, departure_city), package_hotels:package_hotels(night_count, sort_order, hotel:hotels(name, rating, city))), participants:booking_participants(id, full_name, national_id, passport_number, passport_expiry, birth_date, birth_place, gender, phone, relation, emergency_contact_name, emergency_contact_phone, street, city, province, postal_code, village, district, rt_rw)")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const { data: refund } = await admin
      .from("booking_refunds")
      .select("id, amount, status, reason, method, reference, note, completed_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ data: { ...booking, refund: refund || null } })
  } catch (err) {
    console.error("Booking detail API error:", err)
    return NextResponse.json({ error: "Gagal memuat detail booking" }, { status: 500 })
  }
}
