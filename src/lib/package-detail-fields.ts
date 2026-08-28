import type { Package } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"
import { enrichPackagesWithCovers } from "@/lib/package-covers"

export async function enrichPackagesWithDetail(
  supabase: SupabaseClient,
  pkgs: Package[] | null | undefined,
): Promise<Package[] | null | undefined> {
  if (!pkgs || pkgs.length === 0) return pkgs
  const ids = pkgs.map((p) => p.id)

  const [{ data: flights }, { data: hotels }, { data: combos }] = await Promise.all([
    supabase
      .from("package_flights")
      .select("package_id, airline_name, departure_city")
      .in("package_id", ids),
    supabase
      .from("package_hotels")
      .select("package_id, hotel_id, hotels(name, city, rating)")
      .in("package_id", ids),
    supabase
      .from("package_combinations")
      .select("package_id, price, final_price, discount")
      .in("package_id", ids),
  ])

  const airlineMap = new Map<string, string>()
  const departureCities = new Map<string, string[]>()
  ;(flights ?? []).forEach((f: { package_id: string; airline_name?: string; departure_city?: string }) => {
    if (f.airline_name && !airlineMap.has(f.package_id)) airlineMap.set(f.package_id, f.airline_name)
    if (f.departure_city) {
      const arr = departureCities.get(f.package_id) ?? []
      if (!arr.includes(f.departure_city)) arr.push(f.departure_city)
      departureCities.set(f.package_id, arr)
    }
  })

  const hotelMap = new Map<
    string,
    { makkah?: { name: string; stars: number }; madinah?: { name: string; stars: number } }
  >()
  ;(hotels ?? []).forEach((h: { package_id: string; hotels?: unknown }) => {
    const raw = h.hotels
    const list: { name?: string; city?: string; rating?: number }[] = Array.isArray(raw)
      ? (raw as { name?: string; city?: string; rating?: number }[])
      : raw
        ? [raw as { name?: string; city?: string; rating?: number }]
        : []
    list.forEach((hotel) => {
      if (!hotel?.name) return
      const current = hotelMap.get(h.package_id) ?? {}
      if (hotel.city === "Makkah") current.makkah = { name: hotel.name, stars: hotel.rating ?? 0 }
      else if (hotel.city === "Madinah") current.madinah = { name: hotel.name, stars: hotel.rating ?? 0 }
      hotelMap.set(h.package_id, current)
    })
  })

  const priceMap = new Map<string, { original?: number; min?: number }>()
  ;(combos ?? []).forEach(
    (c: { package_id: string; price?: number | string; final_price?: number | string; discount?: number | string }) => {
      const original = Number(c.price ?? 0)
      const cur = priceMap.get(c.package_id) ?? {}
      cur.original = Math.max(cur.original ?? 0, original)
      priceMap.set(c.package_id, cur)
    },
  )

  const enriched = await enrichPackagesWithCovers(supabase, pkgs)
  return pkgs.map((p) => {
    if (!p) return p
    const next = { ...p } as any
    if (airlineMap.has(p.id)) next.airline = airlineMap.get(p.id)
    const cities = departureCities.get(p.id)
    if (cities && cities.length > 0) next.departure_cities = cities
    const hotelsFor = hotelMap.get(p.id)
    if (hotelsFor?.makkah) {
      next.hotel_makkah = hotelsFor.makkah.name
      next.hotel_makkah_stars = hotelsFor.makkah.stars
    }
    if (hotelsFor?.madinah) {
      next.hotel_madinah = hotelsFor.madinah.name
      next.hotel_madinah_stars = hotelsFor.madinah.stars
    }
    const pricing = priceMap.get(p.id)
    if (pricing?.original) next.original_price = pricing.original
    return next as Package
  })
}
