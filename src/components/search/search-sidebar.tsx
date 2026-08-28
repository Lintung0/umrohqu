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

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-700 uppercase">
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      {children}
    </label>
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
        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm hover:border-emerald-300 hover:shadow transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{selected?.emoji || "🌏"}</span>
          <span className={cn("font-medium", !selected && "text-slate-400")}>{selected?.name || "Semua Negara"}</span>
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

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        active
          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 border-transparent text-white shadow-md shadow-emerald-600/20"
          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
      )}
    >
      {children}
    </button>
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
    <div className="sticky top-36 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500">
          <span className="inline-flex items-center gap-2 text-white text-sm font-bold">
            <SlidersHorizontal className="w-4 h-4" /> Filter Pencarian
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-white/90 hover:text-white hover:underline flex items-center gap-1 cursor-pointer font-medium">
              <RotateCcw className="w-3 h-3" /> Atur Ulang
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 px-4">

          {/* Negara */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />}>Negara</SectionLabel>
            <CountrySelectFilter value={country} onChange={setCountry} />
          </div>

          {/* Kota Keberangkatan — Geoapify Autocomplete */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />}>Kota Keberangkatan</SectionLabel>
            <CityAutocomplete
              value={departure}
              onChange={setDeparture}
              countryFilter={country}
              placeholder="Ketik nama kota..."
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Price Range */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<Banknote className="w-3.5 h-3.5" />}>Estimasi Harga</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((pr) => (
                <Pill key={pr.label} active={isPriceQuickActive(pr.range)} onClick={() => handlePriceQuick(pr.range)}>
                  {pr.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Durasi Hari */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<Clock className="w-3.5 h-3.5" />}>Durasi Perjalanan</SectionLabel>
            <div className="flex flex-col gap-2">
              {DURATION_OPTIONS.map((d) => (
                <Pill key={d} active={duration === d} onClick={() => toggleDuration(d)}>
                  {d}
                </Pill>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
