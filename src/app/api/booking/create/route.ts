import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { calculateTotalFee } from "@/lib/business-logic/fees"
import { getFeeConfig } from "@/lib/business-logic/fee-config"
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
  paymentType: z.enum(["full", "dp", "installment"]).default("installment"),
  paymentMethod: z.enum(["transfer", "cash"]).default("transfer"),
  bankId: z.string().uuid().nullable().optional(),
  dpAmount: z.number().min(1).optional(),
  dpPercentage: z.number().min(10).max(90).optional(),
  tenorMonths: z.number().min(1).max(60).optional(),
  installmentOptionId: z.string().uuid().nullable().optional(),
  feeChannel: z.enum(["portal", "subdomain", "custom_domain"]).default("portal"),
  referralCode: z.string().optional(),
  notes: z.string().optional(),
})

type BankSnapshot = {
  id: string
  bank_code: string
  bank_name: string
  account_number: string
  account_holder_name: string
}

function toBookingChannel(feeChannel: string): string {
  if (feeChannel === "subdomain") return "agency_subdomain"
  if (feeChannel === "custom_domain") return "agency_custom_domain"
  return "marketplace"
}

function getMissingColumn(error: { code?: string; message?: string } | null): string | null {
  if (error?.code !== "PGRST204") return null
  return error.message?.match(/Could not find the '([^']+)' column/)?.[1] ?? null
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const body = await _request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const {
      packageId,
      packageDepartureId,
      pilgrimCount,
      pilgrims,
      paymentType,
      paymentMethod,
      bankId,
      dpAmount: requestedDpAmount,
      dpPercentage,
      tenorMonths,
      installmentOptionId,
      feeChannel,
      referralCode,
      notes,
    } = parsed.data
    const isInstallment = paymentType === "installment" || paymentType === "dp"
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

    // Idempotency: cek apakah booking pending_payment sudah ada untuk user+package+departure
    let existingQuery = admin
      .from("bookings")
      .select("id, status, total, down_payment_amount, remaining_amount, payment_scheme")
      .eq("customer_id", user.id)
      .eq("package_id", packageId)
      .eq("status", "pending_payment")
    existingQuery = packageDepartureId
      ? existingQuery.eq("package_departure_id", packageDepartureId)
      : existingQuery.is("package_departure_id", null)
    const { data: existingBooking } = await existingQuery.maybeSingle()

    if (existingBooking?.id) {
      // Booking sudah ada — kembalikan data booking lama (hindari duplikat pesanan)
      const { data: existingPayment } = await admin
        .from("payments")
        .select("id, amount, payment_channel, proof_url, destination_bank_id, bank:banks(id, bank_code, bank_name, account_number, account_holder_name)")
        .eq("booking_id", existingBooking.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        booking_id: existingBooking.id,
        payment_type: existingBooking.payment_scheme === "full_payment" ? "full" : "installment",
        dp_amount: existingBooking.down_payment_amount || 0,
        remaining: existingBooking.remaining_amount || 0,
        total: existingBooking.total || 0,
        payment: existingPayment || null,
        snap: null,
        is_duplicate: true,
      })
    }

    const feeConfig = await getFeeConfig(admin)
    const _feeBreakdown = calculateTotalFee(Number(pkg.price), pilgrimCount, feeChannel, feeConfig)

    const totalPrice = Number(pkg.price) * pilgrimCount

    let dpAmount: number
    let remainingAmount: number
    let remainingDueDate: string | null = null
    let minDpAmount = 0

    if (isInstallment) {
      // Batas minimum uang muka mengikuti opsi cicilan paket (fallback 10%)
      let minPct = Math.max(10, Math.min(90, dpPercentage || 10))
      if (installmentOptionId) {
        const { data: option } = await admin
          .from("package_installment_options")
          .select("min_down_payment_percent")
          .eq("id", installmentOptionId)
          .maybeSingle()
        const optMin = Number(option?.min_down_payment_percent || 0)
        if (optMin > 0) minPct = Math.max(10, Math.min(90, optMin))
      }
      minDpAmount = Math.ceil((totalPrice * minPct) / 100)

      const requested = requestedDpAmount ?? Math.round((totalPrice * minPct) / 100)
      if (requested < minDpAmount) {
        return NextResponse.json(
          { error: `Uang muka minimal ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(minDpAmount)}` },
          { status: 400 },
        )
      }
      if (requested >= totalPrice) {
        return NextResponse.json({ error: "Uang muka harus lebih kecil dari total biaya. Gunakan Bayar Penuh." }, { status: 400 })
      }

      dpAmount = Math.round(requested)
      remainingAmount = totalPrice - dpAmount
      remainingDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      dpAmount = totalPrice
      remainingAmount = 0
    }

    const payNow = dpAmount

    let destinationBank: BankSnapshot | null = null
    if (paymentMethod === "transfer") {
      if (!bankId) {
        return NextResponse.json({ error: "Pilih rekening bank tujuan transfer" }, { status: 400 })
      }
      const { data: bank } = await admin
        .from("banks")
        .select("id, bank_code, bank_name, account_number, account_holder_name")
        .eq("id", bankId)
        .eq("tenant_id", pkg.tenant_id)
        .eq("is_active", true)
        .maybeSingle()
      if (!bank) {
        return NextResponse.json({ error: "Rekening tujuan tidak tersedia untuk travel ini" }, { status: 400 })
      }
      destinationBank = bank as BankSnapshot
    }

    // 2. Insert booking
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

    const bookingPayload: Record<string, unknown> = {
      package_id: packageId,
      package_departure_id: packageDepartureId,
      tenant_id: pkg.tenant_id,
      customer_id: user.id,
      agent_id: agentId,
      referral_code: referralCode || null,
      status: "pending_payment" as const,
      booking_channel: toBookingChannel(feeChannel),
      pilgrim_count: pilgrimCount,
      price: pkg.price,
      total: totalPrice,
      payment_scheme: isInstallment ? "installment" : "full_payment",
      installment_option_id: installmentOptionId || null,
      down_payment_amount: isInstallment ? dpAmount : 0,
      remaining_amount: isInstallment ? remainingAmount : 0,
      remaining_due_date: remainingDueDate,
      cashback_amount: Number(pkg.cashback_amount || 0),
      notes: notes || null,
    }

    let bookingInsert = await admin
      .from("bookings")
      .insert(bookingPayload)
      .select("id, booking_code")
      .single()
    let booking = bookingInsert.data
    let insertErr = bookingInsert.error

    for (let attempt = 0; insertErr && attempt < 8; attempt++) {
      const missingColumn = getMissingColumn(insertErr)
      if (!missingColumn || !(missingColumn in bookingPayload)) break
      console.warn(`[booking/create] Kolom bookings.${missingColumn} tidak ada di DB, retry tanpa kolom tersebut`)
      delete bookingPayload[missingColumn]
      bookingInsert = await admin
        .from("bookings")
        .insert(bookingPayload)
        .select("id, booking_code")
        .single()
      booking = bookingInsert.data
      insertErr = bookingInsert.error
    }

    // Self-healing jika sequence booking_code bentrok dengan data lama
    if (insertErr && insertErr.code === "23505" && insertErr.message?.includes("bookings_booking_code_key")) {
      console.warn("[booking/create] Bentrok booking_code terdeteksi, melakukan sinkronisasi sequence...")
      const { data: maxBookings } = await admin
        .from("bookings")
        .select("booking_code")
        .like("booking_code", "UQ-%")
        .order("booking_code", { ascending: false })
        .limit(1)

      const highestCode = maxBookings?.[0]?.booking_code
      if (highestCode) {
        const lastDigits = parseInt(highestCode.slice(-4), 10)
        if (!isNaN(lastDigits)) {
          const now = new Date()
          const ym = now.toISOString().slice(2, 4) + (now.getMonth() + 1).toString().padStart(2, "0")
          await admin
            .from("monthly_sequences")
            .upsert({ prefix: "UQ", year_month: ym, last_val: lastDigits }, { onConflict: "prefix,year_month" })

          // Coba insert kembali setelah sequence dimajukan
          const retry = await admin
            .from("bookings")
            .insert(bookingPayload)
            .select("id, booking_code")
            .single()

          booking = retry.data
          insertErr = retry.error
        }
      }
    }

    if (insertErr || !booking) {
      // Race: dua request lolos cek di atas — kembalikan booking yang sudah ada
      if (insertErr?.code === "23505") {
        let racedQuery = admin
          .from("bookings")
          .select("id, status, total, down_payment_amount, remaining_amount, payment_scheme")
          .eq("customer_id", user.id)
          .eq("package_id", packageId)
          .eq("status", "pending_payment")
        racedQuery = packageDepartureId
          ? racedQuery.eq("package_departure_id", packageDepartureId)
          : racedQuery.is("package_departure_id", null)
        const { data: raced } = await racedQuery.maybeSingle()
        if (raced?.id) {
          const { data: racedPayment } = await admin
            .from("payments")
            .select("id, amount, payment_channel, proof_url, destination_bank_id, bank:banks(id, bank_code, bank_name, account_number, account_holder_name)")
            .eq("booking_id", raced.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          return NextResponse.json({
            success: true,
            booking_id: raced.id,
            payment_type: raced.payment_scheme === "full_payment" ? "full" : "installment",
            dp_amount: raced.down_payment_amount || 0,
            remaining: raced.remaining_amount || 0,
            total: raced.total || 0,
            payment: racedPayment || null,
            snap: null,
            is_duplicate: true,
          })
        }
      }
      console.error("Booking insert error:", insertErr)
      return NextResponse.json({ error: "Gagal membuat booking" }, { status: 500 })
    }

    // 2b. Seed langkah progres tracking (gagal sekalipun tidak menggagalkan booking)
    try {
      const { TRACKING_STEP_DEFS } = await import("@/lib/tracking-steps")
      await admin.from("booking_progress_steps").upsert(
        TRACKING_STEP_DEFS.map((s) => ({
          booking_id: booking.id,
          step_key: s.key,
          label: s.label,
          sort_order: s.sort_order,
          status: s.key === "payment" ? "in_progress" : "pending",
        })),
        { onConflict: "booking_id,step_key" },
      )
    } catch (seedErr) {
      console.warn("[booking/create] Gagal seed booking_progress_steps:", seedErr)
    }

    // 3. Insert participants
    if (pilgrims && pilgrims.length > 0) {
      const participantRecords: Record<string, unknown>[] = pilgrims.map((p) => ({
        booking_id: booking.id,
        full_name: p.full_name,
        national_id: p.national_id || null,
        passport_number: p.passport_number || null,
        gender: p.gender || null,
        phone: p.phone || null,
        relation: p.relation || "self",
        payment_scheme: isInstallment ? "installment" : "full_payment",
        installment_option_id: installmentOptionId || null,
        package_price: Number(pkg.price),
        down_payment_amount: isInstallment ? Math.round(dpAmount / pilgrimCount) : Number(pkg.price),
        tenor_months: isInstallment ? tenorMonths || 24 : 0,
      }))

      let participantErr: { code?: string; message?: string } | null = null
      for (let attempt = 0; attempt < 8; attempt++) {
        const result = await admin.from("participants").insert(participantRecords)
        participantErr = result.error
        if (!participantErr) break
        const missingColumn = getMissingColumn(participantErr)
        if (!missingColumn || !(missingColumn in participantRecords[0])) break
        console.warn(`[booking/create] Kolom participants.${missingColumn} tidak ada di DB, retry tanpa kolom tersebut`)
        participantRecords.forEach((record) => delete record[missingColumn])
      }
      if (participantErr) console.error("Participant insert error:", participantErr)
    }

    // 4. Generate invoices & payment schedules
    if (isInstallment) {
      const { buildInstallmentInvoicesAndSchedules } = await import("@/lib/business-logic/installment")
      const { invoicesToInsert } = buildInstallmentInvoicesAndSchedules({
        bookingId: booking.id,
        bookingCode: booking.booking_code || booking.id.slice(0, 8).toUpperCase(),
        tenantId: pkg.tenant_id,
        customerId: user.id,
        totalPrice,
        downPaymentAmount: dpAmount,
        remainingAmount,
        tenorMonths: tenorMonths || 24,
      })

      const { data: insertedInvoices, error: invErr } = await admin
        .from("invoices")
        .insert(invoicesToInsert)
        .select("id, invoice_number, installment_number, due_date, amount")

      if (invErr) {
        console.error("Invoice insert error:", invErr)
      } else if (insertedInvoices && insertedInvoices.length > 0) {
        // Insert payment_schedules untuk cicilan 1..N
        const schedulesToInsert = insertedInvoices
          .filter((inv) => inv.installment_number > 0)
          .map((inv) => ({
            invoice_id: inv.id,
            booking_id: booking.id,
            tenant_id: pkg.tenant_id,
            installment_number: inv.installment_number,
            schedule_name: `Cicilan Bulan ke-${inv.installment_number}`,
            due_date: inv.due_date,
            amount: inv.amount,
            paid_amount: 0,
            status: "pending",
          }))

        if (schedulesToInsert.length > 0) {
          const { error: schedErr } = await admin.from("payment_schedules").insert(schedulesToInsert)
          if (schedErr) {
            console.error("Payment schedules insert error:", schedErr)
          }
        }
      }
    } else {
      // Full payment: 1 invoice
      await admin.from("invoices").insert({
        invoice_number: `INV-${booking.booking_code || booking.id.slice(0, 8).toUpperCase()}`,
        booking_id: booking.id,
        tenant_id: pkg.tenant_id,
        customer_id: user.id,
        amount: totalPrice,
        status: "unpaid",
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        installment_number: 0,
        invoice_type: "full",
      })
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
        body: `Booking #${bookingCode} — ${pkg.name} (${pilgrimCount} jemaah). Mohon selesaikan pembayaran sesuai nominal DP.`,
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
          body: "Selesaikan informasi data jemaah (paspor, tempat lahir, kontak darurat, alamat) agar pengajuan visa dan pemberangkatan lebih lancar.",
          templateKey: "data_diri_incomplete",
          linkUrl: "/dashboard/data-diri",
          payload: { booking_id: booking.id },
        })
      }
    } catch (notifErr) {
      console.error("[notify booking create]", notifErr)
    }

    // 6. Catat tagihan pembayaran manual (transfer bank / tunai)
    const paymentDescription = paymentMethod === "cash"
      ? "Pembayaran tunai di kantor travel — menunggu konfirmasi travel"
      : `Transfer ke ${destinationBank?.bank_name} ${destinationBank?.account_number} — menunggu bukti transfer`

    const { error: payErr } = await admin.from("payments").insert({
      booking_id: booking.id,
      tenant_id: pkg.tenant_id,
      status: "pending",
      amount: payNow,
      currency: "IDR",
      payment_channel: paymentMethod === "cash" ? "cash" : "bank_transfer",
      description: paymentDescription,
      destination_bank_id: destinationBank?.id ?? null,
      installment_sequence: 0,
    })

    if (payErr) {
      console.error("Payment insert error:", payErr)
      return NextResponse.json({ error: "Gagal membuat tagihan pembayaran" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      payment_type: isInstallment ? "installment" : "full",
      dp_amount: dpAmount,
      remaining: remainingAmount,
      total: payNow,
      payment: {
        amount: payNow,
        method: paymentMethod,
        channel: paymentMethod === "cash" ? "cash" : "bank_transfer",
        bank: destinationBank,
      },
      snap: null,
    })
  } catch (err) {
    console.error("Create booking error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
