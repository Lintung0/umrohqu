import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const CONFIRMED_MSG = "Email belum diverifikasi. Silakan cek email Anda dan klik tautan verifikasi."
const NOT_FOUND_MSG = "Akun belum terdaftar. Silakan daftar terlebih dahulu."

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

    if (users) {
      return NextResponse.json({ exists: true })
    }

    const { data: authUser, error: rpcError } = await adminClient
      .rpc("check_auth_user_exists", { p_email: lowerEmail })

    if (!rpcError && authUser && authUser.length > 0) {
      await adminClient.from("users").upsert({
        id: authUser[0].user_id,
        email: lowerEmail,
        full_name: lowerEmail.split("@")[0],
        role: "customer",
      }, { onConflict: "id", ignoreDuplicates: true })

      if (authUser[0].email_confirmed) {
        return NextResponse.json({ exists: true })
      }
      return NextResponse.json(
        { exists: false, error: CONFIRMED_MSG },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { exists: false, error: NOT_FOUND_MSG },
      { status: 404 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
