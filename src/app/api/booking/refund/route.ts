import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(["approve", "reject", "process", "complete"]),
  amount: z.number().positive().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
})

// Alur pembatalan (customer mengajukan → travel menyetujui/menolak → refund manual):
//  - approve  : setujui pembatalan → booking refunded/cancelled + quota dikembalikan + refund 'processing'
//  - reject   : tolak pembatalan → booking kembali ke status sebelumnya + refund 'rejected'
//  - process  : catat detail refund manual (nominal/metode/ref) → refund 'processing'
//  - complete : tandai transfer dana selesai → refund 'completed'
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
      .select("id, status, payment_status, tenant_id, customer_id, package_id, pilgrim_count, total")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "Booking bukan milik travel Anda" }, { status: 403 })
    }

    const { data: refundRow } = await admin
      .from("booking_refunds")
      .select("id, status, reason, previous_status, amount")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const refundId = refundRow?.id

    if (action === "approve") {
      if (!refundId || refundRow.status !== "pending") {
        return NextResponse.json({ error: "Tidak ada permintaan pembatalan yang menunggu" }, { status: 400 })
      }
      if (booking.status !== "cancellation_pending") {
        return NextResponse.json({ error: "Booking tidak dalam status menunggu persetujuan" }, { status: 400 })
      }

      const hasPayment = Number(booking.total || 0) > 0

      // 1. Status booking + payment
      await admin
        .from("bookings")
        .update({
          status: hasPayment ? "refunded" : "cancelled",
          payment_status: hasPayment ? "refunded" : (booking.payment_status || "pending"),
          cancel_reason: refundRow.reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      // 2. Kembalikan kursi paket
      const { data: pkg } = await admin
        .from("packages")
        .select("quota_taken")
        .eq("id", booking.package_id)
        .single()
      if (pkg) {
        await admin
          .from("packages")
          .update({ quota_taken: Math.max(0, (pkg.quota_taken ?? 0) - booking.pilgrim_count) })
          .eq("id", booking.package_id)
      }

      // 3. Optimistis: siap proses refund manual
      await admin
        .from("booking_refunds")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", refundId)

      // Notifikasi ke customer
      try {
        const { createNotification } = await import("@/lib/notify/create-notification")
        await createNotification({
          userId: booking.customer_id,
          tenantId: booking.tenant_id,
          title: hasPayment ? "Pembatalan disetujui, refund diproses" : "Pembatalan disetujui",
          body: hasPayment
            ? "Permintaan pembatalan Anda telah disetujui travel. Dana refund sedang dalam proses pengembalian."
            : "Permintaan pembatalan Anda telah disetujui oleh travel.",
          templateKey: "refund_approved",
          linkUrl: `/dashboard/bookings/${booking.id}`,
          payload: { booking_id: booking.id },
        })
      } catch (notifErr) {
        console.error("[notify refund approve]", notifErr)
      }

      return NextResponse.json({ success: true, status: "refunded", refundId })
    }

    if (action === "reject") {
      if (!refundId || refundRow.status !== "pending") {
        return NextResponse.json({ error: "Tidak ada permintaan pembatalan yang menunggu" }, { status: 400 })
      }
      if (booking.status !== "cancellation_pending") {
        return NextResponse.json({ error: "Booking tidak dalam status menunggu persetujuan" }, { status: 400 })
      }

      // Kembalikan ke status sebelum permintaan
      const previous = refundRow.previous_status || "pending_payment"
      await admin
        .from("bookings")
        .update({ status: previous, updated_at: new Date().toISOString() })
        .eq("id", bookingId)

      await admin
        .from("booking_refunds")
        .update({
          status: "rejected",
          note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", refundId)

      // Notifikasi ke customer
      try {
        const { createNotification } = await import("@/lib/notify/create-notification")
        await createNotification({
          userId: booking.customer_id,
          tenantId: booking.tenant_id,
          title: "Permintaan pembatalan ditolak",
          body: note
            ? `Travel menolak permintaan pembatalan Anda: ${note}`
            : "Travel menolak permintaan pembatalan Anda. Pesanan kembali aktif.",
          templateKey: "refund_rejected",
          linkUrl: `/dashboard/bookings/${booking.id}`,
          payload: { booking_id: booking.id },
        })
      } catch (notifErr) {
        console.error("[notify refund reject]", notifErr)
      }

      return NextResponse.json({ success: true, status: previous, refundId })
    }

    // process / complete membutuhkan booking sudah refunded
    if (booking.status !== "refunded") {
      return NextResponse.json({ error: "Booking tidak dalam status refund" }, { status: 400 })
    }

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