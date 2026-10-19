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
      .select("*, package:packages(name, slug, duration_nights, departures:package_departures(departure_city, departure_date), flights:package_flights(airline_name, flight_number, departure_city), package_hotels:package_hotels(night_count, sort_order, hotel:hotels(name, rating, city))), participants(id, full_name, national_id, passport_number, passport_expiry, birth_date, birth_place, gender, phone, relation, emergency_contact_name, emergency_contact_phone, street, city, province, postal_code, village, district, rt_rw)")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const [{ data: refund }, { data: latestPayment }, { data: invoices }, { data: schedules }] = await Promise.all([
      admin
        .from("refunds")
        .select("id, amount, status, reason, method, reference, note, completed_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("payments")
        .select("id, status, gateway_reference, va_number, payment_provider, payment_type, amount")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("invoices")
        .select("id, invoice_number, installment_number, invoice_type, amount, status, due_date, paid_at")
        .eq("booking_id", bookingId)
        .order("installment_number", { ascending: true }),
      admin
        .from("payment_schedules")
        .select("id, installment_number, schedule_name, due_date, amount, paid_amount, status, invoice_id")
        .eq("booking_id", bookingId)
        .order("installment_number", { ascending: true }),
    ])

    return NextResponse.json({
      data: {
        ...booking,
        refund: refund || null,
        active_payment: latestPayment || null,
        invoices: invoices || [],
        payment_schedules: schedules || [],
      },
    })
  } catch (err) {
    console.error("Booking detail API error:", err)
    return NextResponse.json({ error: "Gagal memuat detail booking" }, { status: 500 })
  }
}
