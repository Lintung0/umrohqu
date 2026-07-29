import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Data tidak valid"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const lowerEmail = email.toLowerCase()
    const adminClient = createAdminClient()

    // Cek apakah email sudah ada di auth.users
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      console.error("listUsers error:", listError)
      return NextResponse.json({ error: "Gagal memeriksa email: " + listError.message }, { status: 500 })
    }
    const existingUser = users.users.find((u) => u.email === lowerEmail)
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 })
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: lowerEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (error || !data?.user?.id) {
      console.error("Admin createUser error:", error)
      return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat pendaftaran." }, { status: 500 })
    }

    // Ensure public.users row exists
    const { error: insertError } = await adminClient.from("users").upsert({
      id: data.user.id,
      email: lowerEmail,
      full_name: name,
      role: "customer",
    }, { onConflict: "id", ignoreDuplicates: true })

    if (insertError) {
      console.error("Users upsert error:", insertError)
    }

    return NextResponse.json({ success: true, userId: data.user.id, email: lowerEmail })
  } catch (err) {
    console.error("Register API error:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}