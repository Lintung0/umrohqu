"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { Search, SearchX, X, SlidersHorizontal, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAseanCountryByCode } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { getPackageAvailable } from "@/lib/utils"
import type { Package, Tenant } from "@/lib/types"
import SharedPackageCard from "@/components/shared/package-card"
import SearchSidebar from "@/components/search/search-sidebar"
import { Pagination } from "@/components/ui/pagination"
import { rankTravels, RankingFactors, DEFAULT_RANKING_CONFIG } from "@/lib/business-logic/bidding"

const PAGE_SIZE = 9

const QUICK_CATEGORIES = [
  { label: "Semua", preset: {} },
  { label: "Bulan Ramadhan", preset: { month: "Ramadhan" } },
  { label: "Promo Terbaik", preset: { cost: "< Rp 25 Juta" } },
  { label: "umrah Reguler", preset: { type: "reguler" } },
  { label: "umrah VIP", preset: { type: "vip" } },
  { label: "Haji Furoda", preset: { type: "furoda" } },
]

interface GeoapifySuggestion {
  name: string
  country: string
  country_code: string
  formatted: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [page, setPage] = useState(1)
  const resultsRef = useRef<HTMLDivElement>(null)
  const suggestionsContainerRef = useRef<HTMLDivElement>(null)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [citySuggestions, setCitySuggestions] = useState<GeoapifySuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [loadingCitySuggestions, setLoadingCitySuggestions] = useState(false)

  const departure = searchParams.get("departure") ?? ""
  const country = searchParams.get("country") ?? ""
  const month = searchParams.get("month") ?? ""
  const cost = searchParams.get("cost") ?? ""
  const type = searchParams.get("type") ?? "semua"
  const duration = searchParams.get("duration") ?? ""
  const sortBy = searchParams.get("sort") ?? "relevance"

  const SORT_LABELS: Record<string, string> = {
    relevance: "Relevansi",
    "price-asc": "Harga Terendah",
    "price-desc": "Harga Tertinggi",
    duration: "Durasi Terpendek",
    "duration-desc": "Durasi Terpanjang",
  }
  const searchQuery = searchParams.get("search") ?? ""
  const parsedMin = parseInt(searchParams.get("priceMin") ?? "", 10)
  const parsedMax = parseInt(searchParams.get("priceMax") ?? "", 10)
  const priceRange: [number, number] = [
    Number.isFinite(parsedMin) ? parsedMin : 0,
    Number.isFinite(parsedMax) ? parsedMax : 500000000,
  ]
  const searchQueryParam = searchQuery

  const [searchInput, setSearchInput] = useState(searchQuery)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "")
  }, [searchParams.get("search")])

  useEffect(() => {
    setPage(1)
  }, [searchParams.toString()])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchCitySuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    if (!apiKey) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    setLoadingCitySuggestions(true)
    try {
      const params = new URLSearchParams({
        text: query,
        type: "city",
        lang: "id",
        limit: "5",
        apiKey,
      })

      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`)
      if (!res.ok) {
        setCitySuggestions([])
        setShowCitySuggestions(false)
        setLoadingCitySuggestions(false)
        return
      }
      const data = await res.json()

      const results: GeoapifySuggestion[] = (data.features || [])
        .map((f: any) => ({
          name: f.properties.city || f.properties.name || "",
          country: f.properties.country || "",
          country_code: f.properties.country_code || "",
          formatted: f.properties.formatted || f.properties.city || f.properties.name || "",
        }))
        .filter((s: GeoapifySuggestion) => s.name)

      setCitySuggestions(results)
      setShowCitySuggestions(results.length > 0)
    } catch {
      setCitySuggestions([])
    } finally {
      setLoadingCitySuggestions(false)
    }
  }, [])

  const handlePageChange = (next: number) => {
    setPage(next)
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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

    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    cityDebounceRef.current = setTimeout(() => {
      fetchCitySuggestions(v)
    }, 300)
  }

  const handleSearchSubmit = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    setShowCitySuggestions(false)
    setUrl({ search: searchInput.trim() || null })
  }

  const handleSelectCitySuggestion = (s: GeoapifySuggestion) => {
    setSearchInput(s.name)
    setShowCitySuggestions(false)
    setCitySuggestions([])
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setUrl({ search: s.name })
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
          .in("status", ["active", "ongoing"])
          .neq("type", "haji")
          .is("deleted_at", null)

        if (searchQueryParam) {
          query = query.or(
            `name.ilike.*${searchQueryParam}*,` +
            `description.ilike.*${searchQueryParam}*,` +
            `departure_city.ilike.*${searchQueryParam}*,` +
            `slug.ilike.*${searchQueryParam}*`
          )
        }

        const { data: pkgs, error: pkgError } = await query
        if (pkgError) {
          console.error("Error fetching packages:", pkgError)
          setPackages([])
        } else {
          const enriched = await enrichPackagesWithDetail(supabase, (pkgs as Package[]) || [])
          setPackages(enriched || [])
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

          try {
            const { data: bids } = await supabase
              .from("biddings")
              .select("tenant_id, bid_value, status, impressions, clicks")
              .eq("status", "active")

            if (bids && bids.length > 0) {
              const entries = bids.map((b: any) => ({
                travelId: b.tenant_id,
                factors: {
                  bidScore: b.bid_value || 0,
                  rating: 0,
                  reviewCount: 0,
                  totalBookings: 0,
                  conversionRate: b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0,
                  isVerified: tenantMap.get(b.tenant_id)?.is_verified ?? false,
                  hasPromo: false,
                  sponsored: false,
                } as RankingFactors,
              }))
              const ranked = rankTravels(entries, DEFAULT_RANKING_CONFIG)
              const scoreMap = new Map<string, number>()
              ranked.forEach((r) => scoreMap.set(r.travelId, r.score))
              setRankingScores(scoreMap)
            }
          } catch {
            // bids table may not exist yet, ranking stays empty
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

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("search-packages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, () => {
        const query = supabase
          .from("packages")
          .select("*")
          .in("status", ["active", "ongoing"])
          .neq("type", "haji")
          .is("deleted_at", null)
        query.then(async ({ data }) => {
          const enriched = await enrichPackagesWithDetail(supabase, (data as Package[]) || [])
          setPackages(enriched || [])
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = packages
    .filter((pkg) => {
      if (country) {
        const pkgCountryCode = pkg.country_code || ""
        if (pkgCountryCode.toLowerCase() !== country.toLowerCase()) return false
      }
      if (departure) {
        const dep = departure.toLowerCase()
        const cities = [pkg.departure_city].filter(Boolean).map((c) => c?.toLowerCase() || "")
        if (!cities.some((c) => c.includes(dep))) return false
      }
      if (month && month !== "") {
        const monthName = pkg.departure_date
          ? new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(pkg.departure_date))
          : ""
        if (!monthName.toLowerCase().includes(month.toLowerCase())) return false
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
      if (duration) {
        const days = pkg.duration_nights || 0
        if (duration === "7-10 Hari" && (days < 7 || days > 10)) return false
        if (duration === "10-14 Hari" && (days < 10 || days > 14)) return false
        if (duration === "14-21 Hari" && (days < 14 || days > 21)) return false
      }
      return true
    })
    .sort((a, b) => {
      const aSoldOut = getPackageAvailable(a) <= 0
      const bSoldOut = getPackageAvailable(b) <= 0
      if (aSoldOut !== bSoldOut) return aSoldOut ? 1 : -1
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "duration") return (a.duration_nights ?? 0) - (b.duration_nights ?? 0)
      if (sortBy === "duration-desc") return (b.duration_nights ?? 0) - (a.duration_nights ?? 0)
      const scoreA = rankingScores.get(a.tenant_id) ?? 0
      const scoreB = rankingScores.get(b.tenant_id) ?? 0
      return scoreB - scoreA
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const clearFilters = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    setSearchInput("")
    setShowCitySuggestions(false)
    setCitySuggestions([])
    router.replace("/search", { scroll: false })
  }

  const hasActiveFilters = Boolean(departure || country || month || cost || duration || searchQuery) || type !== "semua" || priceRange[0] !== 10000000 || priceRange[1] !== 500000000

  const activeFilterChips: { label: string; onRemove: () => void }[] = []
  if (departure) activeFilterChips.push({ label: departure, onRemove: () => setDeparture("") })
  if (country) activeFilterChips.push({ label: getAseanCountryByCode(country)?.name || country, onRemove: () => setCountry("") })
  if (month) activeFilterChips.push({ label: month, onRemove: () => setMonth("") })
  if (cost && cost !== "Semua Biaya") activeFilterChips.push({ label: cost, onRemove: () => setCost("") })
  if (type !== "semua") activeFilterChips.push({ label: type, onRemove: () => setType("semua") })
  if (duration) activeFilterChips.push({ label: duration, onRemove: () => setDuration("") })
  if (searchQuery) activeFilterChips.push({ label: `"${searchQuery}"`, onRemove: () => handleSearchInput("") })

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="sticky top-16 z-40 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2.5 max-w-2xl mx-auto">
              <div className="w-11 shrink-0" />
              <div className="h-11 flex-1 bg-white border border-slate-200 rounded-full animate-pulse" />
              <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-2 mb-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-slate-100 rounded-full animate-pulse shrink-0" />
            ))}
            <div className="hidden lg:block h-10 w-40 ml-auto bg-slate-100 rounded-full animate-pulse" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* ── Sticky search toolbar ── */}
      <div className="sticky top-16 z-40 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2.5 max-w-2xl mx-auto">
            <button
              onClick={() => setShowMobileFilter(true)}
              aria-label="Buka filter pencarian"
              className="lg:hidden relative w-11 h-11 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-slate-700 rounded-full shadow-sm hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200" />}
            </button>
            <div className="relative flex-1" ref={suggestionsContainerRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama paket, travel, atau kota..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit() }}
                  onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true) }}
                  aria-label="Cari paket umrah"
                  className={`w-full pl-5 ${searchInput ? "pr-10" : "pr-4"} h-11 bg-white border border-slate-200 shadow-sm rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all`}
                />
                {searchInput && !loadingCitySuggestions && (
                  <button
                    onClick={() => {
                      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
                      setSearchInput("")
                      setUrl({ search: null })
                      setShowCitySuggestions(false)
                      setCitySuggestions([])
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {loadingCitySuggestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                  </div>
                )}
              </div>
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {citySuggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => handleSelectCitySuggestion(s)}
                      className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-emerald-50/60 transition-colors"
                    >
                      <MapPin size={14} className="shrink-0 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">{s.name}</span>
                        {s.country && (
                          <span className="ml-1.5 text-xs text-slate-500">· {s.country}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={handleSearchSubmit}
              aria-label="Cari paket umrah"
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-10">

        {/* Quick Category Pills + Sort */}
        <div className="space-y-3 mb-5 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-1 sm:min-w-0">
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
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25"
                      : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {q.label}
                </button>
              )
            })}
          </div>
          <div className="shrink-0 flex justify-end w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "relevance")}>
              <SelectTrigger
                aria-label="Urutkan hasil pencarian"
                className="h-10 w-36 sm:w-40 text-sm bg-white border-slate-200 text-slate-700 shadow-sm rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <SelectValue>{SORT_LABELS[sortBy] ?? sortBy}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="price-asc">Harga Terendah</SelectItem>
                <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
                <SelectItem value="duration">Durasi Terpendek</SelectItem>
                <SelectItem value="duration-desc">Durasi Terpanjang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilterChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-0 py-1 bg-white text-emerald-800 text-xs font-medium rounded-full border border-emerald-200 shadow-sm">
                {chip.label}
                <button onClick={chip.onRemove} aria-label={`Hapus filter ${chip.label}`} className="-my-1 p-1.5 flex items-center justify-center min-w-8 min-h-8 text-emerald-500 hover:text-emerald-900 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer">
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
              hasActiveFilters={!!hasActiveFilters}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          {showMobileFilter && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-300" onClick={() => setShowMobileFilter(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl overflow-y-auto p-4 pb-28 animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Pencarian
                  </span>
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
                  hasActiveFilters={!!hasActiveFilters}
                  clearFilters={clearFilters}
                />
              </div>
            </div>
          )}

          {/* Package Grid */}
          <div ref={resultsRef} className="lg:col-span-3 min-w-0 scroll-mt-28">
            {filtered.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <SearchX className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">Paket tidak ditemukan</h3>
                <p className="text-sm text-slate-500 mb-6">Coba ubah kata kunci atau filter pencarian Anda</p>
                <button onClick={clearFilters} className="px-6 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer">
                  Lihat Semua Paket
                </button>
              </div>
            ) : (
              <>
                <div key={currentPage} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  {paginated.map((pkg) => (
                    <SharedPackageCard key={pkg.id} pkg={pkg} travel={tenants.get(pkg.tenant_id)} showTravel={true} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    className="mt-8 sm:mt-10"
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
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
