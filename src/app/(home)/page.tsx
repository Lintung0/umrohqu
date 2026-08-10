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
import { Search, MapPin, Calendar, Building2, ChevronDown, Sparkles, ShieldCheck, Star } from "lucide-react"
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
    <form onSubmit={handleSubmit} className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-gray-100 text-gray-800">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Travel / Paket</label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari travel..."
              className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Keberangkatan</label>
          <CityAutocomplete
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Kota..."
            countryFilter={country}
            className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bulan</label>
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
      {/* Hero — Modern Split Layout */}
      <section className="relative bg-slate-950 text-white overflow-hidden border-b border-emerald-900/30">
        {/* Radial ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_80%_70%_at_50%_-20%,rgba(5,150,105,0.3),rgba(255,255,255,0))] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* LEFT: Copywriting + Search */}
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Marketplace Umrah & Haji Terpercaya #1</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
                Bandingkan Paket Umroh <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  Resmi & Transparan
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl mb-8 leading-relaxed">
                Temukan penawaran terbaik dari puluhan travel partner resmi PPIU Kemenag RI dalam satu platform mudah.
              </p>

              <HeroSearch />
            </div>

            {/* RIGHT: Floating Visual Cards */}
            <div className="lg:col-span-5 relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-[340px]">
                {/* Main card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl hover:rotate-1 transition-transform duration-500">
                  <div className="h-44 w-full relative overflow-hidden bg-slate-800">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: "url('/images/hero-kaabah.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md shadow">
                      Paling Dicari
                    </div>
                  </div>
                  <div className="p-4 text-left">
                    <div className="text-xs font-semibold text-emerald-400 mb-1">Umrah VIP 9 Hari</div>
                    <h4 className="font-bold text-white text-sm mb-2">Hotel Bintang 5 Makkah + Madinah</h4>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-xs text-gray-400">Mulai dari</span>
                      <span className="text-base font-extrabold text-amber-400">Rp 32.500.000</span>
                    </div>
                  </div>
                </div>

                {/* Floating badge top-left */}
                <div className="absolute -top-5 -left-6 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 flex items-center gap-2.5 text-gray-800">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">4.9 / 5.0</div>
                    <div className="text-[10px] text-gray-500">2,500+ Jamaah Puas</div>
                  </div>
                </div>

                {/* Floating badge bottom-right */}
                <div className="absolute -bottom-5 -right-4 bg-emerald-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-emerald-700/50 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Resmi PPIU</div>
                    <div className="text-[10px] text-emerald-200/80">Terverifikasi Kemenag</div>
                  </div>
                </div>
              </div>
            </div>

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
