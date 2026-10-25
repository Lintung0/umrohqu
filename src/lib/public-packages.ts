import type { Package, Tenant } from "@/lib/types"

export type PublicPackage = Package & {
  travel?: Tenant | Tenant[] | null
}

interface FetchPublicPackagesOptions {
  slug?: string
  tenantId?: string
  withTravel?: boolean
  includeCompleted?: boolean
  includeUnshared?: boolean
}

export async function fetchPublicPackages(
  options: FetchPublicPackagesOptions = {},
): Promise<PublicPackage[]> {
  const params = new URLSearchParams()
  if (options.slug) params.set("slug", options.slug)
  if (options.tenantId) params.set("tenant_id", options.tenantId)
  if (options.withTravel) params.set("with_travel", "1")
  if (options.includeCompleted) params.set("include_completed", "1")
  if (options.includeUnshared) params.set("include_unshared", "1")

  const query = params.toString()
  const response = await fetch(`/api/public/packages${query ? `?${query}` : ""}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Gagal memuat paket.")
  }

  const payload = (await response.json()) as { packages?: PublicPackage[] }
  return payload.packages ?? []
}
