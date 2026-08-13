"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, RotateCcw, MapPin, Plane, Star, Clock, Banknote, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ASEAN_COUNTRIES } from "@/lib/constants"

interface SearchSidebarProps {
  departure: string
  setDeparture: (v: string) => void
  country?: string
  setCountry?: (v: string) => void
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  duration: string
  setDuration: (v: string) => void
  airlines: string[]
  setAirlines: (v: string[]) => void
  hotelStars: string
  setHotelStars: (v: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

interface GeoapifySuggestion {
  name: string
  country: string
  country_code: string
  formatted: string
}

const PRICE_RANGES: { label: string; range: [number, number] }[] = [
  { label: "10-25jt", range: [10000000, 25000000] },
  { label: "25-50jt", range: [25000000, 50000000] },
  { label: "50-100jt", range: [50000000, 100000000] },
  { label: ">100jt", range: [100000000, 500000000] },
]

const DURATION_OPTIONS = ["7-10 Hari", "10-14 Hari", "14-21 Hari"]

const AIRLINES = [
  "Garuda Indonesia",
  "Saudi Airlines",
  "Qatar Airways",
  "Turkish Airlines",
  "Batik Air",
  "Lion Air",
]

const HOTEL_STARS = [
  { value: "3", label: "Bintang 3" },
  { value: "4", label: "Bintang 4" },
  { value: "5", label: "Bintang 5" },
]

function formatPriceShort(v: number): string {
  if (v >= 100000000) return `${Math.round(v / 1000000000) * 1}M`
  if (v >= 10000000) return `${Math.round(v / 1000000)}jt`
  return `${Math.round(v / 1000)}rb`
}

function CityAutocompleteFilter({
  value,
  onChange,
  countryFilter,
}: {
  value: string
  onChange: (v: string) => void
  countryFilter?: string
}) {
  const [input, setInput] = useState(value)
  const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setInput(value) }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setSuggestions([]); setOpen(false); return }
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    if (!apiKey) { setSuggestions([]); setOpen(false); return }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        text: query,
        type: "city",
        lang: "id",
        limit: "7",
        apiKey,
      })
      if (countryFilter) params.set("filter", `countrycode:${countryFilter.toLowerCase()}`)

      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`)
      if (!res.ok) { setSuggestions([]); setOpen(false); setLoading(false); return }
      const data = await res.json()

      const results: GeoapifySuggestion[] = (data.features || [])
        .map((f: any) => ({
          name: f.properties.city || f.properties.name || "",
          country: f.properties.country || "",
          country_code: f.properties.country_code || "",
          formatted: f.properties.formatted || "",
        }))
        .filter((s: GeoapifySuggestion) => s.name)

      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [countryFilter])

  const handleInputChange = (val: string) => {
    setInput(val)
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const selectSuggestion = (s: GeoapifySuggestion) => {
    setInput(s.name)
    onChange(s.name)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder="Ketik nama kota..."
          aria-label="Kota keberangkatan"
          aria-expanded={open}
          role="combobox"
          autoComplete="off"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={false}
              onClick={() => selectSuggestion(s)}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-emerald-50"
            >
              <MapPin size={14} className="shrink-0 text-emerald-500" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-900">{s.name}</span>
                {s.country && (
                  <span className="ml-1.5 text-xs text-slate-400">· {s.country}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CountrySelectFilter({
  value,
  onChange,
}: {
  value?: string
  onChange?: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = ASEAN_COUNTRIES.find((c) => c.code === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `Negara: ${selected.name}` : "Semua Negara"}
        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 hover:border-emerald-300 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{selected?.emoji || "🌏"}</span>
          <span className="font-medium">{selected?.name || "Semua Negara"}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <li
            onClick={() => { onChange?.(""); setOpen(false) }}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-emerald-50",
              !value && "bg-emerald-50 text-emerald-700 font-medium"
            )}
          >
            <span className="text-base">🌏</span>
            <span>Semua Negara</span>
          </li>
          {ASEAN_COUNTRIES.map((c) => (
            <li
              key={c.code}
              onClick={() => { onChange?.(c.code); setOpen(false) }}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-emerald-50",
                value === c.code && "bg-emerald-50 text-emerald-700 font-medium"
              )}
            >
              <span className="text-base">{c.emoji}</span>
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SearchSidebar({
  departure, setDeparture,
  country, setCountry,
  priceRange, setPriceRange,
  duration, setDuration,
  airlines, setAirlines,
  hotelStars, setHotelStars,
  hasActiveFilters, clearFilters,
}: SearchSidebarProps) {
  const toggleDuration = (d: string) => setDuration(duration === d ? "" : d)
  const toggleAirline = (a: string) =>
    setAirlines(airlines.includes(a) ? airlines.filter((x) => x !== a) : [...airlines, a])
  const toggleStars = (s: string) => setHotelStars(hotelStars === s ? "" : s)

  const isPriceQuickActive = (range: [number, number]) =>
    priceRange[0] === range[0] && priceRange[1] === range[1]

  const handlePriceQuick = (range: [number, number]) => {
    if (isPriceQuickActive(range)) setPriceRange([10000000, 500000000])
    else setPriceRange(range)
  }

  return (
    <div className="sticky top-36 max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-2 pb-10 custom-scrollbar space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900">Filter Pencarian</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer">
            <RotateCcw className="w-3 h-3" /> Reset All
          </button>
        )}
      </div>

      {/* Negara */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Negara
        </label>
        <CountrySelectFilter value={country} onChange={setCountry} />
      </div>

      {/* Kota Keberangkatan — Geoapify Autocomplete */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Kota Keberangkatan
        </label>
        <CityAutocompleteFilter
          value={departure}
          onChange={setDeparture}
          countryFilter={country}
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Estimasi Harga
        </label>

        <div className="px-1">
          <input
            type="range"
            min={10000000}
            max={500000000}
            step={5000000}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            aria-label="Estimasi harga maksimum"
            aria-valuetext={`Rp ${formatPriceShort(priceRange[1])}`}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Rp 10jt</span>
            <span className="font-semibold text-emerald-700 text-xs">
              Rp {formatPriceShort(priceRange[0])} – {formatPriceShort(priceRange[1])}
            </span>
            <span>Rp 500jt</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((pr) => (
            <button
              key={pr.label}
              onClick={() => handlePriceQuick(pr.range)}
              aria-pressed={isPriceQuickActive(pr.range)}
              className={cn(
                "min-h-11 px-3 rounded-md text-[11px] font-semibold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                isPriceQuickActive(pr.range)
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-300"
              )}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Durasi Hari */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Durasi Perjalanan
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDuration(d)}
              aria-pressed={duration === d}
              className={cn(
                "min-h-11 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                duration === d
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Maskapai */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Plane className="w-3.5 h-3.5 text-emerald-600" /> Maskapai
        </label>
        <div className="space-y-1">
          {AIRLINES.map((a) => (
            <label
              key={a}
              className={cn(
                "flex items-center gap-2.5 min-h-11 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:outline-none",
                airlines.includes(a)
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              )}
            >
              <input
                type="checkbox"
                name="airlines"
                checked={airlines.includes(a)}
                onChange={() => toggleAirline(a)}
                aria-label={a}
                className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded"
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      {/* Bintang Hotel */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Star className="w-3.5 h-3.5 text-emerald-600" /> Bintang Hotel
        </label>
        <div className="flex gap-2">
          {HOTEL_STARS.map((h) => (
            <button
              key={h.value}
              onClick={() => toggleStars(h.value)}
              aria-pressed={hotelStars === h.value}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 min-h-11 rounded-lg text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
                hotelStars === h.value
                  ? "bg-amber-400 border-amber-400 text-amber-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-300"
              )}
            >
              <Star className="w-3 h-3" />
              {h.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
