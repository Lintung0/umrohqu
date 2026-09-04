import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notify/create-notification"

// Dipicu dari client (bell/halaman notifikasi) untuk generate notifikasi
// "segera berangkat" untuk booking yang keberangkatannya ≤ 7 hari lagi.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    const now = new Date()
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: bookings } = await admin
      .from("bookings")
      .select("id, tenant_id, package_id, status, created_at, package:packages(name, departure_date)")
      .eq("customer_id", user.id)
      .in("status", ["confirmed", "processing"])

    let created = 0
    for (const booking of (bookings as any) || []) {
      const pkg = booking.package
      if (!pkg?.departure_date) continue
      const dep = new Date(pkg.departure_date)
      if (dep < now || dep > in7days) continue

      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("template_key", "upcoming_departure")
        .eq("payload->>booking_id", booking.id)
        .maybeSingle()

      if (existing) continue

      const depDate = new Date(pkg.departure_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })

      await createNotification({
        userId: user.id,
        tenantId: booking.tenant_id,
        title: "Keberangkatan segera tiba",
        body: `${pkg.name} akan berangkat pada ${depDate}. Mohon lengkapi data diri dan persiapkan dokumen Anda.`,
        templateKey: "upcoming_departure",
        linkUrl: `/dashboard/bookings/${booking.id}`,
        payload: { booking_id: booking.id, departure_date: pkg.departure_date },
      })
      created++
    }

    return NextResponse.json({ success: true, created })
  } catch (err) {
    console.error("[upcoming-departure]", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
