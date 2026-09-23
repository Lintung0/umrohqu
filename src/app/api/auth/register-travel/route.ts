import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const registerTravelSchema = z.object({
  // Step 1: Profil Publik
  travel_name: z.string().min(3, "Nama travel minimal 3 karakter"),
  slug: z.string().min(3, "Subdomain minimal 3 karakter"),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  city: z.string().optional(),
  travel_phone: z.string().optional(),
  founded_year: z.string().regex(/^(19|20)\d{2}$/, "Tahun beroperasi tidak valid"),
  quota: z.string().regex(/^\d+$/, "Kuota tersedia harus berupa angka").refine((v) => Number(v) > 0, "Kuota tersedia minimal 1 kursi"),

  // Step 2: Legalitas
  ppiu_number: z.string().min(1, "Nomor Izin PPIU wajib diisi"),
  sk_ppiu_doc_url: z.string().url("File SK PPIU wajib diupload"),
  nib: z.string().min(1, "NIB wajib diisi"),
  nib_doc_url: z.string().url("File Dokumen NIB wajib diupload"),
  npwp: z.string().optional(),
  akreditasi_ppiu: z.string().optional(),

  // Step 3: Akun Admin
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  admin_phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirm_password: z.string(),

  // Step 4: Alamat
  full_address: z.string().min(10, "Alamat lengkap wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  postal_code: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Kata sandi tidak cocok",
  path: ["confirm_password"],
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

    const {
      travel_name, slug: rawSlug, description, logo_url, city, travel_phone, founded_year, quota,
      name, email, admin_phone, password,
      full_address, province, postal_code,
    } = parsed.data

    const lowerEmail = email.toLowerCase()
    const admin = createAdminClient()

    // Ensure slug uniqueness
    let slug = rawSlug || slugify(travel_name)
    const { data: existingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existingTenant) {
      slug = slug + "-" + Date.now().toString(36)
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: travel_name,
        slug,
        description: description || null,
        logo_url: logo_url || null,
        founded_year: founded_year || null,
        quota: parseInt(quota, 10) || null,
        status: "pending",
      })
      .select("id")
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Gagal membuat travel: " + (tenantError?.message || "unknown") },
        { status: 500 }
      )
    }

    // Store contact info (email, phone, address) — separate table
    const { error: contactError } = await admin.from("contacts").insert({
      tenant_id: tenant.id,
      email: lowerEmail,
      phone: travel_phone || null,
      street_address: full_address || null,
      city: city || null,
      province: province || null,
      postal_code: postal_code || null,
      is_primary: true,
    })

    if (contactError) {
      await admin.from("tenants").update({ deleted_at: new Date().toISOString() }).eq("id", tenant.id)
      return NextResponse.json(
        { error: "Gagal menyimpan kontak travel: " + contactError.message },
        { status: 500 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: lowerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: "travel_admin",
        tenant_id: tenant.id,
        phone: admin_phone,
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

    // Create users row
    const { error: insertError } = await admin.from("users").upsert({
      id: userId,
      email: lowerEmail,
      full_name: name,
      role: "travel_admin",
      tenant_id: tenant.id,
      phone: admin_phone || null,
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
