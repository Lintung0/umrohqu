import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(2).max(500),
})

const CANCELLABLE = ["pending_payment", "processing", "confirmed"]

// Customer mengajukan pembatalan. KEPUTUSAN ada di travel:
//  - disetujui  -> booking.status = refunded/cancelled + quota dikembalikan (route refund approve)
//  - ditolak    -> booking kembali ke status sebelumnya
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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, reason } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, payment_status, package_id, pilgrim_count, total")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (!CANCELLABLE.includes(booking.status)) {
      return NextResponse.json({ error: "Booking tidak dapat dibatalkan pada status ini" }, { status: 400 })
    }

    // Pastikan belum ada permintaan batal yang sedang berjalan/diproses
    const { data: existing } = await admin
      .from("booking_refunds")
      .select("id")
      .eq("booking_id", bookingId)
      .in("status", ["pending", "processing"])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Sudah ada permintaan pembatalan yang menunggu persetujuan" }, { status: 400 })
    }

    // Simpan status sebelumnya agar bisa dikembalikan jika ditolak
    const { data: refund } = await admin
      .from("booking_refunds")
      .insert({
        booking_id: bookingId,
        amount: Number(booking.total || 0),
        reason,
        status: "pending",
        requested_by: user.id,
        previous_status: booking.status,
      })
      .select("id, amount, status")
      .single()

    if (!refund) {
      return NextResponse.json({ error: "Gagal mengajukan pembatalan" }, { status: 500 })
    }

    // Status booking jadi 'cancellation_pending' sampai travel memutuskan
    await admin
      .from("bookings")
      .update({ status: "cancellation_pending", updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    return NextResponse.json({ success: true, status: "cancellation_pending", refund })
  } catch (err) {
    console.error("Cancel booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}