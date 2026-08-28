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
    .select("package_id, image_url, sort_order, media_type")
    .in("package_id", ids)
    .order("sort_order", { ascending: true })
  const coverMap = new Map<string, string>()
  const videoMap = new Map<string, string>()
  const imagesMap = new Map<string, string[]>()
  data?.forEach((g: { package_id: string; image_url: string; sort_order: number; media_type?: string }) => {
    if (!g.image_url) return
    if (!imagesMap.has(g.package_id)) imagesMap.set(g.package_id, [])
    imagesMap.get(g.package_id)!.push(g.image_url)
    if (g.media_type === "video") {
      if (!videoMap.has(g.package_id)) videoMap.set(g.package_id, g.image_url)
    } else if (!coverMap.has(g.package_id)) {
      coverMap.set(g.package_id, g.image_url)
    }
  })
  return pkgs.map((p) => {
    const next = { ...p } as any
    if (imagesMap.has(p.id)) next.images = imagesMap.get(p.id)
    if (coverMap.has(p.id)) next.image_url = coverMap.get(p.id)
    if (videoMap.has(p.id)) {
      next.video_url = videoMap.get(p.id)
      next.image_url = next.image_url || videoMap.get(p.id)
    }
    return next as Package
  })
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