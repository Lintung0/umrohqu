import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const STAFF_ROLES = ["travel_admin", "travel_operational", "travel_finance"]

const createSchema = z.object({
  bank_code: z.string().trim().min(1).max(20),
  bank_name: z.string().trim().min(1).max(120),
  account_number: z.string().trim().min(3).max(60),
  account_holder_name: z.string().trim().min(1).max(160),
  is_primary: z.boolean().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
  is_primary: z.boolean().optional(),
})

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.tenant_id || !STAFF_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 }) }
  }

  return { tenantId: profile.tenant_id as string, admin: createAdminClient() }
}

export async function GET() {
  try {
    const auth = await requireStaff()
    if ("error" in auth) return auth.error

    const { data, error } = await auth.admin
      .from("banks")
      .select("id, bank_code, bank_name, account_number, account_holder_name, is_active, is_primary, created_at")
      .eq("tenant_id", auth.tenantId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Gagal memuat rekening" }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error("List banks error:", err)
    return NextResponse.json({ error: "Gagal memuat rekening" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaff()
    if ("error" in auth) return auth.error

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { count } = await auth.admin
      .from("banks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", auth.tenantId)

    const makePrimary = parsed.data.is_primary || !count

    const { data: bank, error } = await auth.admin
      .from("banks")
      .insert({
        tenant_id: auth.tenantId,
        bank_code: parsed.data.bank_code,
        bank_name: parsed.data.bank_name,
        account_number: parsed.data.account_number,
        account_holder_name: parsed.data.account_holder_name,
        is_primary: makePrimary,
        is_active: true,
      })
      .select("id, bank_code, bank_name, account_number, account_holder_name, is_active, is_primary, created_at")
      .single()

    if (error || !bank) {
      return NextResponse.json({ error: "Gagal menyimpan rekening: " + (error?.message || "unknown") }, { status: 500 })
    }

    if (makePrimary) {
      await auth.admin
        .from("banks")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("tenant_id", auth.tenantId)
        .neq("id", bank.id)
    }

    return NextResponse.json({ data: bank })
  } catch (err) {
    console.error("Create bank error:", err)
    return NextResponse.json({ error: "Gagal menyimpan rekening" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireStaff()
    if ("error" in auth) return auth.error

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 })
    }

    const { id, ...updates } = parsed.data

    const { data: existing } = await auth.admin
      .from("banks")
      .select("id, tenant_id")
      .eq("id", id)
      .eq("tenant_id", auth.tenantId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: "Rekening tidak ditemukan" }, { status: 404 })
    }

    const { error } = await auth.admin
      .from("banks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Gagal memperbarui rekening" }, { status: 500 })
    }

    if (updates.is_primary) {
      await auth.admin
        .from("banks")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("tenant_id", auth.tenantId)
        .neq("id", id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Update bank error:", err)
    return NextResponse.json({ error: "Gagal memperbarui rekening" }, { status: 500 })
  }
}
