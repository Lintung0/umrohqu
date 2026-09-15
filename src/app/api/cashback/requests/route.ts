import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mine = searchParams.get("mine") === "1"
    const admin = createAdminClient()

    if (!mine) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (!userData || !["admin", "finance"].includes(userData.role as string)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const { data, error } = await admin
        .from("cashbacks")
        .select(
          "*, jamaah:users(full_name, email), booking:bookings(id, package:packages(name, slug))"
        )
        .order("created_at", { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data })
    }

    const { data: bookings, error: bookingErr } = await admin
      .from("bookings")
      .select("id, status, created_at, cashback_amount, package:packages(name, slug)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (bookingErr) {
      return NextResponse.json({ error: bookingErr.message }, { status: 500 })
    }

    const { data: claims, error: claimErr } = await admin
      .from("cashbacks")
      .select("*, booking:bookings(id, package:packages(name, slug))")
      .eq("jamaah_id", user.id)
      .order("created_at", { ascending: false })

    if (claimErr) {
      return NextResponse.json({ error: claimErr.message }, { status: 500 })
    }

    const eligible = (bookings || [])
      .map((b: any) => {
        const pkg = Array.isArray(b.package) ? b.package[0] : b.package
        const cashbackAmount = Number(b.cashback_amount || 0)
        return {
          id: b.id,
          package_name: pkg?.name || "Paket",
          package_slug: pkg?.slug || "",
          cashback_amount: cashbackAmount,
          status: b.status,
          created_at: b.created_at,
        }
      })
      .filter((b) => b.cashback_amount > 0)

    const claimMap: Record<string, any> = {}
    for (const c of claims || []) {
      claimMap[c.booking_id as string] = {
        id: c.id,
        amount: c.amount,
        status: c.status,
        bank_code: c.bank_code,
        account_number: c.account_number,
        account_holder_name: c.account_holder_name,
        failure_reason: c.failure_reason,
        claimed_at: c.claimed_at,
        disbursed_at: c.disbursed_at,
        iris_reference_no: c.iris_reference_no,
      }
    }

    const rows = eligible.map((b) => ({ ...b, claim: claimMap[b.id] || null }))

    const totals = {
      pending: (claims || []).filter((c) => c.status === "pending").length,
      approved: (claims || []).filter((c) => c.status === "approved").length,
      paid: (claims || []).filter((c) => c.status === "paid").length,
      rejected: (claims || []).filter((c) => c.status === "rejected").length,
    }

    return NextResponse.json({ data: rows, totals })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}