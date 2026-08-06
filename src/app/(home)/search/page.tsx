"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COST_RANGES, PACKAGE_TYPES, AIRLINES, HOTEL_STARS, getAseanCountryByCode } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Package, Tenant } from "@/lib/types"
import SharedPackageCard from "@/components/shared/package-card"
import CityAutocomplete from "@/components/shared/city-autocomplete"
import CountrySelect from "@/components/shared/country-select"
import { rankTravels, RankingFactors, DEFAULT_RANKING_CONFIG } from "@/lib/business-logic/bidding"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [departure, setDeparture] = useState(searchParams.get("departure") ?? "")
  const [country, setCountry] = useState(searchParams.get("country") ?? "")
  const [month, setMonth] = useState(searchParams.get("month") ?? "")
  const [cost, setCost] = useState(searchParams.get("cost") ?? "")
  const [type, setType] = useState("semua")
  const [airline, setAirline] = useState("semua")
  const [hotelStars, setHotelStars] = useState("semua")
  const [sortBy, setSortBy] = useState("relevance")
  const [showMobileFilter, setShowMobileFilter] = useState(false)

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

        // Apply search filter if present
        if (searchQueryParam) {
          query = query.or(`name.ilike.%${searchQueryParam}%,description.ilike.%${searchQueryParam}%,departure_city.ilike.%${searchQueryParam}%`)
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

  // Client-side search
  const [searchQuery, setSearchQuery] = useState("")

  // Sync search query from URL
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
      if (type && type !== "semua") {
        if (pkg.type !== type) return false
      }
      if (airline && airline !== "semua") {
        if (!pkg.airline?.toLowerCase().includes(airline.toLowerCase())) return false
      }
      if (hotelStars !== "semua") {
        const minStars = parseInt(hotelStars)
        if (minStars === 5) {
          if ((pkg.hotel_makkah_stars || 0) !== 5 || (pkg.hotel_madinah_stars || 0) !== 5) return false
        } else {
          if ((pkg.hotel_makkah_stars || 0) < minStars && (pkg.hotel_madinah_stars || 0) < minStars) return false
        }
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
    const tenant = tenants.get(pkg.tenant_id)
    return (
      pkg.name.toLowerCase().includes(query) ||
      tenant?.name.toLowerCase().includes(query) ||
      pkg.departure_city?.toLowerCase().includes(query) ||
      pkg.slug.toLowerCase().includes(query) ||
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
    if (airline && airline !== "semua") params.set("airline", airline)
    if (hotelStars && hotelStars !== "semua") params.set("hotelStars", hotelStars)
    if (searchQuery) params.set("search", searchQuery)
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setDeparture("")
    setCountry("")
    setMonth("")
    setCost("")
    setType("semua")
    setAirline("semua")
    setHotelStars("semua")
    setSearchQuery("")
  }

  const hasActiveFilters = departure || country || month || cost || type !== "semua" || airline !== "semua" || hotelStars !== "semua" || searchQuery

  const countryCode = country || undefined

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50">
        <div className="bg-white border-b border-border px-4 sm:px-6 py-5">
          <div className="max-w-7xl mx-auto">
            <div className="h-6 bg-muted rounded animate-pulse w-64 mb-2" />
            <div className="h-4 bg-muted rounded animate-pulse w-48" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className="h-44 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Hasil Pencarian Paket Umroh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredWithSearch.length} paket ditemukan dari total {filtered.length} paket
            {searchQuery && `· Pencarian kata kunci "${searchQuery}"`}
            {departure && ` · Keberangkatan dari ${departure}`}
            {month && ` · ${month}`}
            {cost && cost !== "Semua Biaya" && ` · ${cost}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-7">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border border-border rounded-2xl p-5 sticky top-24">
              <FilterPanel
                departure={departure} setDeparture={setDeparture}
                country={country} setCountry={setCountry}
                countryCode={countryCode}
                month={month} setMonth={setMonth}
                cost={cost} setCost={setCost}
                type={type} setType={setType}
                airline={airline} setAirline={setAirline}
                hotelStars={hotelStars} setHotelStars={setHotelStars}
                hasActiveFilters={!!hasActiveFilters}
                clearFilters={clearFilters}
                handleSearch={handleSearch}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3">
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                aria-expanded={showMobileFilter}
                aria-controls="mobile-filter-panel"
                className="lg:hidden flex items-center gap-2 text-sm font-medium border border-border bg-white px-3 py-2 rounded-lg"
              >
                <Filter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">Urutkan:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "relevance")}>
                  <SelectTrigger className="h-9 w-44 text-sm">
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

            {/* Global Search Widget */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama paket atau travel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch()
                  }}
                  aria-label="Cari paket umroh"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-foreground transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {showMobileFilter && (
              <div id="mobile-filter-panel" className="lg:hidden bg-white border border-border rounded-2xl p-5 mb-5">
              <FilterPanel
                departure={departure} setDeparture={setDeparture}
                country={country} setCountry={setCountry}
                countryCode={countryCode}
                month={month} setMonth={setMonth}
                cost={cost} setCost={setCost}
                type={type} setType={setType}
                airline={airline} setAirline={setAirline}
                hotelStars={hotelStars} setHotelStars={setHotelStars}
                hasActiveFilters={!!hasActiveFilters}
                clearFilters={clearFilters}
                handleSearch={handleSearch}
              />
              </div>
            )}

            {/* Quick filter presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "Bulan Ramadhan", preset: { month: "Ramadhan" } },
                { label: "Promo Terbaik", preset: { cost: "< Rp 25 Juta" } },
                { label: "Plus Turki", preset: { type: "plus" } },
                { label: "Umroh Reguler", preset: { type: "reguler" } },
                { label: "Umroh VIP", preset: { type: "vip" } },
                { label: "Furoda", preset: { type: "furoda" } },
              ].map((q) => {
                const isActive = Object.entries(q.preset).some(([k, v]) => {
                  if (k === "month") return month?.toLowerCase().includes((v as string).toLowerCase())
                  if (k === "cost") return cost === v
                  if (k === "type") return type === v
                  return false
                })
                return (
                  <button
                    key={q.label}
                    onClick={() => {
                      Object.entries(q.preset).forEach(([k, v]) => {
                        if (k === "month") setMonth(isActive ? "" : (v as string))
                        if (k === "cost") setCost(isActive ? "" : (v as string))
                        if (k === "type") setType(isActive ? "semua" : (v as string))
                      })
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white border-border/60 text-muted-foreground hover:border-primary/20 hover:text-primary"
                    }`}
                  >
                    {q.label}
                  </button>
                )
              })}
            </div>

          {/* Results count with search */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredWithSearch.length} paket ditemukan dari total {filtered.length} paket
              {searchQuery && `· Pencarian kata kunci "${searchQuery}"`}
              {departure && `· Keberangkatan dari ${departure}`}
              {month && `· ${month}`}
              {cost && cost !== "Semua Biaya" && `· ${cost}`}
            </p>
          </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {country && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {getAseanCountryByCode(country)?.name || country}
                    <button onClick={() => setCountry("")} aria-label={`Hapus filter negara ${getAseanCountryByCode(country)?.name || country}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {departure && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="w-3 h-3" />{departure}
                    <button onClick={() => setDeparture("")} aria-label={`Hapus filter kota ${departure}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {month && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {month}
                    <button onClick={() => setMonth("")} aria-label={`Hapus filter bulan ${month}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {cost && cost !== "Semua Biaya" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {cost}
                    <button onClick={() => setCost("")} aria-label={`Hapus filter biaya ${cost}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {type !== "semua" && (
                  <Badge variant="secondary" className="gap-1 text-xs capitalize">
                    {type}
                    <button onClick={() => setType("semua")} aria-label={`Hapus filter tipe ${type}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {airline !== "semua" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {airline}
                    <button onClick={() => setAirline("semua")} aria-label={`Hapus filter maskapai ${airline}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {hotelStars !== "semua" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Hotel Bintang {hotelStars}+
                    <button onClick={() => setHotelStars("semua")} aria-label={`Hapus filter hotel bintang ${hotelStars}`}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery("")} aria-label="Hapus pencarian kata kunci"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-border">
                <div className="text-5xl mb-4" role="img" aria-label="Pencarian">🔍</div>
                <h3 className="font-semibold text-lg mb-2">Paket tidak ditemukan</h3>
                <p className="text-sm text-muted-foreground mb-5">Coba ubah filter pencarian Anda</p>
                <Button variant="outline" onClick={clearFilters}>Reset Filter</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((pkg) => (
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

interface FilterPanelProps {
  departure: string; setDeparture: (v: string) => void
  country: string; setCountry: (v: string) => void
  countryCode: string | undefined
  month: string; setMonth: (v: string) => void
  cost: string; setCost: (v: string) => void
  type: string; setType: (v: string) => void
  airline: string; setAirline: (v: string) => void
  hotelStars: string; setHotelStars: (v: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  handleSearch: () => void
}

function FilterPanel({
  departure, setDeparture, country, setCountry, countryCode, month, setMonth,
  cost, setCost, type, setType, airline, setAirline, hotelStars, setHotelStars,
  hasActiveFilters, clearFilters, handleSearch,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filter Pencarian</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Negara</Label>
        <CountrySelect value={country} onChange={setCountry} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kota Keberangkatan</Label>
        <CityAutocomplete
          value={departure}
          onChange={setDeparture}
          placeholder="Cari kota keberangkatan..."
          countryFilter={countryCode}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bulan Keberangkatan</Label>
        <Input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Contoh: Agustus 2026"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimasi Biaya</Label>
        <Select value={cost || "Semua Biaya"} onValueChange={(v) => setCost(v ?? "")}>
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COST_RANGES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipe Paket</Label>
        <Select value={type} onValueChange={(v) => setType(v ?? "semua")}>
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PACKAGE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Maskapai</Label>
        <Select value={airline} onValueChange={(v) => setAirline(v ?? "semua")}>
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AIRLINES.map((a) => (
              <SelectItem key={a} value={a}>{a === "semua" ? "Semua Maskapai" : a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bintang Hotel</Label>
        <Select value={hotelStars} onValueChange={(v) => setHotelStars(v ?? "semua")}>
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOTEL_STARS.map((h) => (
              <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSearch} className="w-full h-9 text-sm">
        Terapkan Filter
      </Button>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
