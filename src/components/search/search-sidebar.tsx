"use client"

import { RotateCcw, MapPin, Clock, Banknote, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import CityAutocomplete from "@/components/shared/city-autocomplete"

interface SearchSidebarProps {
  departure: string
  setDeparture: (v: string) => void
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
    <div className="sticky top-36 max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-2 pb-10 custom-scrollbar">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="relative flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "16px 16px" }}
            aria-hidden="true" />
          <span className="relative inline-flex items-center gap-2 text-white text-sm font-bold">
            <SlidersHorizontal className="w-4 h-4 text-amber-300" /> Filter Pencarian
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="relative text-xs text-white/90 hover:text-white hover:underline flex items-center gap-1 cursor-pointer font-medium">
              <RotateCcw className="w-3 h-3" /> Atur Ulang
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 px-4">

          {/* Kota Keberangkatan — Geoapify Autocomplete (Indonesia) */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />}>Kota Keberangkatan</SectionLabel>
            <CityAutocomplete
              value={departure}
              onChange={setDeparture}
              countryFilter="id"
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
