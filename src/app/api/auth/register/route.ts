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
    const adminClient = createAdminClient()
    const adminAuth = adminClient.auth as unknown as {
      admin: {
        createUser: (opts: {
          email: string
          password: string
          email_confirm: boolean
          user_metadata: Record<string, string>
        }) => Promise<{
          data: { user: { id: string } } | null
          error: { message: string } | null
        }>
      }
    }

    // Cek apakah email sudah ada di auth.users
    const { data: users } = await adminClient.auth.admin.listUsers()
    const existingUser = users.users.find((u) => u.email === email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 },
      )
    }

    const { data, error } = await adminAuth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    })

    if (error || !data?.user?.id) {
      console.error("Admin createUser error:", error)
      return NextResponse.json(
        { error: error?.message || "Terjadi kesalahan saat pendaftaran." },
        { status: 500 },
      )
    }

    // Ensure public.users row exists (trigger handles this, but fallback)
    const { error: insertError } = await adminClient
      .from("users")
      .upsert(
        {
          id: data.user.id,
          email: email.toLowerCase(),
          full_name: name,
          role: "customer",
        },
        { onConflict: "id", ignoreDuplicates: true },
      )

    if (insertError) {
      console.error("Users upsert error:", insertError)
    }

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      email,
    })
  } catch (err) {
    console.error("Register API error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    )
  }
}