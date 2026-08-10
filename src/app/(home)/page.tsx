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
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20 text-gray-800 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        {/* Nama Paket */}
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
            Nama Paket / Travel
          </label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari paket atau travel..."
              className="w-full pl-8 pr-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Keberangkatan */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
            Keberangkatan
          </label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota asal..."
            countryFilter={country}
            className="w-full pl-8 pr-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Waktu */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
            Waktu Keberangkatan
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Bulan Keberangkatan</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full h-[34px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
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
      {/* Compact Hero */}
      <section className="relative py-10 sm:py-14 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white overflow-hidden border-b border-emerald-800/40">
        {/* Islamic dot pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true" />

        {/* Soft gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

        {/* Mosque silhouette left */}
        <svg className="absolute -left-10 bottom-0 h-40 sm:h-56 w-auto opacity-15 pointer-events-none fill-emerald-400" viewBox="0 0 500 300" aria-hidden="true">
          <path d="M150 100 Q 200 20 250 100 L 250 300 L 150 300 Z M50 150 Q 80 80 110 150 L 110 300 L 50 300 Z M290 150 Q 320 80 350 150 L 350 300 L 290 300 Z" />
          <rect x="235" y="0" width="3" height="30" />
          <circle cx="236.5" cy="0" r="6" />
        </svg>

        {/* Ka'bah & minaret right */}
        <svg className="absolute -right-10 bottom-0 h-44 sm:h-60 w-auto opacity-15 pointer-events-none fill-amber-400" viewBox="0 0 400 300" aria-hidden="true">
          <rect x="150" y="120" width="120" height="180" rx="4" />
          <rect x="150" y="140" width="120" height="8" />
          <rect x="50" y="40" width="16" height="260" />
          <polygon points="50,40 58,10 66,40" />
        </svg>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Platform Marketplace Umrah Resmi PPIU Kemenag</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 drop-shadow">
            Cari & Bandingkan <span className="text-amber-400">Paket Umroh Impian</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl mx-auto mb-6">
            Pilihan paket terpercaya dari berbagai travel partner resmi di seluruh Indonesia
          </p>
          <HeroSearch />
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
