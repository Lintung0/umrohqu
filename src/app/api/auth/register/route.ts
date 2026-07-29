import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"
import { normalizePhone } from "@/lib/utils/phone"

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  phone: z.string().min(9, "Nomor telepon tidak valid").max(15),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
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

    const { name, phone, email, password } = parsed.data
    const normalizedPhone = normalizePhone(phone)
    const authEmail = email && email.includes("@") ? email : `${normalizedPhone}@phone.umrohq.id`

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

    const { data, error } = await adminAuth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone: normalizedPhone,
      },
    })

    if (error || !data?.user?.id) {
      if (error?.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "Nomor telepon sudah terdaftar." },
          { status: 409 },
        )
      }
      console.error("Admin createUser error:", error)
      return NextResponse.json(
        { error: "Terjadi kesalahan saat pendaftaran." },
        { status: 500 },
      )
    }

    // Also ensure public.users row exists (fallback if trigger fails)
    const { error: insertError } = await adminClient
      .from("users")
      .upsert(
        {
          id: data.user.id,
          email: authEmail,
          full_name: name,
          phone: normalizedPhone,
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
      email: authEmail,
    })
  } catch (err) {
    console.error("Register API error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    )
  }
}
