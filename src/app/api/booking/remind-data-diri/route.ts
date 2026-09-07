import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notify/create-notification"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
})

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000

// Travel mengirim notifikasi pengingat ke jamaah yang belum melengkapi data diri.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: staff } = await admin
      .from("users")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single()

    if (!staff || !["travel_admin", "travel_operational", "travel_finance"].includes(staff.role)) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const { bookingId } = parsed.data

    const { data: booking } = await admin
      .from("bookings")
      .select("id, tenant_id, customer_id, status, package_id, booking_code")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }
    if (booking.tenant_id !== staff.tenant_id) {
      return NextResponse.json({ error: "Booking bukan milik travel Anda" }, { status: 403 })
    }
    if (!["confirmed", "completed"].includes(booking.status)) {
      return NextResponse.json({ error: "Pengingat data diri hanya untuk booking yang sudah dikonfirmasi" }, { status: 400 })
    }

    // Hindari spam: maksimal 1 pengingat per 24 jam per booking
    const { data: lastReminder } = await admin
      .from("notifications")
      .select("created_at")
      .eq("user_id", booking.customer_id)
      .eq("template_key", "data_diri_reminder")
      .eq("payload->>booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastReminder) {
      const elapsed = Date.now() - new Date(lastReminder.created_at).getTime()
      if (elapsed < REMINDER_COOLDOWN_MS) {
        return NextResponse.json({ error: "Pengingat sudah dikirim. Coba lagi besok." }, { status: 409 })
      }
    }

    const { data: pkg } = await admin
      .from("packages")
      .select("name")
      .eq("id", booking.package_id)
      .maybeSingle()

    const { error } = await createNotification({
      userId: booking.customer_id,
      tenantId: booking.tenant_id,
      title: "Pengingat: Lengkapi Data Diri Anda",
      body: `Travel membutuhkan data diri lengkap Anda untuk pemesanan ${pkg?.name || "paket"} #${booking.booking_code || ""}. Klik untuk melengkapi sekarang.`,
      templateKey: "data_diri_reminder",
      linkUrl: "/dashboard/data-diri",
      payload: { booking_id: booking.id },
    })

    if (error) {
      return NextResponse.json({ error: "Gagal mengirim pengingat" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[remind-data-diri]", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}