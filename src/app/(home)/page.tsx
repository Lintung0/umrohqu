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
import { Search, MapPin, Calendar, Building2, ChevronDown } from "lucide-react"
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
      <section className="relative py-8 sm:py-12 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white overflow-hidden border-b border-emerald-800/40">
        {/* Subtle Islamic dot pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Cari & Bandingkan <span className="text-amber-400">Paket Umroh Resmi</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl mx-auto mb-6">
            Pilihan paket terpercaya dari berbagai PPIU resmi Kemenag RI
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
