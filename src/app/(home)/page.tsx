"use client"

import PackageSection from "@/components/ui/home/package-section"
import {
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  TrustSection,
} from "@/components/ui/home/extra-sections"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Calendar, Building2, ChevronDown } from "lucide-react"
import CityAutocomplete from "@/components/shared/city-autocomplete"
import { supabase } from "@/lib/supabase/client"

const MONTHS = [
  { value: "januari", label: "Januari 2026" },
  { value: "februari", label: "Februari 2026" },
  { value: "maret", label: "Maret 2026" },
  { value: "april", label: "April 2026" },
  { value: "mei", label: "Mei 2026" },
  { value: "juni", label: "Juni 2026" },
  { value: "juli", label: "Juli 2026" },
  { value: "agustus", label: "Agustus 2026" },
  { value: "september", label: "September 2026" },
  { value: "oktober", label: "Oktober 2026" },
  { value: "november", label: "November 2026" },
  { value: "desember", label: "Desember 2026" },
]

function HeroStats() {
  const [packages, setPackages] = useState<number | null>(null)
  const [travels, setTravels] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pkg, tnt] = await Promise.all([
        supabase.from("packages").select("id", { count: "exact", head: true }).in("status", ["active", "ongoing"]),
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
      ])
      if (!cancelled) {
        setPackages(pkg.count || 0)
        setTravels(tnt.count || 0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const items = [
    { value: travels, label: "Travel Mitra Terverifikasi" },
    { value: packages, label: "Paket Umrah Aktif" },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-8 sm:mt-10 text-xs text-ivory/85">
      {items.map((item) => (
        <span key={item.label} className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-ivory">{item.value === null ? "..." : item.value}</span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departureCity, setDepartureCity] = useState("")
  const [country] = useState("id")
  const [selectedMonth, setSelectedMonth] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("search", query)
    if (departureCity) params.set("departure", departureCity)
    if (selectedMonth) params.set("month", selectedMonth)
    router.push(`/search?${params.toString()}`)
  }

  const inputClass =
    "w-full h-11 pl-8 pr-2.5 bg-ivory-soft border border-ivory-border rounded-xl text-xs text-ivory-ink placeholder:text-ivory-ink/70 focus:bg-ivory-card focus:outline-none focus:ring-2 focus:ring-emerald-dark/30 focus:border-emerald-dark transition-all"

  return (
    <form onSubmit={handleSubmit} className="bg-ivory-card p-3.5 sm:p-4 rounded-3xl shadow-[0_20px_50px_-20px_rgba(10,31,22,0.55)] border border-ivory-border text-ivory-ink text-left max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-emerald-dark uppercase tracking-wider mb-1.5 px-1">Travel / Paket</label>
          <div className="relative group">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-dark transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari travel atau paket..."
              className={inputClass}
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-emerald-dark uppercase tracking-wider mb-1.5 px-1">Keberangkatan</label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota asal..."
            countryFilter={country}
            iconClassName="text-emerald-dark"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-emerald-dark uppercase tracking-wider mb-1.5 px-1">Waktu</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-dark pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer pr-7`}
            >
              <option value="">Semua Bulan</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-ivory-ink/50 pointer-events-none" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full h-11 bg-gold hover:bg-gold-dark text-emerald-deep font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer border border-emerald-deep/10"
            aria-label="Cari paket umrah"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari</span>
          </button>
        </div>
      </div>
    </form>
  )
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero — Makkah Background */}
      <section className="relative py-12 sm:py-16 flex items-center justify-center overflow-hidden border-b border-emerald-deep/40">
        {/* Makkah background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        {/* Warm dark overlay (emerald-deep base, DESIGN.md core) */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-deep/80 via-emerald-deep/70 to-emerald-deep/85 z-10" aria-hidden="true" />

        {/* Islamic star pattern — identity motif, kept faint */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none z-10" aria-hidden="true">
          <defs>
            <pattern id="islamic-star" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,2 35,22 55,22 40,34 46,54 30,42 14,54 20,34 5,22 25,22" fill="none" stroke="#D4A843" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-star)" />
        </svg>

        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center text-ivory">
          <p className="text-sm text-ivory/90 mb-5 font-medium">
            Marketplace Umrah Resmi PPIU Kemenhaj
          </p>

          <h1 className="relative whitespace-normal sm:whitespace-nowrap text-[clamp(24px,4.5vw,28px)] sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight mb-8 sm:mb-10 leading-[1.1]">
            Cari, Bandingkan &amp; Pesan{" "}
            <span className="text-gold-light">
              Paket Umrah
            </span>
          </h1>

          <HeroSearch />

          <HeroStats />
        </div>
      </section>

      <PackageSection />
      <WhyUsSection />
      <TravelAgenciesSection />
      <TrustSection />
      <TestimonialSection />
    </main>
  )
}
