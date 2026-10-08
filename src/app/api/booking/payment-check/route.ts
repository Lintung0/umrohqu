import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTransactionStatus, isSuccessStatus, isPendingStatus, probeServerKey } from "@/lib/services/midtrans"

export const dynamic = "force-dynamic"

// Jawaban jujur atas "pesanan ini sudah bayar atau belum?"
// READ-ONLY: tidak mengubah data apa pun, hanya membandingkan
// status DB dengan status live di Midtrans.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const bookingId = request.nextUrl.searchParams.get("bookingId")
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId wajib diisi" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, payment_status, total, updated_at")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .maybeSingle()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const { data: payments } = await admin
      .from("payments")
      .select("id, status, va_number, payment_provider, payment_type, gateway_reference, amount, created_at, paid_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    const target = (payments ?? []).find((p: any) => p.status === "pending") ?? null

    let live: {
      order_id: string | null
      transaction_status: string | null
      payment_type: string | null
      gateway_found: boolean
    } = { order_id: null, transaction_status: null, payment_type: null, gateway_found: false }

    if (target?.gateway_reference) {
      for (const orderId of [target.gateway_reference, `booking-${bookingId}`]) {
        try {
          const txn = await getTransactionStatus(orderId)
          live = {
            order_id: orderId,
            transaction_status: txn.transaction_status,
            payment_type: txn.payment_type ?? null,
            gateway_found: true,
          }
          break
        } catch {
          // coba kandidat berikutnya
        }
      }
      if (!live.gateway_found) {
        live.order_id = target.gateway_reference
      }
    }

    // Kesimpulan tunggal yang bisa ditampilkan ke user/support
    let conclusion: string
    if (booking.status !== "pending_payment") {
      conclusion = booking.status === "processing" || booking.status === "confirmed"
        ? "recorded_waiting_travel"
        : `booking_${booking.status}`
    } else if (!target) {
      conclusion = "no_pending_payment_row"
    } else if (!live.gateway_found) {
      conclusion = "no_gateway_transaction"
    } else if (live.transaction_status && isSuccessStatus(live.transaction_status)) {
      conclusion = "settled_unrecorded"
    } else if (live.transaction_status && isPendingStatus(live.transaction_status)) {
      conclusion = "pending_at_gateway"
    } else {
      conclusion = `terminal_at_gateway:${live.transaction_status}`
    }

    return NextResponse.json({
      booking: { id: booking.id, status: booking.status, payment_status: booking.payment_status, total: booking.total },
      payments: payments ?? [],
      live,
      conclusion,
      // Kesehatan koneksi server → gateway. Kalau key_valid false,
      // verify/reconcile/webhook SEMUA buta — masalah konfigurasi.
      server: await probeServerKey().catch(() => ({ valid: false, httpStatus: 0, detail: "probe_failed", env: "unknown" })),
    })
  } catch (err) {
    console.error("payment-check error:", err)
    return NextResponse.json({ error: "Gagal memeriksa pembayaran" }, { status: 500 })
  }
}
