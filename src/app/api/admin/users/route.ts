import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || !["super_admin", "marketplace_admin", "marketplace_finance", "marketplace_operational"].includes(userData.role as string)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")

  let query = supabase
    .from("users")
    .select("*, tenant:tenants(name)", { count: "exact" })

  if (role && role !== "all") query = query.eq("role", role)
  if (search) query = query.or(`full_name.ilike.*${search}*,email.ilike.*${search}*`)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data, count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || !["super_admin", "marketplace_admin"].includes(userData.role as string)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id, role, status } = await req.json()
  if (!id) return Response.json({ error: "ID diperlukan" }, { status: 400 })

  const updateData: any = {}
  if (role) updateData.role = role
  if (status) updateData.status = status

  const { error } = await supabase.from("users").update(updateData).eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
