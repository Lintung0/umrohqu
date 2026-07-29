import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const lowerEmail = email.toLowerCase()

    const { data: users, error } = await adminClient
      .from("users")
      .select("id")
      .eq("email", lowerEmail)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users) {
      return NextResponse.json(
        { exists: false, error: "Akun belum terdaftar. Silakan daftar terlebih dahulu." },
        { status: 404 }
      )
    }

    return NextResponse.json({ exists: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
