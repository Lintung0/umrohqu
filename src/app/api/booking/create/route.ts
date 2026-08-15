import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { calculateTotalFee } from "@/lib/business-logic/fees"
import { getFeeConfig } from "@/lib/business-logic/fee-config"
import { z } from "zod"

const pilgrimSchema = z.object({
  full_name: z.string().min(1),
  nik: z.string().nullable().optional(),
  passport_no: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  relation: z.string().default("self"),
})

const schema = z.object({
  packageId: z.string().uuid(),
  pilgrimCount: z.number().min(1).max(99),
  pilgrims: z.array(pilgrimSchema).optional(),
  paymentType: z.enum(["full", "dp"]),
  dpPercentage: z.number().min(10).max(90).optional(),
  useWallet: z.boolean().default(false),
  feeChannel: z.enum(["portal", "subdomain", "custom_domain"]).default("portal"),
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

    const { packageId, pilgrimCount, pilgrims, paymentType, dpPercentage, useWallet, feeChannel, notes } = parsed.data
    const admin = createAdminClient()

    // 1. Get package (harga & fee SELALU dari database, bukan dari client)
    const { data: pkg, error: pkgErr } = await admin
      .from("packages")
      .select("id, tenant_id, name, price, quota, available, slug")
      .eq("id", packageId)
      .in("status", ["active", "ongoing"])
      .is("deleted_at", null)
      .single()

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 })
    }

    // 2. Hitung biaya server-side dari fee_config di database
    const feeConfig = await getFeeConfig(admin)
    const feeBreakdown = calculateTotalFee(Number(pkg.price), pilgrimCount, feeChannel, feeConfig)

    const totalPrice = Number(pkg.price) * pilgrimCount
    const totalFee = feeBreakdown.total

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

    // 3. Wallet payment
    let paymentStatus: "pending" | "paid" = "pending"
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

    // 4. Insert booking
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
        platform_fee: feeBreakdown.totalPlatformFee,
        service_fee: feeBreakdown.serviceFee,
        tax_amount: feeBreakdown.tax,
        fee_channel: feeChannel,
        notes: notes || null,
      })
      .select("id")
      .single()

    if (insertErr) {
      return NextResponse.json({ error: "Gagal membuat booking: " + insertErr.message }, { status: 500 })
    }

    // 4b. Insert booking_participants
    if (pilgrims && pilgrims.length > 0) {
      const participantRecords = pilgrims.map((p) => ({
        booking_id: booking.id,
        full_name: p.full_name,
        nik: p.nik || null,
        passport_no: p.passport_no || null,
        gender: p.gender || null,
        phone: p.phone || null,
        relation: p.relation || "self",
      }))
      await admin.from("booking_participants").insert(participantRecords)
    }

    // 4c. Update package quota
    await admin
      .from("packages")
      .update({
        quota: Math.max(0, (pkg.quota || 0) - pilgrimCount),
        available: Math.max(0, (pkg.available || 0) - pilgrimCount),
      })
      .eq("id", packageId)

    // 5. Catat transaksi (payments + invoices) — wajib ada di database
    const now = new Date().toISOString()
    const { data: payment, error: payErr } = await admin
      .from("payments")
      .insert({
        booking_id: booking.id,
        tenant_id: pkg.tenant_id,
        status: paymentStatus,
        gateway: useWallet ? "wallet" : "xendit",
        amount: payNow,
        paid_at: useWallet ? now : null,
      })
      .select("id")
      .single()

    if (payErr) {
      console.error("Payment insert error:", payErr)
    }

    const { error: invErr } = await admin.from("invoices").insert({
      invoice_no: `INV-B-${booking.id.slice(0, 8).toUpperCase()}`,
      booking_id: booking.id,
      tenant_id: pkg.tenant_id,
      total: totalPrice + totalFee,
      status: useWallet ? "paid" : "issued",
      amount: payNow,
      type: "booking",
      description: `${pkg.name} (${pilgrimCount} jemaah) - ${paymentType === "dp" ? `DP ${dpPercentage}%` : "Pembayaran lunas"}`,
      paid_at: useWallet ? now : null,
    })

    if (invErr) {
      console.error("Invoice insert error:", invErr)
    }

    // 6. If not wallet, create Xendit invoice
    let xenditInvoice: { id: string; invoice_url: string } | null = null
    if (!useWallet) {
      try {
        const { createInvoice } = await import("@/lib/services/xendit")
        const host = request.headers.get("host") || ""
        const protocol = host.includes("localhost") ? "http" : "https"
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
        const inv = await createInvoice({
          externalId: `booking-${booking.id}`,
          amount: payNow,
          description: `Pembayaran ${paymentType === "dp" ? "DP " : ""}booking ${booking.id.slice(0, 8)}`,
          customer: { email: user.email },
          successRedirectUrl: `${BASE_URL}/booking-success/${booking.id}`,
          failureRedirectUrl: `${BASE_URL}/checkout?slug=${pkg.slug}&failed=true`,
        })

        xenditInvoice = { id: inv.id, invoice_url: inv.invoice_url }

        await admin
          .from("bookings")
          .update({ xendit_invoice_id: inv.id })
          .eq("id", booking.id)

        if (payment) {
          await admin
            .from("payments")
            .update({ gateway_reference: inv.id })
            .eq("id", payment.id)
        }
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
