import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getMissingDataDiriFields, type DataDiriProfile, type DataDiriAddress } from "@/lib/data-diri"

// Travel staff melihat Data Diri Lengkap jamaah setelah booking dikonfirmasi.
// Data pribadi dibaca via service role setelah diverifikasi kepemilikan booking.
export async function GET(request: NextRequest) {
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

    const bookingId = request.nextUrl.searchParams.get("bookingId")
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId wajib diisi" }, { status: 400 })
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("id, tenant_id, customer_id, status")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }
    if (booking.tenant_id !== staff.tenant_id) {
      return NextResponse.json({ error: "Booking bukan milik travel Anda" }, { status: 403 })
    }
    if (!["confirmed", "completed"].includes(booking.status)) {
      return NextResponse.json({ error: "Data diri dapat dilihat setelah booking dikonfirmasi" }, { status: 400 })
    }

    const [{ data: customer }, { data: addr }] = await Promise.all([
      admin
        .from("users")
        .select("id, full_name, phone, email, profile")
        .eq("id", booking.customer_id)
        .maybeSingle(),
      admin
        .from("user_addresses")
        .select("*")
        .eq("user_id", booking.customer_id)
        .maybeSingle(),
    ])

    const profile = (customer?.profile || {}) as DataDiriProfile
    const address = {
      street: addr?.street || null,
      city: addr?.city || null,
      province: addr?.province || null,
      postal_code: addr?.postal_code || null,
      village: addr?.village || null,
      district: addr?.district || null,
      rt_rw: addr?.rt_rw || null,
    } as DataDiriAddress

    const missingFields = getMissingDataDiriFields(profile, address)

    return NextResponse.json({
      complete: missingFields.length === 0,
      missingFields,
      data: {
        full_name: customer?.full_name || null,
        phone: customer?.phone || null,
        email: customer?.email || null,
        ...profile,
        address,
      },
    })
  } catch (err) {
    console.error("[customer-data-diri]", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}