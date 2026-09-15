import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  bookingId: z.string().uuid(),
  bankCode: z.string().min(1).max(16),
  accountNumber: z.string().regex(/^\d{6,20}$/, "Nomor rekening tidak valid"),
  accountHolderName: z.string().min(2).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data rekening tidak valid" }, { status: 400 })
    }

    const { bookingId, bankCode, accountNumber, accountHolderName } = parsed.data
    const admin = createAdminClient()

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, customer_id, cashback_amount")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const cashbackAmount = Number(booking.cashback_amount || 0)
    if (cashbackAmount <= 0) {
      return NextResponse.json({ error: "Paket ini tidak memiliki cashback" }, { status: 400 })
    }

    if (!["confirmed", "completed"].includes(booking.status)) {
      return NextResponse.json({ error: "Cashback hanya bisa diajukan setelah booking dikonfirmasi atau selesai" }, { status: 400 })
    }

    const { data: existing } = await admin
      .from("cashbacks")
      .select("id, status")
      .eq("booking_id", bookingId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Cashback untuk booking ini sudah pernah diajukan" }, { status: 409 })
    }

    const { data, error } = await admin
      .from("cashbacks")
      .insert({
        booking_id: bookingId,
        jamaah_id: user.id,
        amount: cashbackAmount,
        bank_code: bankCode,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        status: "pending",
        claimed_at: new Date().toISOString(),
      })
      .select("id, status, amount")
      .single()

    if (error) {
      return NextResponse.json({ error: "Gagal mengajukan pencairan" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}