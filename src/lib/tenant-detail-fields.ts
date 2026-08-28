import type { Tenant } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

export type TravelTenant = Tenant & {
  city?: string
  phone?: string
  contact_email?: string
  ppiu_number?: string
  accredited_at?: string
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

  const [{ data: contacts }, { data: legals }] = await Promise.all([
    supabase
      .from("tenant_contacts")
      .select("tenant_id, email, phone, city")
      .in("tenant_id", ids),
    supabase
      .from("tenant_legals")
      .select("tenant_id, ppiu_number, accredited_at")
      .in("tenant_id", ids),
  ])

  const contactMap = new Map<string, { email?: string; phone?: string; city?: string }>()
  ;(contacts ?? []).forEach((c: { tenant_id: string; email?: string; phone?: string; city?: string }) => {
    const cur = contactMap.get(c.tenant_id) ?? {}
    if (c.email) cur.email = c.email
    if (c.phone) cur.phone = c.phone
    if (c.city) cur.city = c.city
    contactMap.set(c.tenant_id, cur)
  })

  const legalMap = new Map<string, { ppiu_number?: string; accredited_at?: string }>()
  ;(legals ?? []).forEach((l: { tenant_id: string; ppiu_number?: string; accredited_at?: string }) => {
    const cur = legalMap.get(l.tenant_id) ?? {}
    if (l.ppiu_number) cur.ppiu_number = l.ppiu_number
    if (l.accredited_at) cur.accredited_at = l.accredited_at
    legalMap.set(l.tenant_id, cur)
  })

  return tenants.map((t) => {
    if (!t) return t
    const next = { ...t } as any
    const contact = contactMap.get(t.id)
    if (contact?.email) next.contact_email = contact.email
    if (contact?.phone) next.phone = contact.phone
    if (contact?.city) next.city = contact.city
    const legal = legalMap.get(t.id)
    if (legal?.ppiu_number) next.ppiu_number = legal.ppiu_number
    if (legal?.accredited_at) next.accredited_at = legal.accredited_at
    return next as TravelTenant
  })
}
