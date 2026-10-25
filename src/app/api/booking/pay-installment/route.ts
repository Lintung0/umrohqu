import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { appUrl } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  invoiceId: z.string().uuid(),
})

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
      return NextResponse.json({ error: "ID invoice tidak valid" }, { status: 400 })
    }

    const { invoiceId } = parsed.data
    const admin = createAdminClient()

    // 1. Ambil data invoice
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, invoice_number, installment_number, invoice_type, amount, status, due_date, booking_id, tenant_id")
      .eq("id", invoiceId)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 })
    }

    // 2. Ambil data booking & verifikasi kepemilikan
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, customer_id, package_id, booking_code, package:packages(name)")
      .eq("id", invoice.booking_id)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan atau bukan milik Anda" }, { status: 404 })
    }

    if (["cancelled", "cancellation_pending", "refunded"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking dibatalkan / dalam proses pembatalan" }, { status: 400 })
    }

    const payAmount = Number(invoice.amount)
    if (payAmount <= 0) {
      return NextResponse.json({ error: "Nominal pembayaran tidak valid" }, { status: 400 })
    }

    // 3. Catat transaksi payments via RPC create_payment
    const { data: paymentId, error: payErr } = await admin.rpc("create_payment", {
      p_booking_id: booking.id,
      p_tenant_id: invoice.tenant_id,
      p_status: "pending",
      p_gateway: "midtrans",
      p_amount: payAmount,
      p_currency: "IDR",
    })

    if (payErr) {
      console.error("Payment insert error:", payErr)
    }

    // Hubungkan payment record dengan invoice_id
    if (paymentId) {
      await admin
        .from("payments")
        .update({
          invoice_id: invoice.id,
          gateway_reference: invoice.id,
        })
        .eq("id", paymentId)
    }

    // Order ID langsung menggunakan ID database asli invoice.id
    const orderId = invoice.id
    const finishBase = appUrl(`checkout/finish?booking_id=${booking.id}`)

    let snap: { token: string; redirect_url: string } | null = null
    try {
      const { createSnapTransaction } = await import("@/lib/services/midtrans")
      const packageName = (booking as any)?.package?.name || "Paket Umrah"
      const label = invoice.installment_number === 0
        ? "Uang Muka"
        : `Cicilan Bulan ke-${invoice.installment_number}`

      snap = await createSnapTransaction({
        orderId,
        grossAmount: payAmount,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        items: [
          {
            id: invoice.id,
            name: `${packageName} - ${label}`,
            price: payAmount,
            quantity: 1,
          },
        ],
        finishUrl: finishBase,
        unfinishUrl: appUrl(`checkout/finish?booking_id=${booking.id}&status=unfinish`),
        errorUrl: appUrl(`checkout/finish?booking_id=${booking.id}&status=error`),
      })
    } catch (merr: unknown) {
      console.error("Midtrans Snap installment error:", merr instanceof Error ? merr.message : merr)
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      invoice_id: invoice.id,
      amount: payAmount,
      snap,
    })
  } catch (err) {
    console.error("Pay installment error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
