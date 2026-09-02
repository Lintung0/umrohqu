import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(["process", "complete"]),
  amount: z.number().positive().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
})

// Travel staff memproses refund SECARA MANUAL (transfer/e-wallet ke customer),
// lalu menandai refund selesai. Dana dikembalikan di luar sistem pembayaran.
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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, action, amount, method, reference, note } = parsed.data

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, tenant_id, total")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "Booking bukan milik travel Anda" }, { status: 403 })
    }

    if (booking.status !== "refunded") {
      return NextResponse.json({ error: "Booking tidak dalam status refund" }, { status: 400 })
    }

    const { data: refundRow } = await admin
      .from("booking_refunds")
      .select("id, status")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const refundId = refundRow?.id

    if (action === "complete") {
      if (!refundId) {
        return NextResponse.json({ error: "Belum ada proses refund" }, { status: 400 })
      }
      await admin
        .from("booking_refunds")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", refundId)
      return NextResponse.json({ success: true, status: "completed" })
    }

    // action === "process": catat detail refund manual
    const updates: Record<string, unknown> = {
      processed_by: user.id,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (amount) updates.amount = amount
    if (method) updates.method = method
    if (reference) updates.reference = reference
    if (note) updates.note = note

    if (refundId) {
      await admin.from("booking_refunds").update({ ...updates, status: "processing" }).eq("id", refundId)
    } else {
      await admin.from("booking_refunds").insert({
        booking_id: bookingId,
        amount: amount || Number(booking.total || 0),
        method: method || null,
        reference: reference || null,
        note: note || null,
        status: "processing",
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, status: "processing" })
  } catch (err) {
    console.error("Travel refund error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}