"use client"

import { useState, useEffect, useRef } from "react"
import { X, RotateCcw, MapPin, Clock, Banknote, ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ASEAN_COUNTRIES } from "@/lib/constants"
import CityAutocomplete from "@/components/shared/city-autocomplete"

interface SearchSidebarProps {
  departure: string
  setDeparture: (v: string) => void
  country?: string
  setCountry?: (v: string) => void
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  duration: string
  setDuration: (v: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

const PRICE_RANGES: { label: string; range: [number, number] }[] = [
  { label: "10-25jt", range: [10000000, 25000000] },
  { label: "25-50jt", range: [25000000, 50000000] },
  { label: "50-100jt", range: [50000000, 100000000] },
  { label: ">100jt", range: [100000000, 500000000] },
]

const DURATION_OPTIONS = ["7-10 Hari", "10-14 Hari", "14-21 Hari"]

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
  hasActiveFilters, clearFilters,
}: SearchSidebarProps) {
  const toggleDuration = (d: string) => setDuration(duration === d ? "" : d)

  const isPriceQuickActive = (range: [number, number]) =>
    priceRange[0] === range[0] && priceRange[1] === range[1]

  const handlePriceQuick = (range: [number, number]) => {
    if (isPriceQuickActive(range)) setPriceRange([0, 500000000])
    else setPriceRange(range)
  }

  return (
    <div className="sticky top-36 max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-2 pb-10 custom-scrollbar space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Pencarian
        </span>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer">
            <RotateCcw className="w-3 h-3" /> Atur Ulang
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
        <CityAutocomplete
          value={departure}
          onChange={setDeparture}
          countryFilter={country}
          placeholder="Ketik nama kota..."
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Estimasi Harga
        </label>

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

    </div>
  )
}
