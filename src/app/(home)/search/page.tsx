"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Search, X, SlidersHorizontal, MapPin, Loader2 } from "lucide-react"
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

  const [departure, setDeparture] = useState(searchParams.get("departure") ?? "")
  const [country, setCountry] = useState(searchParams.get("country") ?? "")
  const [month, setMonth] = useState(searchParams.get("month") ?? "")
  const [cost, setCost] = useState(searchParams.get("cost") ?? "")
  const [type, setType] = useState("semua")
  const [airline, setAirline] = useState("")
  const [hotelStars, setHotelStars] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([10000000, 500000000])
  const [duration, setDuration] = useState("")

  const [packages, setPackages] = useState<Package[]>([])
  const [tenants, setTenants] = useState<Map<string, Tenant>>(new Map())
  const [rankingScores, setRankingScores] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const searchQueryParam = searchParams.get("search")

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      try {
        let query = supabase
          .from("packages")
          .select("*")
          .eq("status", "published")
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

  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const paramQuery = searchParams.get("search")
    if (paramQuery !== searchQuery) {
      setSearchQuery(paramQuery || "")
    }
  }, [searchParams.get("search")])

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
      if (airline) {
        if (!pkg.airline?.toLowerCase().includes(airline.toLowerCase())) return false
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
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "duration") return (a.duration_days ?? 0) - (b.duration_days ?? 0)
      const scoreA = rankingScores.get(a.tenant_id) ?? 0
      const scoreB = rankingScores.get(b.tenant_id) ?? 0
      return scoreB - scoreA
    })

  const filteredWithSearch = filtered.filter((pkg) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.departure_city?.toLowerCase().includes(query) ||
      pkg.description?.toLowerCase().includes(query)
    )
  })

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (departure) params.set("departure", departure)
    if (country) params.set("country", country)
    if (month) params.set("month", month)
    if (cost && cost !== "Semua Biaya") params.set("cost", cost)
    if (type && type !== "semua") params.set("type", type)
    if (airline) params.set("airline", airline)
    if (hotelStars) params.set("hotelStars", hotelStars)
    if (searchQuery) params.set("search", searchQuery)
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setDeparture("")
    setCountry("")
    setMonth("")
    setCost("")
    setType("semua")
    setAirline("")
    setHotelStars("")
    setSearchQuery("")
    setPriceRange([10000000, 500000000])
    setDuration("")
  }

  const hasActiveFilters = departure || country || month || cost || type !== "semua" || airline || hotelStars || searchQuery || duration || priceRange[0] !== 10000000 || priceRange[1] !== 500000000

  const activeFilterChips: { label: string; onRemove: () => void }[] = []
  if (departure) activeFilterChips.push({ label: departure, onRemove: () => setDeparture("") })
  if (country) activeFilterChips.push({ label: getAseanCountryByCode(country)?.name || country, onRemove: () => setCountry("") })
  if (month) activeFilterChips.push({ label: month, onRemove: () => setMonth("") })
  if (cost && cost !== "Semua Biaya") activeFilterChips.push({ label: cost, onRemove: () => setCost("") })
  if (type !== "semua") activeFilterChips.push({ label: type, onRemove: () => setType("semua") })
  if (airline) activeFilterChips.push({ label: airline, onRemove: () => setAirline("") })
  if (hotelStars) activeFilterChips.push({ label: `Bintang ${hotelStars}+`, onRemove: () => setHotelStars("") })
  if (duration) activeFilterChips.push({ label: duration, onRemove: () => setDuration("") })
  if (searchQuery) activeFilterChips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery("") })

  const countryCode = country || undefined

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-32 bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl animate-pulse mb-6" />
          <div className="flex gap-7">
            <div className="hidden lg:block w-72 shrink-0">
              <div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="h-48 bg-slate-100 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 rounded-2xl mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Hasil Pencarian Paket Umroh</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Menampilkan <span className="font-bold text-white">{filteredWithSearch.length} paket</span> ditemukan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-200 hidden sm:block">Urutkan:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "relevance")}>
                <SelectTrigger className="h-10 w-48 text-sm bg-white/15 border-white/20 text-white placeholder:text-white/60">
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

        {/* Main Search Input */}
        <div className="mb-5">
          <div className="flex gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama paket, travel, atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                aria-label="Cari paket umroh"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              aria-label="Cari paket umroh"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold rounded-xl shadow-md shadow-amber-400/20 hover:shadow-lg hover:shadow-amber-400/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
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
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
              airline={airline}
              setAirline={setAirline}
              hotelStars={hotelStars}
              setHotelStars={setHotelStars}
              hasActiveFilters={!!hasActiveFilters}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 font-semibold text-sm hover:bg-emerald-700 transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>
          </div>

          {/* Mobile Filter Drawer */}
          {showMobileFilter && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilter(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Filter</h3>
                  <button onClick={() => setShowMobileFilter(false)} className="p-2 hover:bg-slate-100 rounded-lg">
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
                  airline={airline}
                  setAirline={setAirline}
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
            {filteredWithSearch.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <div className="text-5xl mb-4" role="img" aria-label="Pencarian">🔍</div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">Paket tidak ditemukan</h3>
                <p className="text-sm text-slate-500 mb-5">Coba ubah filter pencarian Anda</p>
                <button onClick={clearFilters} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWithSearch.map((pkg) => (
                  <SharedPackageCard key={pkg.id} pkg={pkg} travel={tenants.get(pkg.tenant_id)} />
                ))}
              </div>
            )}
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
