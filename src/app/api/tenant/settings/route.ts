import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  custom_domain: z.string().max(255).nullable().optional(),
  config: z.record(z.unknown()).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 })
    }

    const { tenantId, ...updates } = parsed.data

    // Verify user belongs to this tenant
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id || profile.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    if (!["travel_admin", "travel_operational", "travel_finance"].includes(profile.role)) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()
    const { error } = await admin
      .from("tenants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", tenantId)

    if (error) {
      return NextResponse.json({ error: "Gagal menyimpan: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Update tenant settings error:", err)
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
