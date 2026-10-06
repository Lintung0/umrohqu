"use client"

import { useState, useEffect, useRef } from "react"
import { RotateCcw, MapPin, Clock, Banknote, ChevronDown, SlidersHorizontal } from "lucide-react"
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
    <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-deep uppercase">
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-dark/10 text-emerald-dark">
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
        "min-h-10 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark/30",
        active
          ? "bg-emerald-dark border-emerald-dark text-ivory"
          : "bg-ivory border-ivory-border text-ivory-ink/70 hover:border-emerald-dark/40 hover:text-emerald-dark"
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
      <div className="bg-ivory-card rounded-2xl border border-ivory-border shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 bg-emerald-deep">
          <span className="inline-flex items-center gap-2 text-ivory text-sm font-bold">
            <SlidersHorizontal className="w-4 h-4 text-gold" /> Filter Pencarian
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-ivory/70 hover:text-ivory hover:underline flex items-center gap-1 cursor-pointer font-medium">
              <RotateCcw className="w-3 h-3" /> Atur Ulang
            </button>
          )}
        </div>

        <div className="divide-y divide-ivory-border px-4">

          {/* Kota Keberangkatan — Geoapify Autocomplete (Indonesia) */}
          <div className="py-4 space-y-3">
            <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />}>Kota Keberangkatan</SectionLabel>
            <CityAutocomplete
              value={departure}
              onChange={setDeparture}
              countryFilter="id"
              placeholder="Ketik nama kota..."
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-ivory-border bg-ivory-card shadow-sm text-sm text-ivory-ink placeholder:text-ivory-ink/60 focus:outline-none focus:ring-2 focus:ring-emerald-dark/20 focus:border-emerald-dark transition-all"
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
