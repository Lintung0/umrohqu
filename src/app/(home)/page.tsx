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
import { Search, MapPin, Calendar, Building2, Sparkles, ChevronDown } from "lucide-react"
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
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-white/20 text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Nama Paket */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
            Nama Paket / Travel
          </label>
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 absolute left-3 text-emerald-600 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari paket atau travel..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Keberangkatan */}
        <div className="md:col-span-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
            Kota Keberangkatan
          </label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota asal..."
            countryFilter={country}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Bulan */}
        <div className="md:col-span-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
            Waktu Keberangkatan
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Pilih Bulan</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            aria-label="Cari paket umroh"
          >
            <Search className="w-4 h-4" />
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
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden py-20">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: "url('/images/hero-kaabah.jpg')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-slate-950/75 to-emerald-950/80 z-10" />

        {/* Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white w-full">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Platform Bandingkan Paket Umrah Resmi Kemenag</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg leading-tight">
            Temukan Paket Umroh <span className="text-amber-400">Impian Anda</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto mb-10 drop-shadow leading-relaxed">
            Bandingkan ratusan paket umroh resmi dari berbagai travel partner terpercaya di seluruh Indonesia
          </p>

          {/* Glassmorphism Search */}
          <div className="-mb-16 sm:-mb-20">
            <HeroSearch />
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
