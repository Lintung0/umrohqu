import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const registerTravelSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  travel_name: z.string().min(3, "Nama travel minimal 3 karakter"),
  travel_phone: z.string().optional(),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerTravelSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Data tidak valid"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, email, password, travel_name, travel_phone } = parsed.data
    const lowerEmail = email.toLowerCase()
    const admin = createAdminClient()

    let slug = slugify(travel_name)
    const { data: existingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existingTenant) {
      slug = slug + "-" + Date.now().toString(36)
    }

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: travel_name,
        slug,
        contact_email: lowerEmail,
        contact_phone: travel_phone || null,
        status: "pending",
      })
      .select("id")
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Gagal membuat travel: " + (tenantError?.message || "unknown") }, { status: 500 })
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: lowerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: "travel_admin",
        tenant_id: tenant.id,
      },
    })

    if (authError) {
      await admin.from("tenants").update({ deleted_at: new Date().toISOString() }).eq("id", tenant.id)
      const msg = authError.message.toLowerCase()
      if (msg.includes("already") || msg.includes("duplicate")) {
        return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authData?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 })
    }

    const { error: insertError } = await admin.from("users").upsert({
      id: userId,
      email: lowerEmail,
      full_name: name,
      role: "travel_admin",
      tenant_id: tenant.id,
    }, { onConflict: "id", ignoreDuplicates: true })

    if (insertError) {
      console.error("Users upsert error:", insertError)
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran travel berhasil! Silakan login. Tenant Anda sedang menunggu verifikasi admin.",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
