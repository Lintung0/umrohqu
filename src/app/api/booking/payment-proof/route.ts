import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bookingId = String(formData.get("bookingId") || "")
    const senderBank = String(formData.get("senderBank") || "").trim() || null
    const senderAccountName = String(formData.get("senderAccountName") || "").trim() || null
    const senderAccountNumber = String(formData.get("senderAccountNumber") || "").trim() || null
    const transferredAtRaw = String(formData.get("transferredAt") || "").trim()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking tidak valid" }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: "Bukti pembayaran wajib diunggah" }, { status: 400 })
    }
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json({ error: "Format file harus JPG, PNG, WEBP, atau PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: booking } = await admin
      .from("bookings")
      .select("id, customer_id")
      .eq("id", bookingId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!booking || booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const { data: payment } = await admin
      .from("payments")
      .select("id, status")
      .eq("booking_id", bookingId)
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!payment) {
      return NextResponse.json({ error: "Tidak ada tagihan yang menunggu pembayaran" }, { status: 404 })
    }

    const extension = ALLOWED_TYPES[file.type]
    const safeName = String(file.name || "bukti")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40)
    const path = `${bookingId}/${Date.now()}-${safeName || "bukti"}.${extension}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from("payment-proofs")
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: "Gagal mengunggah bukti: " + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from("payment-proofs").getPublicUrl(path)

    const transferredAt = transferredAtRaw && !Number.isNaN(Date.parse(transferredAtRaw))
      ? new Date(transferredAtRaw).toISOString()
      : new Date().toISOString()

    const { error: updateError } = await admin
      .from("payments")
      .update({
        proof_url: urlData.publicUrl,
        sender_bank: senderBank,
        sender_account_name: senderAccountName,
        sender_account_number: senderAccountNumber,
        transferred_at: transferredAt,
        description: "Menunggu verifikasi pembayaran",
      })
      .eq("id", payment.id)

    if (updateError) {
      return NextResponse.json({ error: "Gagal menyimpan bukti pembayaran" }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch (err) {
    console.error("Payment proof upload error:", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
