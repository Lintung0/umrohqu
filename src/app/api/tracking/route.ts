import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { TRACKING_STEP_DEFS, type TrackingStepKey, type TrackingStepStatus } from "@/lib/tracking-steps"
import { z } from "zod"

const schema = z.object({
  code: z.string().min(3).max(20),
})

type StepKey = TrackingStepKey
type StepStatus = TrackingStepStatus

// Normalisasi input: "1234" / "uq1234" / " UQ-1234 " -> "UQ-1234"
function normalizeCode(raw: string): string {
  let code = raw.trim().toUpperCase().replace(/\s+/g, "")
  if (/^\d+$/.test(code)) code = `UQ-${code}`
  if (/^UQ\d+$/.test(code)) code = `UQ-${code.slice(2)}`
  return code
}

// Status turunan dari data booking (dipakai bila tidak ada override manual)
function deriveStatus(
  stepKey: StepKey,
  bookingStatus: string,
  signals: { hasPaid: boolean; hasPassport: boolean },
): StepStatus {
  const stage =
    bookingStatus === "completed" ? 4
    : bookingStatus === "confirmed" ? 3
    : bookingStatus === "processing" ? 2
    : bookingStatus === "pending_payment" ? 1
    : 2 // cancellation_pending / cancelled / refunded: freeze di tahap proses

  const order: Record<StepKey, number> = {
    payment: 1, participant_data: 2, documents: 3, hotel: 4, flight: 5, manasik: 6, departure: 7,
  }

  // Penanda "selesai" per langkah berdasarkan tahap
  const doneAt: Record<StepKey, number> = {
    payment: 1, participant_data: 2, documents: 3, hotel: 4, flight: 5, manasik: 6, departure: 4,
  }

  if (stepKey === "payment") {
    if (signals.hasPaid) return "completed"
    return bookingStatus === "pending_payment" ? "in_progress" : "pending"
  }
  if (stepKey === "participant_data" && signals.hasPassport) return "completed"
  if (stepKey === "departure") {
    if (bookingStatus === "completed") return "completed"
    if (bookingStatus === "confirmed") return "in_progress"
    return "pending"
  }

  if (stage >= doneAt[stepKey]) return "completed"
  if (stage + 1 === doneAt[stepKey] || stage >= order[stepKey] - 1) return "in_progress"
  return "pending"
}

// Rate limit sederhana per IP (30 req / menit)
const hits = new Map<string, { count: number; resetAt: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count += 1
  return entry.count > 30
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Terlalu banyak permintaan, coba lagi nanti" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = schema.safeParse({ code: searchParams.get("code") || "" })
    if (!parsed.success) {
      return NextResponse.json({ error: "Kode pesanan tidak valid" }, { status: 400 })
    }

    const code = normalizeCode(parsed.data.code)
    const admin = createAdminClient()

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(
        "id, booking_code, status, created_at, package:packages(name, slug), tenant:tenants(name), departure:package_departures(departure_date, departure_city)",
      )
      .eq("booking_code", code)
      .maybeSingle()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Kode pesanan tidak ditemukan" }, { status: 404 })
    }

    const [{ data: participants }, { data: payments }, { data: stepRows }] = await Promise.all([
      admin.from("participants").select("id, passport_number").eq("booking_id", booking.id),
      admin.from("payments").select("id, status").eq("booking_id", booking.id).limit(1),
      admin.from("booking_progress_steps").select("*").eq("booking_id", booking.id).order("sort_order"),
    ])

    const hasPaid =
      (payments || []).some((p) => ["paid", "success", "settled"].includes(p.status)) ||
      booking.status !== "pending_payment"
    const hasPassport = (participants || []).some((p) => !!p.passport_number)

    // Seed langkah bila booking lama belum punya baris (write-once)
    let rows = stepRows || []
    if (rows.length === 0) {
      const seeded = TRACKING_STEP_DEFS.map((s) => ({
        booking_id: booking.id,
        step_key: s.key,
        label: s.label,
        sort_order: s.sort_order,
        status: s.key === "payment" ? "in_progress" : "pending",
      }))
      const { data: inserted } = await admin
        .from("booking_progress_steps")
        .upsert(seeded, { onConflict: "booking_id,step_key" })
        .select("*")
        .order("sort_order")
      rows = inserted || seeded.map((s, i) => ({ ...s, id: `local-${i}` }))
    }

    const steps = rows.map((row) => {
      const derived = deriveStatus(row.step_key as StepKey, booking.status, { hasPaid, hasPassport })
      // Override manual dari travel: 'completed' menempel; selain itu ikut turunan
      const effective: StepStatus = row.status === "completed" ? "completed" : derived
      return {
        key: row.step_key,
        label: row.label,
        status: effective,
        note: row.note || null,
        completed_at: row.completed_at || (effective === "completed" ? null : null),
      }
    })

    const departure = Array.isArray(booking.departure) ? booking.departure[0] : booking.departure
    const pkg = Array.isArray(booking.package) ? booking.package[0] : booking.package
    const tenant = Array.isArray(booking.tenant) ? booking.tenant[0] : booking.tenant

    return NextResponse.json({
      success: true,
      data: {
        booking_code: booking.booking_code,
        status: booking.status,
        created_at: booking.created_at,
        package_name: pkg?.name || null,
        package_slug: pkg?.slug || null,
        travel_name: tenant?.name || null,
        departure_date: departure?.departure_date || null,
        departure_city: departure?.departure_city || null,
        steps,
      },
    })
  } catch (err) {
    console.error("Tracking error:", err)
    return NextResponse.json({ error: "Gagal memuat progres pesanan" }, { status: 500 })
  }
}
