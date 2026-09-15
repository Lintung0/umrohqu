import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notify/create-notification"
import { z } from "zod"

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "disburse"]),
  note: z.string().max(500).optional().default(""),
})

function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!userData || !["admin", "finance"].includes(userData.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 })
    }

    const { id, action, note } = parsed.data
    const admin = createAdminClient()

    const { data: claim } = await admin
      .from("cashbacks")
      .select("id, jamaah_id, amount, status, account_number, account_holder_name")
      .eq("id", id)
      .single()

    if (!claim) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    const now = new Date().toISOString()
    let update: Record<string, unknown> = {}
    let title = ""
    let message = ""
    let templateKey = ""

    if (action === "approve") {
      if (claim.status !== "pending") {
        return NextResponse.json({ error: "Pengajuan bukan berstatus pending" }, { status: 400 })
      }
      update = { status: "approved", failure_reason: null }
      title = "Cashback Disetujui"
      message = `Cashback ${formatRupiah(Number(claim.amount))} kamu disetujui dan akan segera dikirim ke rekening terdaftar.`
      templateKey = "cashback_approved"
    } else if (action === "reject") {
      if (claim.status !== "pending") {
        return NextResponse.json({ error: "Pengajuan bukan berstatus pending" }, { status: 400 })
      }
      update = { status: "rejected", failure_reason: note || "Ditangguhkan oleh admin" }
      title = "Pengajuan Cashback Ditolak"
      message = `Pengajuan cashback ${formatRupiah(Number(claim.amount))} kamu ditolak. ${note ? `Alasan: ${note}` : "Hubungi admin jika ini keliru."}`
      templateKey = "cashback_rejected"
    } else {
      if (claim.status !== "approved") {
        return NextResponse.json({ error: "Cashback harus disetujui terlebih dahulu" }, { status: 400 })
      }
      update = {
        status: "paid",
        iris_reference_no: `IRIS-${Date.now().toString().slice(-10)}`,
        iris_payout_status: "completed",
        disbursed_at: now,
      }
      const last4 = claim.account_number?.slice(-4) || "****"
      title = "Cashback Dicairkan"
      message = `Cashback ${formatRupiah(Number(claim.amount))} sudah dikirim ke rekening ****${last4} atas nama ${claim.account_holder_name || "-"}.`
      templateKey = "cashback_paid"
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Tidak ada aksi" }, { status: 400 })
    }

    const { error } = await admin.from("cashbacks").update(update).eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createNotification({
      userId: claim.jamaah_id as string,
      title,
      body: message,
      templateKey,
      linkUrl: "/dashboard/cashback",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}