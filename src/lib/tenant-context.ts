import { createServerClient } from "@supabase/ssr"
import { type NextRequest } from "next/server"

export interface TenantContext {
  tenantId: string
  slug: string
  name: string
  logo_url?: string
  brand_color?: string
  custom_domain?: string
  description?: string
}

export function getTenantFromHeaders(request: NextRequest): TenantContext | null {
  const header = request.headers.get("x-tenant-data")
  if (!header) return null
  try {
    return JSON.parse(header) as TenantContext
  } catch {
    return null
  }
}

export async function setTenantHeaders(
  response: Response,
  tenant: TenantContext
): Promise<Response> {
  const res = new Response(response.body, response)
  res.headers.set("x-tenant-data", JSON.stringify(tenant))
  return res
}

export async function getCurrentTenantId(request: NextRequest): Promise<string | null> {
  return request.headers.get("x-tenant-id") || null
}
