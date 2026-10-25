import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    const tenantId = searchParams.get("tenant_id")
    const withTravel = searchParams.get("with_travel") === "1"
    const includeCompleted = searchParams.get("include_completed") === "1"
    const includeUnshared = searchParams.get("include_unshared") === "1"
    const statuses = includeCompleted ? ["active", "ongoing", "completed"] : ["active", "ongoing"]

    if (!tenantId && (includeCompleted || includeUnshared)) {
      return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from("packages")
      .select(withTravel ? "*, travel:tenants(*)" : "*")
      .in("status", statuses)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (!includeUnshared) query = query.eq("is_shared_to_marketplace", true)
    if (tenantId) query = query.eq("tenant_id", tenantId)
    if (slug) query = query.eq("slug", slug).limit(1)

    const { data, error } = await query

    if (error) {
      console.error("[public/packages] query error:", error)
      return NextResponse.json({ error: "Gagal memuat paket." }, { status: 500 })
    }

    return NextResponse.json(
      { packages: data ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[public/packages] error:", error)
    return NextResponse.json({ error: "Gagal memuat paket." }, { status: 500 })
  }
}
