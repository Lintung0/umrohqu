import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTransactionStatus, isSuccessStatus, isPendingStatus } from "@/lib/services/midtrans"
import { applyPaymentEvent } from "@/lib/services/payment-events"
import { z } from "zod"

export const dynamic = "force-dynamic"

const schema = z.object({ bookingId: z.string().uuid() })

// Rekonsiliasi mandiri per booking (self-heal, konservatif):
// - settlement di gateway tapi DB masih pending → catat via state machine
// - pending di gateway → catat detail VA bila ada
// - terminal di gateway (expire/cancel/deny) → tutup payment row
// - tidak dikenal gateway DAN payment row > 24 jam → tutup sebagai expired
//   (user bebas bayar ulang via payment row baru)
// - tidak dikenal gateway TAPI masih segar (< 24 jam) → dibiarkan
//   (user mungkin sedang membayar)
const STALE_MS = 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "ID booking tidak valid" }, { status: 400 })
    }
    const { bookingId } = parsed.data
    const admin = createAdminClient()

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .maybeSingle()
    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const { data: pendings } = await admin
      .from("payments")
      .select("id, gateway_reference, created_at")
      .eq("booking_id", bookingId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    const actions: Array<{ payment_id: string; action: string; detail?: string }> = []

    for (const p of pendings ?? []) {
      const candidates = [p.gateway_reference, `booking-${bookingId}`].filter(Boolean) as string[]
      let txn: Awaited<ReturnType<typeof getTransactionStatus>> | null = null
      let matched: string | null = null
      for (const orderId of candidates) {
        try {
          txn = await getTransactionStatus(orderId)
          matched = orderId
          break
        } catch {
          // coba kandidat berikutnya
        }
      }

      const isRemaining = (p.gateway_reference || "").startsWith("pay-remaining-")

      if (txn && isSuccessStatus(txn.transaction_status)) {
        const r = await applyPaymentEvent(admin, {
          bookingId,
          paymentId: p.id,
          isRemaining,
          event: {
            kind: "success",
            transactionId: txn.transaction_id || matched || undefined,
            transactionTime: txn.transaction_time,
            paymentType: txn.payment_type,
            vaNumber: txn.va_numbers?.[0]?.va_number || (txn as any).payment_code || undefined,
            paymentProvider: txn.va_numbers?.[0]?.bank || (txn as any).bank || undefined,
          },
        })
        actions.push({ payment_id: p.id, action: "healed_settlement", detail: r.reason })
        continue
      }

      if (txn && isPendingStatus(txn.transaction_status)) {
        const r = await applyPaymentEvent(admin, {
          bookingId,
          paymentId: p.id,
          isRemaining,
          event: {
            kind: "pending",
            transactionId: txn.transaction_id || matched || undefined,
            paymentType: txn.payment_type,
            vaNumber: txn.va_numbers?.[0]?.va_number || (txn as any).payment_code || undefined,
            paymentProvider: txn.va_numbers?.[0]?.bank || (txn as any).bank || undefined,
          },
        })
        actions.push({ payment_id: p.id, action: "va_synced", detail: r.reason })
        continue
      }

      if (txn) {
        const terminal = txn.transaction_status === "expire" ? "expired" as const
          : txn.transaction_status === "cancel" ? "canceled" as const
          : "failed" as const
        const r = await applyPaymentEvent(admin, {
          bookingId, paymentId: p.id, isRemaining,
          event: { kind: "terminal", terminalStatus: terminal },
        })
        actions.push({ payment_id: p.id, action: `closed_${terminal}`, detail: r.reason })
        continue
      }

      // Tidak dikenal gateway: hanya tutup bila sudah basi (> 24 jam)
      const age = Date.now() - new Date(p.created_at).getTime()
      if (age > STALE_MS) {
        const r = await applyPaymentEvent(admin, {
          bookingId, paymentId: p.id, isRemaining,
          event: { kind: "terminal", terminalStatus: "expired" },
        })
        actions.push({ payment_id: p.id, action: "closed_stale", detail: r.reason })
      } else {
        actions.push({ payment_id: p.id, action: "skipped_fresh" })
      }
    }

    const { data: fresh } = await admin.from("bookings").select("status").eq("id", bookingId).maybeSingle()

    return NextResponse.json({ booking_status: fresh?.status ?? booking.status, actions })
  } catch (err) {
    console.error("reconcile error:", err)
    return NextResponse.json({ error: "Gagal menjalankan rekonsiliasi" }, { status: 500 })
  }
}
