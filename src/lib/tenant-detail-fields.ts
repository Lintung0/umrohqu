import type { Tenant } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

export type TravelTenant = Tenant & {
  city?: string
  phone?: string
  contact_email?: string
  total_jamaah?: number
}

export async function enrichTenantsWithDetail(
  supabase: SupabaseClient,
  tenants: (Tenant | null | undefined)[] | null | undefined,
): Promise<(TravelTenant | null | undefined)[]> {
  if (!tenants || tenants.length === 0) return (tenants ?? []) as (TravelTenant | null | undefined)[]
  const valid = tenants.filter((t): t is Tenant => !!t)
  if (valid.length === 0) return tenants as (TravelTenant | null | undefined)[]
  const ids = valid.map((t) => t.id)

  const { data: contacts } = await supabase
    .from("contacts")
    .select("tenant_id, email, phone, city")
    .in("tenant_id", ids)

  const contactMap = new Map<string, { email?: string; phone?: string; city?: string }>()
  ;(contacts ?? []).forEach((c: { tenant_id: string; email?: string; phone?: string; city?: string }) => {
    const cur = contactMap.get(c.tenant_id) ?? {}
    if (c.email) cur.email = c.email
    if (c.phone) cur.phone = c.phone
    if (c.city) cur.city = c.city
    contactMap.set(c.tenant_id, cur)
  })

  return tenants.map((t) => {
    if (!t) return t
    const next = { ...t } as any
    const contact = contactMap.get(t.id)
    if (contact?.email) next.contact_email = contact.email
    if (contact?.phone) next.phone = contact.phone
    if (contact?.city) next.city = contact.city
    return next as TravelTenant
  })
}