"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { Search, Package, MapPin, Calendar } from "lucide-react"
import CityAutocomplete from "@/components/shared/city-autocomplete"
import { getAseanCountryByCode } from "@/lib/constants"

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

export default function SearchWidget() {
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
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-emerald-950/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 p-1">

          {/* Nama Paket / Travel */}
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
              <Package className="w-3 h-3" />
              Nama Paket / Travel
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Umroh Plus Turki..."
              className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 !text-white !placeholder:text-slate-100 placeholder:opacity-90 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all"
            />
          </div>

          {/* Kota Keberangkatan */}
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
              <MapPin className="w-3 h-3" />
              Kota Keberangkatan
            </label>
            <CityAutocomplete
              value={departureCity}
              onChange={setDepartureCity}
              placeholder="Contoh: Jakarta, Bandung..."
              countryFilter={country}
              className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 !text-white !placeholder:text-slate-100 placeholder:opacity-90 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all"
            />
          </div>

          {/* Bulan & Tahun */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
              <Calendar className="w-3 h-3" />
              {t.hero.month}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 bg-emerald-900/90 text-white font-semibold border border-white/30 rounded-xl h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-emerald-950 text-white">Bulan</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-emerald-950 text-white">{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-28 bg-emerald-900/90 text-white font-semibold border border-white/30 rounded-xl h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-emerald-950 text-white">Tahun</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value} className="bg-emerald-950 text-white">{y.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full sm:w-auto h-12 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold p-3.5 shadow-lg shadow-amber-400/30 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center hover:shadow-xl hover:shadow-amber-400/40"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
