import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, status, is_verified")
      .eq("id", profile.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ tenant })
  } catch (err) {
    console.error("Setup fee error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Modul setup fee invoice tidak tersedia pada skema baru" },
    { status: 400 },
  )
}
