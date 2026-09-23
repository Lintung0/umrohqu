import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { calculateTotalFee } from "@/lib/business-logic/fees"
import { getFeeConfig } from "@/lib/business-logic/fee-config"
import { appUrl } from "@/lib/utils"
import { isDataDiriComplete, type DataDiriAddress, type DataDiriProfile } from "@/lib/data-diri"
import { z } from "zod"

const pilgrimSchema = z.object({
  full_name: z.string().min(1),
  national_id: z.string().nullable().optional(),
  passport_number: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  relation: z.string().default("self"),
})

const schema = z.object({
  packageId: z.string().uuid(),
  packageDepartureId: z.string().uuid().nullable().optional(),
  pilgrimCount: z.number().min(1).max(99),
  pilgrims: z.array(pilgrimSchema).optional(),
  paymentType: z.enum(["full", "dp"]),
  dpPercentage: z.number().min(10).max(90).optional(),
  feeChannel: z.enum(["portal", "subdomain", "custom_domain"]).default("portal"),
  referralCode: z.string().optional(),
  notes: z.string().optional(),
})

function toBookingChannel(feeChannel: string): string {
  if (feeChannel === "subdomain") return "agency_subdomain"
  if (feeChannel === "custom_domain") return "agency_custom_domain"
  return "marketplace"
}

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

    const { packageId, packageDepartureId, pilgrimCount, pilgrims, paymentType, dpPercentage, feeChannel, referralCode, notes } = parsed.data
    const admin = createAdminClient()

    // 1. Get package (harga SELALU dari database, bukan dari client)
    const { data: pkg, error: pkgErr } = await admin
      .from("packages")
      .select("id, tenant_id, name, price, quota, quota_taken, slug, cashback_amount")
      .eq("id", packageId)
      .in("status", ["active", "ongoing"])
      .is("deleted_at", null)
      .single()

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 })
    }

    const feeConfig = await getFeeConfig(admin)
    const feeBreakdown = calculateTotalFee(Number(pkg.price), pilgrimCount, feeChannel, feeConfig)

    const totalPrice = Number(pkg.price) * pilgrimCount

    let dpAmount: number
    let remainingAmount: number
    let remainingDueDate: string | null = null

    if (paymentType === "dp") {
      if (!dpPercentage) {
        return NextResponse.json({ error: "Persentase DP wajib diisi" }, { status: 400 })
      }
      dpAmount = Math.round(totalPrice * dpPercentage / 100)
      remainingAmount = totalPrice - dpAmount
      remainingDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      dpAmount = totalPrice
      remainingAmount = 0
    }

    const payNow = dpAmount

    // 2. Insert booking
    // Resolve agent_id from referral_code if provided
    let agentId: string | null = null
    if (referralCode) {
      const { data: agent } = await admin
        .from("agents")
        .select("id")
        .eq("referral_code", referralCode)
        .eq("status", "active")
        .maybeSingle()
      agentId = agent?.id || null
    }

    const { data: booking, error: insertErr } = await admin
      .from("bookings")
      .insert({
        package_id: packageId,
        package_departure_id: packageDepartureId,
        tenant_id: pkg.tenant_id,
        customer_id: user.id,
        agent_id: agentId,
        referral_code: referralCode || null,
        status: "pending_payment",
        booking_channel: toBookingChannel(feeChannel),
        pilgrim_count: pilgrimCount,
        price: pkg.price,
        total: payNow,
        dp_type: paymentType === "dp" ? "dp" : "full",
        dp_amount: paymentType === "dp" ? dpAmount : 0,
        remaining_amount: paymentType === "dp" ? remainingAmount : 0,
        remaining_due_date: remainingDueDate,
        cashback_amount: Number(pkg.cashback_amount || 0),
        notes: notes || null,
      })
      .select("id, booking_code")
      .single()

    if (insertErr) {
      console.error("Booking insert error:", insertErr)
      return NextResponse.json({ error: "Gagal membuat booking" }, { status: 500 })
    }

    // 3. Insert participants
    if (pilgrims && pilgrims.length > 0) {
      const participantRecords = pilgrims.map((p) => ({
        booking_id: booking.id,
        full_name: p.full_name,
        national_id: p.national_id || null,
        passport_number: p.passport_number || null,
        gender: p.gender || null,
        phone: p.phone || null,
        relation: p.relation || "self",
      }))
      await admin.from("participants").insert(participantRecords)
    }

    // 4. Update package quota (reserved on booking creation)
    await admin
      .from("packages")
      .update({
        quota_taken: Math.max(0, (pkg.quota_taken ?? 0) + pilgrimCount),
      })
      .eq("id", packageId)

    // 5. Notifikasi: pemesanan berhasil + cek kelengkapan data diri
    try {
      const { createNotification } = await import("@/lib/notify/create-notification")
      const bookingCode = booking.id.slice(0, 8).toUpperCase()
      await createNotification({
        userId: user.id,
        tenantId: pkg.tenant_id,
        title: "Pemesanan berhasil dibuat",
        body: `Booking #${bookingCode} — ${pkg.name} (${pilgrimCount} jamaah). Mohon selesaikan pembayaran sesuai nominal DP.`,
        templateKey: "booking_created",
        linkUrl: `/dashboard/bookings/${booking.id}`,
        payload: { booking_id: booking.id, package_name: pkg.name },
      })

      const [{ data: userRow }, { data: addrRow }] = await Promise.all([
        admin.from("users").select("profile").eq("id", user.id).maybeSingle(),
        admin.from("addresses").select("*").eq("user_id", user.id).maybeSingle(),
      ])
      const profile = (userRow?.profile || {}) as DataDiriProfile
      const address = {
        street: addrRow?.street || null,
        city: addrRow?.city || null,
        province: addrRow?.province || null,
        postal_code: addrRow?.postal_code || null,
      } as DataDiriAddress
      if (!isDataDiriComplete(profile, address)) {
        await createNotification({
          userId: user.id,
          tenantId: pkg.tenant_id,
          title: "Lengkapi data diri Anda",
          body: "Selesaikan informasi data jamaah (paspor, tempat lahir, kontak darurat, alamat) agar pengajuan visa dan pemberangkatan lebih lancar.",
          templateKey: "data_diri_incomplete",
          linkUrl: "/dashboard/data-diri",
          payload: { booking_id: booking.id },
        })
      }
    } catch (notifErr) {
      console.error("[notify booking create]", notifErr)
    }

    // 6. Catat transaksi payments via RPC create_payment (trigger menuntut app.booking_id)
    const { data: paymentId, error: payErr } = await admin.rpc("create_payment", {
      p_booking_id: booking.id,
      p_tenant_id: pkg.tenant_id,
      p_status: "pending",
      p_gateway: "midtrans",
      p_amount: payNow,
      p_currency: "IDR",
    })

    if (payErr) {
      console.error("Payment insert error:", payErr)
    }

    // 6. Create Midtrans Snap token
    let snap: { token: string; redirect_url: string } | null = null
    try {
      const { createSnapTransaction } = await import("@/lib/services/midtrans")
      const orderId = paymentId ? `pay-${paymentId}` : `pay-${booking.id.slice(0, 8)}-${Date.now()}`
      const finishBase = appUrl(`checkout/finish?booking_id=${booking.id}`)
      snap = await createSnapTransaction({
        orderId,
        grossAmount: payNow,
        customerName: user.user_metadata?.full_name || user.email,
        customerEmail: user.email,
        items: [
          {
            id: pkg.id,
            name: `${pkg.name}${paymentType === "dp" ? ` (DP ${dpPercentage}%)` : ""}`,
            price: payNow,
            quantity: 1,
          },
        ],
        finishUrl: finishBase,
        unfinishUrl: appUrl(`checkout/finish?booking_id=${booking.id}&status=unfinish`),
        errorUrl: appUrl(`checkout/finish?booking_id=${booking.id}&status=error`),
      })

      if (paymentId) {
        await admin
          .from("payments")
          .update({ gateway_reference: orderId })
          .eq("id", paymentId)
      }
    } catch (serr: any) {
      console.error("Midtrans Snap error:", serr.message)
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      payment_type: paymentType,
      dp_amount: dpAmount,
      remaining: remainingAmount,
      total: payNow,
      snap: snap,
    })
  } catch (err) {
    console.error("Create booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
