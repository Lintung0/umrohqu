"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { Search, Package, MapPin, Calendar } from "lucide-react"
import CityAutocomplete from "@/components/shared/city-autocomplete"

const MONTHS = [
  { value: "januari", label: "Jan" },
  { value: "februari", label: "Feb" },
  { value: "maret", label: "Mar" },
  { value: "april", label: "Apr" },
  { value: "mei", label: "Mei" },
  { value: "juni", label: "Jun" },
  { value: "juli", label: "Jul" },
  { value: "agustus", label: "Agu" },
  { value: "september", label: "Sep" },
  { value: "oktober", label: "Okt" },
  { value: "november", label: "Nov" },
  { value: "desember", label: "Des" },
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">

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
              placeholder="Cari nama paket atau travel..."
              className="w-full h-12 bg-white/15 border border-white/30 rounded-xl px-4 !text-white !placeholder:text-white/50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all"
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
              placeholder="Kota keberangkatan..."
              countryFilter={country}
              className="w-full h-12 bg-white/15 border border-white/30 rounded-xl px-4 !text-white !placeholder:text-white/50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all"
            />
          </div>

          {/* Bulan & Tahun — Combined */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
              <Calendar className="w-3 h-3" />
              Bulan & Tahun
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 h-12 bg-emerald-900/90 text-white font-semibold border border-white/30 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-emerald-950 text-white">Bulan</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-emerald-950 text-white">{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-24 h-12 bg-emerald-900/90 text-white font-semibold border border-white/30 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-emerald-950 text-white">Tahun</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value} className="bg-emerald-950 text-white">{y.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button — amber gold, perfectly centered */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full sm:w-auto h-12 px-5 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold rounded-xl shadow-lg shadow-amber-400/30 transition-all duration-200 active:scale-95 flex items-center justify-center hover:shadow-xl hover:shadow-amber-400/40 cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
