"use client"

import PackageSection from "@/components/ui/home/package-section"
import { IslamicWidgets } from "@/components/ui/islamic-widgets"
import {
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  TrustSection,
} from "@/components/ui/home/extra-sections"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Calendar, Building2, ChevronDown, Sparkles } from "lucide-react"
import CityAutocomplete from "@/components/shared/city-autocomplete"

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

function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departureCity, setDepartureCity] = useState("")
  const [country, setCountry] = useState("id")
  const [selectedMonth, setSelectedMonth] = useState("")

  useEffect(() => {
    fetch("/api/user/country").then(r => r.json()).then(d => { if (d.country) setCountry(d.country) }).catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("search", query)
    if (departureCity) params.set("departure", departureCity)
    if (selectedMonth) params.set("month", selectedMonth)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-gray-100 text-gray-800 text-left max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Travel / Paket</label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari travel atau paket..."
              className="w-full pl-8 pr-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Keberangkatan</label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota asal..."
            countryFilter={country}
            className="w-full pl-8 pr-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Waktu</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Bulan</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full h-[38px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            aria-label="Cari paket umroh"
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
      <section className="relative py-12 sm:py-16 flex items-center justify-center overflow-hidden border-b border-emerald-900/30">
        {/* Makkah background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-emerald-950/75 to-slate-950/80 z-10" aria-hidden="true" />

        {/* Islamic star pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none z-10" aria-hidden="true">
          <defs>
            <pattern id="islamic-star" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,2 35,22 55,22 40,34 46,54 30,42 14,54 20,34 5,22 25,22" fill="none" stroke="#d4a017" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-star)" />
        </svg>

        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Platform Marketplace Umrah & Haji Terpercaya #1</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight drop-shadow-lg">
            Bandingkan Paket Umroh{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Resmi & Transparan
            </span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl mx-auto mb-8 leading-relaxed">
            Temukan penawaran terbaik dari puluhan travel partner resmi PPIU Kemenag RI dalam satu platform mudah.
          </p>

          <HeroSearch />

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-emerald-200/60">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />200+ Travel Partner</span>
            <span className="w-px h-3 bg-emerald-700" />
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />500+ Paket Umroh</span>
            <span className="w-px h-3 bg-emerald-700" />
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />50.000+ Jamaah</span>
          </div>
        </div>
      </section>

      <PackageSection />
      <IslamicWidgets />
      <WhyUsSection />
      <TravelAgenciesSection />
      <TrustSection />
      <TestimonialSection />
    </main>
  )
}
