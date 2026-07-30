import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { full_name, nik, passport_number, passport_expiry, gender, phone, birth_date, address, is_main } = body

  if (!full_name) return Response.json({ error: "Nama wajib diisi" }, { status: 400 })

  if (is_main) {
    await supabase.from("participants").update({ is_main: false }).eq("user_id", user.id)
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({ user_id: user.id, full_name, nik, passport_number, passport_expiry, gender, phone, birth_date, address, is_main })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, full_name, nik, passport_number, passport_expiry, gender, phone, birth_date, address, is_main } = body

  if (!id) return Response.json({ error: "ID diperlukan" }, { status: 400 })

  if (is_main) {
    await supabase.from("participants").update({ is_main: false }).eq("user_id", user.id)
  }

  const { data, error } = await supabase
    .from("participants")
    .update({ full_name, nik, passport_number, passport_expiry, gender, phone, birth_date, address, is_main, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: "ID diperlukan" }, { status: 400 })

  const { error } = await supabase.from("participants").delete().eq("id", id).eq("user_id", user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
