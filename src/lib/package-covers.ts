import type { Package } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function enrichPackagesWithCovers(
  supabase: SupabaseClient,
  pkgs: Package[] | null | undefined,
): Promise<Package[] | null | undefined> {
  if (!pkgs || pkgs.length === 0) return pkgs
  const ids = pkgs.map((p) => p.id)
  const { data } = await supabase
    .from("package_gallery")
    .select("package_id, image_url, sort_order")
    .in("package_id", ids)
    .order("sort_order", { ascending: true })
  const map = new Map<string, string>()
  data?.forEach((g: { package_id: string; image_url: string; sort_order: number }) => {
    if (g.image_url && !map.has(g.package_id)) map.set(g.package_id, g.image_url)
  })
  return pkgs.map((p) => (map.has(p.id) ? { ...p, image_url: map.get(p.id) } : p))
}

export async function enrichEmbeddedPackageCovers<T extends { package?: Package | Package[] | null }>(
  supabase: SupabaseClient,
  rows: T[] | null | undefined,
): Promise<T[] | null | undefined> {
  if (!rows || rows.length === 0) return rows
  const packages: Package[] = []
  rows.forEach((r) => {
    const p = r.package
    if (Array.isArray(p)) packages.push(...p)
    else if (p) packages.push(p)
  })
  if (packages.length === 0) return rows
  const enriched = await enrichPackagesWithCovers(supabase, packages)
  const map = new Map(enriched!.map((p) => [p.id, p]))
  return rows.map((r) => {
    const p = r.package
    if (Array.isArray(p)) return { ...r, package: p.map((x) => map.get(x.id) || x) }
    if (p && map.has(p.id)) return { ...r, package: map.get(p.id) }
    return r
  })
}