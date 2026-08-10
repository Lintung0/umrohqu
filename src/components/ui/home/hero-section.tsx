"use client"

import { useTranslation } from "@/lib/i18n"
import { IslamicCorner } from "@/components/ui/islamic-pattern"
import dynamic from "next/dynamic"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, MapPin, Calendar, ChevronDown } from "lucide-react"
import CityAutocomplete from "@/components/shared/city-autocomplete"

const Kaaba3D = dynamic(() => import("./kaaba-3d"), { ssr: false })

const MONTHS = [
  { value: "januari", label: "Januari" },
  { value: "februari", label: "Februari" },
  { value: "maret", label: "Maret" },
  { value: "april", label: "April" },
  { value: "mei", label: "Mei" },
  { value: "juni", label: "Juni" },
  { value: "juli", label: "Juli" },
  { value: "agustus", label: "Agustus" },
  { value: "september", label: "September" },
  { value: "oktober", label: "Oktober" },
  { value: "november", label: "November" },
  { value: "desember", label: "Desember" },
]

const YEARS = Array.from({ length: 3 }, (_, i) => {
  const year = new Date().getFullYear() + i
  return { value: String(year), label: String(year) }
})

export default function HeroSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departureCity, setDepartureCity] = useState("")
  const [country, setCountry] = useState("id")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/user/country")
        const data = await res.json()
        if (data.country) setCountry(data.country)
      } catch {}
    }
    fetchCountry()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("search", query)
    if (departureCity) params.set("departure", departureCity)
    if (selectedMonth && selectedYear) {
      params.set("month", `${selectedMonth} ${selectedYear}`)
    } else if (selectedMonth) {
      params.set("month", selectedMonth)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-kaabah.jpg')" }}
        aria-hidden="true"
      />

      {/* Dark cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-emerald-950/70 to-slate-900/60 z-0" />

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 text-white/10 z-10">
        <IslamicCorner position="top-left" />
      </div>
      <div className="absolute top-0 right-0 text-white/10 z-10">
        <IslamicCorner position="top-right" />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-amber-400/6 rounded-full blur-3xl animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left — Text */}
          <div className="space-y-6">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-medium tracking-wide backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Layanan Umroh & Haji Terpercaya
              </span>
            </div>

            <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              {t.hero.title}
            </h1>

            <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-white/70 font-medium max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="animate-fade-in-up-delay-3 flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.9/5 Rating</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="text-white/60 text-sm">{t.hero.customers}</div>
              <div className="w-px h-4 bg-white/20" />
              <div className="text-white/60 text-sm">{t.hero.travel_partners}</div>
            </div>
          </div>

          {/* Right — 3D Kaaba */}
          <div className="hidden lg:block animate-fade-in-up-delay-2">
            <div className="w-full h-[400px]">
              <Kaaba3D />
            </div>
          </div>
        </div>

        {/* Search Widget — Floating white card */}
        <div className="mt-12 animate-fade-in-up-delay-4">
          <div className="relative z-10 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">

              {/* Nama Paket / Travel */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                  <Package className="w-3 h-3 text-emerald-600" />
                  Nama Paket / Travel
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama paket atau travel..."
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Kota Keberangkatan */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  Kota Keberangkatan
                </label>
                <CityAutocomplete
                  value={departureCity}
                  onChange={setDepartureCity}
                  placeholder="Kota keberangkatan..."
                  countryFilter={country}
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-gray-800 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Bulan & Tahun */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  Bulan & Tahun
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Bulan</option>
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative w-24">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Tahun</option>
                      {YEARS.map((y) => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-600/30 cursor-pointer"
                  aria-label="Cari paket umroh"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Cari</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  )
}
