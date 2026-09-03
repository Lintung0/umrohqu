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
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/40 border border-white/20 text-gray-800 text-left max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-bold text-emerald-900/50 uppercase tracking-wider mb-1.5 px-1">Travel / Paket</label>
          <div className="relative group">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors group-focus-within:text-emerald-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari travel atau paket..."
              className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all group-focus-within:bg-white"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-emerald-900/50 uppercase tracking-wider mb-1.5 px-1">Keberangkatan</label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota asal..."
            countryFilter={country}
            iconClassName="text-emerald-500"
            className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-emerald-900/50 uppercase tracking-wider mb-1.5 px-1">Waktu</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-8 pr-7 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
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
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-medium mb-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <span>Marketplace Umrah Resmi PPIU Kemenhaj</span>
          </div>

          <div className="relative">
            {/* Ambient gold glow behind the headline */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[520px] h-[220px] rounded-full bg-amber-400/20 blur-[110px] pointer-events-none" aria-hidden="true" />
            <h1 className="relative text-2xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight mb-12 leading-none drop-shadow-lg whitespace-nowrap">
              Cari, Bandingkan &amp; Pesan{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
                Paket Umrah
              </span>
            </h1>
          </div>

          <HeroSearch />

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-emerald-100/70">
            <span className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>200+ PPIU Resmi</span>
            <span className="w-px h-3 bg-emerald-500/40" />
            <span className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" /></span>500+ Paket Umroh</span>
            <span className="w-px h-3 bg-emerald-500/40" />
            <span className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>50.000+ Jamaah</span>
          </div>
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
