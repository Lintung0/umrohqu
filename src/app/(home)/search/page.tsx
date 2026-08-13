"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { Search, SearchX, X, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAseanCountryByCode } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import type { Package, Tenant } from "@/lib/types"
import SharedPackageCard from "@/components/shared/package-card"
import SearchSidebar from "@/components/search/search-sidebar"
import { rankTravels, RankingFactors, DEFAULT_RANKING_CONFIG } from "@/lib/business-logic/bidding"

const QUICK_CATEGORIES = [
  { label: "Semua", preset: {} },
  { label: "Bulan Ramadhan", preset: { month: "Ramadhan" } },
  { label: "Promo Terbaik", preset: { cost: "< Rp 25 Juta" } },
  { label: "Umroh Reguler", preset: { type: "reguler" } },
  { label: "Umroh VIP", preset: { type: "vip" } },
  { label: "Haji Furoda", preset: { type: "furoda" } },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [showMobileFilter, setShowMobileFilter] = useState(false)

  const departure = searchParams.get("departure") ?? ""
  const country = searchParams.get("country") ?? ""
  const month = searchParams.get("month") ?? ""
  const cost = searchParams.get("cost") ?? ""
  const type = searchParams.get("type") ?? "semua"
  const airlines = (searchParams.get("airlines") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const hotelStars = searchParams.get("hotelStars") ?? ""
  const duration = searchParams.get("duration") ?? ""
  const sortBy = searchParams.get("sort") ?? "relevance"
  const searchQuery = searchParams.get("search") ?? ""
  const parsedMin = parseInt(searchParams.get("priceMin") ?? "", 10)
  const parsedMax = parseInt(searchParams.get("priceMax") ?? "", 10)
  const priceRange: [number, number] = [
    Number.isFinite(parsedMin) ? parsedMin : 10000000,
    Number.isFinite(parsedMax) ? parsedMax : 500000000,
  ]
  const searchQueryParam = searchQuery

  const [searchInput, setSearchInput] = useState(searchQuery)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "")
  }, [searchParams.get("search")])

  const setUrl = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === undefined) next.delete(key)
        else next.set(key, value)
      }
      const qs = next.toString()
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false })
    },
    [searchParams, router]
  )

  const setDeparture = useCallback((v: string) => setUrl({ departure: v }), [setUrl])
  const setCountry = useCallback((v: string) => setUrl({ country: v }), [setUrl])
  const setMonth = useCallback((v: string) => setUrl({ month: v }), [setUrl])
  const setCost = useCallback((v: string) => setUrl({ cost: v === "Semua Biaya" ? null : v }), [setUrl])
  const setType = useCallback((v: string) => setUrl({ type: v === "semua" ? null : v }), [setUrl])
  const setAirlines = useCallback((v: string[]) => setUrl({ airlines: v.length ? v.join(",") : null }), [setUrl])
  const setHotelStars = useCallback((v: string) => setUrl({ hotelStars: v }), [setUrl])
  const setDuration = useCallback((v: string) => setUrl({ duration: v }), [setUrl])
  const setPriceRange = useCallback(
    (range: [number, number]) => {
      setUrl({
        priceMin: range[0] === 10000000 ? null : String(range[0]),
        priceMax: range[1] === 500000000 ? null : String(range[1]),
      })
    },
    [setUrl]
  )
  const setSortBy = useCallback((v: string) => setUrl({ sort: v === "relevance" ? null : v }), [setUrl])

  const handleSearchInput = (v: string) => {
    setSearchInput(v)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setUrl({ search: v.trim() || null })
    }, 500)
  }

  const handleSearchSubmit = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setUrl({ search: searchInput.trim() || null })
  }

  const [packages, setPackages] = useState<Package[]>([])
  const [tenants, setTenants] = useState<Map<string, Tenant>>(new Map())
  const [rankingScores, setRankingScores] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      try {
        let query = supabase
          .from("packages")
          .select("*")
          .eq("status", "published")
          .eq("is_active", true)
          .is("deleted_at", null)

        if (searchQueryParam) {
          query = query.or(`name.ilike.%${searchQueryParam}%,description.ilike.%${searchQueryParam}%,departure_city.ilike.%${searchQueryParam}%,slug.ilike.%${searchQueryParam}%`)
        }

        const { data: pkgs, error: pkgError } = await query
        if (pkgError) {
          console.error("Error fetching packages:", pkgError)
          setPackages([])
        } else {
          setPackages((pkgs as Package[]) || [])
        }

        const { data: tnts, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .is("deleted_at", null)

        if (tenantError) {
          console.error("Error fetching tenants:", tenantError)
          setTenants(new Map())
        } else if (tnts) {
          const tenantMap = new Map<string, Tenant>()
          tnts.forEach((t) => tenantMap.set(t.id, t as Tenant))
          setTenants(tenantMap)

          const { data: bids } = await supabase
            .from("bids")
            .select("travel_id, bid_value, is_active, impressions, clicks")
            .eq("is_active", true)

          if (bids && bids.length > 0) {
            const entries = bids.map((b: any) => ({
              travelId: b.travel_id,
              factors: {
                bidScore: b.bid_value || 0,
                rating: 0,
                reviewCount: 0,
                totalBookings: 0,
                conversionRate: b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0,
                isVerified: tenantMap.get(b.travel_id)?.is_verified ?? false,
                hasPromo: false,
                sponsored: false,
              } as RankingFactors,
            }))
            const ranked = rankTravels(entries, DEFAULT_RANKING_CONFIG)
            const scoreMap = new Map<string, number>()
            ranked.forEach((r) => scoreMap.set(r.travelId, r.score))
            setRankingScores(scoreMap)
          }
        }
      } catch (error) {
        console.error("Search fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchQueryParam])

  const filtered = packages
    .filter((pkg) => {
      if (country) {
        const pkgCountryCode = pkg.country_code || ""
        if (pkgCountryCode.toLowerCase() !== country.toLowerCase()) return false
      }
      if (departure) {
        const dep = departure.toLowerCase()
        const cities = (pkg.departure_cities || [pkg.departure_city]).map((c) => c?.toLowerCase() || "")
        if (!cities.some((c) => c.includes(dep))) return false
      }
      if (month && month !== "") {
        if (!pkg.departure_month?.toLowerCase().includes(month.toLowerCase())) return false
      }
      if (cost && cost !== "Semua Biaya" && cost !== "") {
        if (cost === "< Rp 25 Juta" && pkg.price >= 25000000) return false
        if (cost === "Rp 25 – 30 Juta" && (pkg.price < 25000000 || pkg.price >= 30000000)) return false
        if (cost === "Rp 30 – 35 Juta" && (pkg.price < 30000000 || pkg.price >= 35000000)) return false
        if (cost === "Rp 35 – 40 Juta" && (pkg.price < 35000000 || pkg.price >= 40000000)) return false
        if (cost === "Rp 40 – 50 Juta" && (pkg.price < 40000000 || pkg.price >= 50000000)) return false
        if (cost === "> Rp 50 Juta" && pkg.price < 50000000) return false
      }
      if (pkg.price < priceRange[0] || pkg.price > priceRange[1]) return false
      if (type && type !== "semua") {
        if (pkg.type !== type) return false
      }
      if (airlines.length > 0) {
        if (!airlines.some((a) => pkg.airline?.toLowerCase().includes(a.toLowerCase()))) return false
      }
      if (hotelStars) {
        const minStars = parseInt(hotelStars)
        if ((pkg.hotel_makkah_stars || 0) < minStars && (pkg.hotel_madinah_stars || 0) < minStars) return false
      }
      if (duration) {
        const days = pkg.duration_days || 0
        if (duration === "7-10 Hari" && (days < 7 || days > 10)) return false
        if (duration === "10-14 Hari" && (days < 10 || days > 14)) return false
        if (duration === "14-21 Hari" && (days < 14 || days > 21)) return false
      }
      return true
    })
    .sort((a, b) => {
      const aSoldOut = (a.available ?? 0) <= 0
      const bSoldOut = (b.available ?? 0) <= 0
      if (aSoldOut !== bSoldOut) return aSoldOut ? 1 : -1
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "duration") return (a.duration_days ?? 0) - (b.duration_days ?? 0)
      const scoreA = rankingScores.get(a.tenant_id) ?? 0
      const scoreB = rankingScores.get(b.tenant_id) ?? 0
      return scoreB - scoreA
    })

  const clearFilters = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearchInput("")
    router.replace("/search", { scroll: false })
  }

  const hasActiveFilters = Boolean(departure || country || month || cost || airlines.length > 0 || hotelStars || duration || searchQuery) || type !== "semua" || priceRange[0] !== 10000000 || priceRange[1] !== 500000000

  const activeFilterChips: { label: string; onRemove: () => void }[] = []
  if (departure) activeFilterChips.push({ label: departure, onRemove: () => setDeparture("") })
  if (country) activeFilterChips.push({ label: getAseanCountryByCode(country)?.name || country, onRemove: () => setCountry("") })
  if (month) activeFilterChips.push({ label: month, onRemove: () => setMonth("") })
  if (cost && cost !== "Semua Biaya") activeFilterChips.push({ label: cost, onRemove: () => setCost("") })
  if (type !== "semua") activeFilterChips.push({ label: type, onRemove: () => setType("semua") })
  airlines.forEach((a) => activeFilterChips.push({ label: a, onRemove: () => setAirlines(airlines.filter((x) => x !== a)) }))
  if (hotelStars) activeFilterChips.push({ label: `Bintang ${hotelStars}+`, onRemove: () => setHotelStars("") })
  if (duration) activeFilterChips.push({ label: duration, onRemove: () => setDuration("") })
  if (searchQuery) activeFilterChips.push({ label: `"${searchQuery}"`, onRemove: () => handleSearchInput("") })

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="h-6 bg-slate-200 rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-28" />
        </div>
        <div className="sticky top-16 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="h-11 bg-slate-100 rounded-full animate-pulse max-w-2xl" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="flex gap-8">
            <div className="hidden lg:block w-64 shrink-0">
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Page header: compact ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Hasil Pencarian Paket Umroh</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Menampilkan <span className="font-semibold text-emerald-700">{filtered.length} paket</span> ditemukan
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-slate-500">Urutkan:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "relevance")}>
              <SelectTrigger
                aria-label="Urutkan hasil pencarian"
                className="h-10 w-44 text-sm bg-white border-slate-200 text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="price-asc">Harga Terendah</SelectItem>
                <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
                <SelectItem value="duration">Durasi Terpendek</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Sticky search toolbar ── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama paket, travel, atau kota..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit() }}
                aria-label="Cari paket umroh"
                className="w-full pl-11 pr-4 h-11 bg-slate-100 border border-transparent rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <button
              onClick={handleSearchSubmit}
              aria-label="Cari paket umroh"
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-full shadow-md shadow-amber-400/20 hover:shadow-lg hover:shadow-amber-400/30 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10">

        {/* Quick Category Pills */}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
          {QUICK_CATEGORIES.map((q) => {
            const isActive = Object.entries(q.preset).every(([k, v]) => {
              if (k === "month") return month?.toLowerCase().includes((v as string).toLowerCase())
              if (k === "cost") return cost === v
              if (k === "type") return type === v
              return true
            }) && (Object.keys(q.preset).length > 0 ? true : type === "semua" && !month && !cost)

            return (
              <button
                key={q.label}
                onClick={() => {
                  if (Object.keys(q.preset).length === 0) {
                    clearFilters()
                    return
                  }
                  Object.entries(q.preset).forEach(([k, v]) => {
                    if (k === "month") setMonth(isActive ? "" : (v as string))
                    if (k === "cost") setCost(isActive ? "" : (v as string))
                    if (k === "type") setType(isActive ? "semua" : (v as string))
                  })
                }}
                aria-pressed={isActive}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {q.label}
              </button>
            )
          })}
        </div>

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilterChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                {chip.label}
                <button onClick={chip.onRemove} aria-label={`Hapus filter ${chip.label}`} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 underline ml-1 self-center">
              Hapus semua
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <SearchSidebar
              departure={departure}
              setDeparture={setDeparture}
              country={country}
              setCountry={setCountry}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              duration={duration}
              setDuration={setDuration}
              airlines={airlines}
              setAirlines={setAirlines}
              hotelStars={hotelStars}
              setHotelStars={setHotelStars}
              hasActiveFilters={!!hasActiveFilters}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          {showMobileFilter && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilter(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl overflow-y-auto p-4 pb-28">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Filter</h3>
                  <button onClick={() => setShowMobileFilter(false)} aria-label="Tutup filter" className="min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SearchSidebar
                  departure={departure}
                  setDeparture={setDeparture}
                  country={country}
                  setCountry={setCountry}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  duration={duration}
                  setDuration={setDuration}
                  airlines={airlines}
                  setAirlines={setAirlines}
                  hotelStars={hotelStars}
                  setHotelStars={setHotelStars}
                  hasActiveFilters={!!hasActiveFilters}
                  clearFilters={clearFilters}
                />
              </div>
            </div>
          )}

          {/* Package Grid */}
          <div className="lg:col-span-3 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200/70 shadow-sm">
                <SearchX className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="font-semibold text-lg mb-2 text-slate-900">Paket tidak ditemukan</h3>
                <p className="text-sm text-slate-500 mb-6">Coba ubah kata kunci atau filter pencarian Anda</p>
                <button onClick={clearFilters} className="px-5 py-2.5 text-sm font-semibold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer">
                  Lihat Semua Paket
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((pkg) => (
                  <SharedPackageCard key={pkg.id} pkg={pkg} travel={tenants.get(pkg.tenant_id)} variant="clean" />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom bar (Filter + Urutkan) ── */}
      <div className="lg:hidden sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowMobileFilter(true)}
            aria-label="Buka filter pencarian"
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-emerald-600 text-white rounded-full shadow-sm font-semibold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>
          <div className="flex-1">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "relevance")}>
              <SelectTrigger
                aria-label="Urutkan hasil pencarian"
                className="w-full h-11 text-sm bg-white border-slate-200 text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="price-asc">Harga Terendah</SelectItem>
                <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
                <SelectItem value="duration">Durasi Terpendek</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
