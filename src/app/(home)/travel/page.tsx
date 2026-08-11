"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, BadgeCheck, Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TravelRow {
  id: string
  slug: string
  name: string
  logo_url: string | null
  city: string | null
  description: string | null
  founded_year: string | null
  is_verified: boolean
  is_featured: boolean
  packages_count: number
}

export default function TravelListPage() {
  const [travels, setTravels] = useState<TravelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("semua")
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("tenants")
      .select("id, slug, name, logo_url, city, description, founded_year, is_verified, is_featured, packages_count")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("is_verified", { ascending: false })
      .then(({ data }) => {
        setTravels((data as TravelRow[]) || [])
        setLoading(false)
      })
  }, [])

  const cities = ["semua", ...Array.from(new Set(travels.map((t) => t.city).filter(Boolean) as string[])).sort()]

  const filtered = travels.filter((t) => {
    if (verifiedOnly && !t.is_verified) return false
    if (cityFilter !== "semua" && t.city !== cityFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-56 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Travel Partner UmrahQu</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} travel ditemukan
            {verifiedOnly ? " · Terverifikasi Kemenag RI" : ""}
          </p>

          {/* Search + Filters */}
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City filter */}
            <div className="flex gap-1.5 flex-wrap">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    cityFilter === city
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"
                  }`}
                >
                  {city === "semua" ? "Semua Kota" : city}
                </button>
              ))}
            </div>

            {/* Verified toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                verifiedOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300"
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Terverifikasi
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Tidak ada travel yang cocok dengan filter ini.</p>
            <button
              onClick={() => { setSearchQuery(""); setCityFilter("semua"); setVerifiedOnly(false) }}
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((travel) => (
              <Link
                key={travel.id}
                href={`/travel/${travel.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Image
                      src={travel.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(travel.name)}&background=2A7D4F&color=fff&size=80&bold=true`}
                      alt={travel.name}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover"
                      unoptimized
                    />
                    {travel.is_featured && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-bold text-amber-900">★</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-semibold text-sm group-hover:text-emerald-700 transition-colors truncate">
                        {travel.name}
                      </h3>
                      {travel.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {travel.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{travel.city}
                        </span>
                      )}
                      {travel.founded_year && <span>Sejak {travel.founded_year}</span>}
                    </div>
                  </div>
                </div>

                {travel.description && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">{travel.description}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    {travel.packages_count || 0} paket
                  </div>
                  {travel.is_verified ? (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Terverifikasi</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Belum verifikasi</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
