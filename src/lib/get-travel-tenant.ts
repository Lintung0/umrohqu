import { SupabaseClient } from "@supabase/supabase-js"

export async function getTravelTenantId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .single()

  if (profile?.tenant_id) {
    return profile.tenant_id
  }

  // Fallback 1: check if any tenant exists in the system
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id")
    .is("deleted_at", null)
    .limit(1)

  if (tenants && tenants.length > 0) {
    const tenantId = tenants[0].id
    await supabase.from("users").update({ tenant_id: tenantId }).eq("id", userId)
    return tenantId
  }

  // Fallback 2: create a default tenant for this user
  const { data: newTenant, error: tErr } = await supabase
    .from("tenants")
    .insert({
      name: "Travel Mandiri",
      slug: `travel-${userId.slice(0, 8)}`,
      status: "active"
    })
    .select("id")
    .single()

  if (!tErr && newTenant?.id) {
    await supabase.from("users").update({ tenant_id: newTenant.id }).eq("id", userId)
    return newTenant.id
  }

  return null
}
