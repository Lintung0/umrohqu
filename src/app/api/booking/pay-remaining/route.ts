import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  useWallet: z.boolean().default(false),
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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { bookingId, useWallet } = parsed.data
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, payment_type, remaining_amount, total, customer_id, tenant_id")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (booking.payment_type !== "dp") {
      return NextResponse.json({ error: "Bukan booking DP" }, { status: 400 })
    }

    if (booking.status === "confirmed") {
      return NextResponse.json({ error: "Booking sudah lunas" }, { status: 400 })
    }

    const remaining = Number(booking.remaining_amount)
    if (remaining <= 0) {
      return NextResponse.json({ error: "Sisa pembayaran sudah 0" }, { status: 400 })
    }

    // Wallet payment
    let xenditInvoice: { id: string; invoice_url: string } | null = null

    if (useWallet) {
      const { data: wallet } = await admin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single()

      if (!wallet || Number(wallet.balance) < remaining) {
        return NextResponse.json({ error: "Saldo tidak mencukupi", balance: wallet?.balance, need: remaining }, { status: 400 })
      }

      const balanceAfter = Number(wallet.balance) - remaining
      const now = new Date().toISOString()
      await admin.from("wallets").update({ balance: balanceAfter, updated_at: now }).eq("id", wallet.id)
      await admin.from("wallet_transactions").insert({
        user_id: user.id,
        type: "payment",
        amount: remaining,
        balance_before: Number(wallet.balance),
        balance_after: balanceAfter,
        status: "success",
        description: "Pelunasan sisa booking #" + bookingId.slice(0, 8).toUpperCase(),
      })

      await admin.from("payments").insert({
        booking_id: bookingId,
        tenant_id: booking.tenant_id,
        status: "paid",
        gateway: "wallet",
        amount: remaining,
        paid_at: now,
      })

      await admin.from("invoices").insert({
        invoice_no: `INV-B-${bookingId.slice(0, 8).toUpperCase()}`,
        booking_id: bookingId,
        tenant_id: booking.tenant_id,
        total: remaining,
        status: "paid",
        amount: remaining,
        type: "booking",
        description: "Pelunasan sisa booking #" + bookingId.slice(0, 8).toUpperCase(),
        paid_at: now,
      })

      await admin.from("bookings").update({
        status: "confirmed",
        payment_status: "paid",
        remaining_amount: 0,
        total: Number(booking.total) + remaining,
        updated_at: now,
      }).eq("id", bookingId)
    } else {
      // Xendit invoice
      try {
        // Pastikan record transaksi ada untuk pelunasan ini
        const { data: payment } = await admin
          .from("payments")
          .insert({
            booking_id: bookingId,
            tenant_id: booking.tenant_id,
            status: "pending",
            gateway: "xendit",
            amount: remaining,
          })
          .select("id")
          .single()

        await admin.from("invoices").insert({
          invoice_no: `INV-B-${bookingId.slice(0, 8).toUpperCase()}`,
          booking_id: bookingId,
          tenant_id: booking.tenant_id,
          total: remaining,
          status: "issued",
          amount: remaining,
          type: "booking",
          description: "Pelunasan sisa booking #" + bookingId.slice(0, 8).toUpperCase(),
        })

        const { createInvoice } = await import("@/lib/services/xendit")
        const host = request.headers.get("host") || ""
        const protocol = host.includes("localhost") ? "http" : "https"
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
        const inv = await createInvoice({
          externalId: `booking-remaining-${bookingId}`,
          amount: remaining,
          description: `Pelunasan sisa booking #${bookingId.slice(0, 8).toUpperCase()}`,
          customer: { email: user.email },
          successRedirectUrl: `${BASE_URL}/booking-success/${bookingId}`,
          failureRedirectUrl: `${BASE_URL}/dashboard/bookings/${bookingId}?failed=true`,
        })
        xenditInvoice = { id: inv.id, invoice_url: inv.invoice_url }
        await admin.from("bookings").update({ xendit_invoice_id: inv.id }).eq("id", bookingId)
        if (payment) {
          await admin.from("payments").update({ gateway_reference: inv.id }).eq("id", payment.id)
        }
      } catch (xerr: any) {
        console.error("Xendit invoice error:", xerr.message)
      }
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      amount_paid: remaining,
      xendit: xenditInvoice,
    })
  } catch (err) {
    console.error("Pay remaining error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
