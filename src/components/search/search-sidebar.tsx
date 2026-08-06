"use client"

import { X, RotateCcw, MapPin, Plane, Star, Clock, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSidebarProps {
  departure: string
  setDeparture: (v: string) => void
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  duration: string
  setDuration: (v: string) => void
  airline: string
  setAirline: (v: string) => void
  hotelStars: string
  setHotelStars: (v: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

const POPULAR_CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Makassar", "Yogyakarta"]

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

export default function SearchSidebar({
  departure, setDeparture,
  priceRange, setPriceRange,
  duration, setDuration,
  airline, setAirline,
  hotelStars, setHotelStars,
  hasActiveFilters, clearFilters,
}: SearchSidebarProps) {
  const toggleCity = (city: string) => {
    setDeparture(departure === city ? "" : city)
  }

  const toggleDuration = (d: string) => {
    setDuration(duration === d ? "" : d)
  }

  const toggleAirline = (a: string) => {
    setAirline(airline === a ? "" : a)
  }

  const toggleStars = (s: string) => {
    setHotelStars(hotelStars === s ? "" : s)
  }

  const isPriceQuickActive = (range: [number, number]) => {
    return priceRange[0] === range[0] && priceRange[1] === range[1]
  }

  const handlePriceQuick = (range: [number, number]) => {
    if (isPriceQuickActive(range)) {
      setPriceRange([10000000, 500000000])
    } else {
      setPriceRange(range)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-24 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900">Filter Pencarian</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer">
            <RotateCcw className="w-3 h-3" /> Reset All
          </button>
        )}
      </div>

      {/* Kota Keberangkatan */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <MapPin className="w-3 h-3" /> Kota Keberangkatan
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => toggleCity(city)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                departure === city
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Banknote className="w-3 h-3" /> Estimasi Harga
        </label>

        {/* Range Slider */}
        <div className="px-1">
          <input
            type="range"
            min={10000000}
            max={500000000}
            step={5000000}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Rp 10jt</span>
            <span className="font-semibold text-emerald-700 text-xs">
              Rp {formatPriceShort(priceRange[0])} – {formatPriceShort(priceRange[1])}
            </span>
            <span>Rp 500jt</span>
          </div>
        </div>

        {/* Quick Pills */}
        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((pr) => (
            <button
              key={pr.label}
              onClick={() => handlePriceQuick(pr.range)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer",
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
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Clock className="w-3 h-3" /> Durasi Perjalanan
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDuration(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
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
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Plane className="w-3 h-3" /> Maskapai
        </label>
        <div className="space-y-1.5">
          {AIRLINES.map((a) => (
            <label
              key={a}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all",
                airline === a
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              )}
            >
              <input
                type="radio"
                name="airline"
                checked={airline === a}
                onChange={() => toggleAirline(a)}
                className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600"
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      {/* Bintang Hotel */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Star className="w-3 h-3" /> Bintang Hotel
        </label>
        <div className="flex gap-2">
          {HOTEL_STARS.map((h) => (
            <button
              key={h.value}
              onClick={() => toggleStars(h.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
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
