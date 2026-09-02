import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { creditTravelCommission } from "@/lib/business-logic/deposits"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(["confirm", "cancel"]),
})

// Travel admin/operational verifies that payment has reached the travel's
// account before confirming the booking. Commission is credited only here.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("users")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile || !["travel_admin", "travel_operational", "travel_finance"].includes(profile.role)) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, action } = parsed.data

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, tenant_id, price, pilgrim_count, booking_source, package_id")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "Booking bukan milik travel Anda" }, { status: 403 })
    }

    if (booking.status !== "processing") {
      return NextResponse.json({ error: "Booking sudah diproses" }, { status: 400 })
    }

    if (action === "cancel") {
      await admin
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", bookingId)

      // Kembalikan kursi paket yang sempat dipesan
      const { data: pkg } = await admin
        .from("packages")
        .select("quota_taken")
        .eq("id", booking.package_id)
        .single()
      if (pkg) {
        await admin
          .from("packages")
          .update({
            quota_taken: Math.max(0, (pkg.quota_taken ?? 0) - booking.pilgrim_count),
          })
          .eq("id", booking.package_id)
      }

      return NextResponse.json({ success: true, status: "cancelled" })
    }

    // Confirm: verifikasi dana sudah masuk → booking confirmed + kredit komisi
    await admin
      .from("bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    const channel =
      booking.booking_source === "subdomain"
        ? "subdomain"
        : booking.booking_source === "custom_domain"
          ? "custom_domain"
          : "portal"

    const credited = await creditTravelCommission(admin, {
      tenantId: booking.tenant_id,
      bookingId,
      packagePrice: Number(booking.price || 0),
      pilgrimCount: Number(booking.pilgrim_count || 0),
      channel,
      actorUserId: user.id,
    })

    return NextResponse.json({ success: true, status: "confirmed", credited })
  } catch (err) {
    console.error("Travel confirm error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}