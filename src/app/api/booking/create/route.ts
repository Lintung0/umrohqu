import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  packageId: z.string().uuid(),
  pilgrimCount: z.number().min(1).max(99),
  paymentType: z.enum(["full", "dp"]),
  dpPercentage: z.number().min(10).max(90).optional(),
  useWallet: z.boolean().default(false),
  platformFee: z.number().default(0),
  serviceFee: z.number().default(0),
  taxAmount: z.number().default(0),
  feeChannel: z.string().default("portal"),
  notes: z.string().optional(),
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

    const { packageId, pilgrimCount, paymentType, dpPercentage, useWallet, platformFee, serviceFee, taxAmount, feeChannel, notes } = parsed.data
    const admin = createAdminClient()

    // 1. Get package
    const { data: pkg, error: pkgErr } = await admin
      .from("packages")
      .select("id, tenant_id, price, quota, available")
      .eq("id", packageId)
      .eq("status", "published")
      .is("deleted_at", null)
      .single()

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 })
    }

    const totalPrice = Number(pkg.price) * pilgrimCount
    const totalFee = platformFee + serviceFee + taxAmount
    let dpAmount: number
    let remainingAmount: number
    let remainingDueDate: string | null = null

    if (paymentType === "dp") {
      if (!dpPercentage) {
        return NextResponse.json({ error: "Persentase DP wajib diisi" }, { status: 400 })
      }
      dpAmount = Math.round(totalPrice * dpPercentage / 100)
      remainingAmount = totalPrice - dpAmount + totalFee
      remainingDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      dpAmount = totalPrice + totalFee
      remainingAmount = 0
    }

    const payNow = dpAmount

    // 2. Wallet payment
    let paymentStatus = "pending"
    let bookingStatus = "pending_payment"

    if (useWallet) {
      const { data: wallet, error: wErr } = await admin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single()

      if (wErr || !wallet) {
        return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 400 })
      }

      const balance = Number(wallet.balance)
      if (balance < payNow) {
        return NextResponse.json({ error: "Saldo tidak mencukupi", balance, need: payNow }, { status: 400 })
      }

      const balanceAfter = balance - payNow
      const { error: updateErr } = await admin
        .from("wallets")
        .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
        .eq("id", wallet.id)

      if (updateErr) {
        return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 })
      }

      const { error: txErr } = await admin
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "payment",
          amount: payNow,
          balance_before: balance,
          balance_after: balanceAfter,
          status: "success",
          description: paymentType === "dp" ? "Pembayaran DP booking" : "Pembayaran lunas booking",
        })

      if (txErr) {
        console.error("Wallet tx insert error:", txErr)
      }

      paymentStatus = "paid"
      bookingStatus = "confirmed"
    }

    // 3. Insert booking
    const { data: booking, error: insertErr } = await admin
      .from("bookings")
      .insert({
        package_id: packageId,
        tenant_id: pkg.tenant_id,
        customer_id: user.id,
        status: bookingStatus,
        pilgrim_count: pilgrimCount,
        price: totalPrice,
        fee: totalFee,
        total: payNow,
        payment_status: paymentStatus,
        payment_type: paymentType,
        dp_percentage: paymentType === "dp" ? dpPercentage : null,
        dp_amount: paymentType === "dp" ? dpAmount : 0,
        remaining_amount: remainingAmount,
        remaining_due_date: remainingDueDate,
        platform_fee: platformFee,
        service_fee: serviceFee,
        tax_amount: taxAmount,
        fee_channel: feeChannel,
        notes: notes || null,
      })
      .select("id")
      .single()

    if (insertErr) {
      return NextResponse.json({ error: "Gagal membuat booking: " + insertErr.message }, { status: 500 })
    }

    // 4. Update package quota
    await admin
      .from("packages")
      .update({
        quota: Math.max(0, (pkg.quota || 0) - pilgrimCount),
        available: Math.max(0, (pkg.available || 0) - pilgrimCount),
      })
      .eq("id", packageId)

    // 5. If not wallet, create Xendit invoice
    let xenditInvoice: { id: string; invoice_url: string } | null = null
    if (!useWallet) {
      try {
        const { createInvoice } = await import("@/lib/services/xendit")
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const inv = await createInvoice({
          externalId: `booking-${booking.id}`,
          amount: payNow,
          description: `Pembayaran ${paymentType === "dp" ? "DP " : ""}booking ${booking.id.slice(0, 8)}`,
          customer: { email: user.email },
          successRedirectUrl: `${BASE_URL}/dashboard/bookings/${booking.id}`,
          failureRedirectUrl: `${BASE_URL}/checkout?package=${packageId}&failed=true`,
        })

        xenditInvoice = { id: inv.id, invoice_url: inv.invoice_url }

        await admin
          .from("bookings")
          .update({ xendit_invoice_id: inv.id })
          .eq("id", booking.id)
      } catch (xerr: any) {
        console.error("Xendit invoice error:", xerr.message)
      }
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      payment_type: paymentType,
      dp_amount: dpAmount,
      remaining: remainingAmount,
      total: payNow,
      xendit: xenditInvoice,
    })
  } catch (err) {
    console.error("Create booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
