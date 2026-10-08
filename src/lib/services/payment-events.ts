import type { SupabaseClient } from "@supabase/supabase-js"
import { stablePaymentType } from "./midtrans"

// ─── Single source of truth untuk SEMUA perubahan status pembayaran ───
// Semua jalur (webhook Midtrans, verify manual, reconcile, admin) WAJIB lewat
// fungsi ini. Tidak ada lagi update status pembayaran yang tersebar di
// route-route berbeda. Setiap aplikasi event dicatat ke audit_logs.
//
// Prinsip dana (PRD — fasilitator, bukan kustodian):
// - Uang jamaah 100% ke merchant travel; platform tidak pernah memegang dana.
// - Bukti sukses gateway → booking "processing" (antri verifikasi travel).
//   TIDAK PERNAH auto-confirm.
// - Booking yang gagal/expired TIDAK dibatalkan otomatis — user boleh bayar
//   ulang lewat payment row baru.

export type GatewayMoneyEvent =
  | {
      kind: "success"
      transactionId?: string
      transactionTime?: string
      paymentType?: string
      vaNumber?: string
      paymentProvider?: string
    }
  | {
      kind: "pending"
      transactionId?: string
      paymentType?: string
      vaNumber?: string
      paymentProvider?: string
    }
  | { kind: "terminal"; terminalStatus: "expired" | "failed" | "canceled" }

export interface ApplyResult {
  applied: boolean
  bookingStatus: string | null
  paymentStatus: string | null
  reason: string
}

async function audit(
  admin: SupabaseClient,
  opts: {
    tenantId: string | null
    action: string
    objectId: string
    meta: Record<string, unknown>
  }
) {
  try {
    await admin.from("audit_logs").insert({
      actor_id: null,
      tenant_id: opts.tenantId,
      action: opts.action,
      object_type: "payments",
      object_id: opts.objectId,
      meta: opts.meta,
    })
  } catch (e) {
    // Audit tidak boleh menggagalkan pencatatan pembayaran
    console.error("[payment-events] audit failed:", e)
  }
}

export async function applyPaymentEvent(
  admin: SupabaseClient,
  opts: {
    bookingId: string
    paymentId?: string | null
    isRemaining: boolean
    event: GatewayMoneyEvent
  }
): Promise<ApplyResult> {
  const { bookingId, paymentId, isRemaining, event } = opts

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, total, remaining_amount, tenant_id")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking) {
    return { applied: false, bookingStatus: null, paymentStatus: null, reason: "booking_not_found" }
  }

  const { data: payment } = paymentId
    ? await admin
        .from("payments")
        .select("id, status, gateway_reference, amount")
        .eq("id", paymentId)
        .maybeSingle()
    : await admin
        .from("payments")
        .select("id, status, gateway_reference, amount")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

  if (!payment) {
    return { applied: false, bookingStatus: booking.status, paymentStatus: null, reason: "no_payment_row" }
  }

  // Idempoten: payment yang sudah paid tidak boleh berubah lagi
  if (payment.status === "paid") {
    return { applied: false, bookingStatus: booking.status, paymentStatus: "paid", reason: "already_paid" }
  }

  const stamp = new Date().toISOString()

  if (event.kind === "success") {
    const paidAt = event.transactionTime
      ? new Date(event.transactionTime).toISOString()
      : stamp

    if (isRemaining) {
      // Pelunasan: booking lunas; status operasional ikut verifikasi travel
      await admin
        .from("bookings")
        .update({
          remaining_amount: 0,
          total: Number(booking.total || 0) + Number(booking.remaining_amount || 0),
          updated_at: paidAt,
        })
        .eq("id", bookingId)
    } else if (booking.status === "pending_payment") {
      // Pembayaran awal sukses → antri verifikasi travel (DO NOT auto-confirm)
      await admin
        .from("bookings")
        .update({ status: "processing", updated_at: paidAt })
        .eq("id", bookingId)
    }

    await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: paidAt,
        payment_type: event.paymentType ? (stablePaymentType(event.paymentType) as never) : undefined,
        payment_provider: event.paymentProvider || null,
        va_number: event.vaNumber || "",
        gateway_reference: event.transactionId || payment.gateway_reference,
        updated_at: paidAt,
      })
      .eq("id", payment.id)

    await audit(admin, {
      tenantId: (booking as any).tenant_id ?? null,
      action: isRemaining ? "payment.remaining_paid" : "payment.paid",
      objectId: payment.id,
      meta: { booking_id: bookingId, transaction_id: event.transactionId ?? null },
    })

    const { data: fresh } = await admin.from("bookings").select("status").eq("id", bookingId).maybeSingle()
    return { applied: true, bookingStatus: fresh?.status ?? booking.status, paymentStatus: "paid", reason: "success_applied" }
  }

  if (event.kind === "pending") {
    // Tetap pending — catat detail metode yang dipilih (VA terbit di sini)
    await admin
      .from("payments")
      .update({
        payment_type: event.paymentType ? (stablePaymentType(event.paymentType) as never) : undefined,
        payment_provider: event.paymentProvider || null,
        va_number: event.vaNumber || null,
        gateway_reference: event.transactionId || payment.gateway_reference,
        updated_at: stamp,
      })
      .eq("id", payment.id)

    return { applied: true, bookingStatus: booking.status, paymentStatus: "pending", reason: "pending_recorded" }
  }

  // Terminal (expired/failed/canceled): payment ditutup, booking TETAP
  // pending_payment agar user bisa bayar ulang via payment row baru.
  if (payment.status === "pending") {
    await admin
      .from("payments")
      .update({ status: event.terminalStatus === "expired" ? "expired" : "failed", updated_at: stamp })
      .eq("id", payment.id)

    await audit(admin, {
      tenantId: (booking as any).tenant_id ?? null,
      action: "payment.terminal",
      objectId: payment.id,
      meta: { booking_id: bookingId, terminal_status: event.terminalStatus },
    })

    return {
      applied: true,
      bookingStatus: booking.status,
      paymentStatus: event.terminalStatus === "expired" ? "expired" : "failed",
      reason: "terminal_recorded",
    }
  }

  return { applied: false, bookingStatus: booking.status, paymentStatus: payment.status, reason: "no_transition" }
}
