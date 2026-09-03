"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, BadgeCheck, Search, X, ArrowRight, Sparkles, Building2 } from "lucide-react"
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

const BANNER_GRADIENTS = [
  "from-emerald-800 via-emerald-700 to-emerald-600",
  "from-teal-800 via-teal-700 to-emerald-600",
  "from-emerald-900 via-emerald-700 to-teal-500",
  "from-teal-900 via-teal-700 to-emerald-500",
]

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "T"
}

export default function TravelListPage() {
  const [travels, setTravels] = useState<TravelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function load() {
      const { data: tenantRows, error } = await supabase
        .from("tenants")
        .select("id, slug, name, logo_url, description, founded_year, is_verified, is_featured")
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("is_verified", { ascending: false })

      if (error) {
        console.error("Error fetching travels:", error)
        if (!cancelled) setTravels([])
        if (!cancelled) setLoading(false)
        return
      }

      const rows = ((tenantRows as TravelRow[]) || []).map((t) => ({ ...t, packages_count: 0 }))

      const { data: pkgRows } = await supabase
        .from("packages")
        .select("tenant_id")
        .in("status", ["active", "ongoing"])

      if (!cancelled && pkgRows) {
        const counts = new Map<string, number>()
        ;(pkgRows as { tenant_id: string }[]).forEach((p) => {
          counts.set(p.tenant_id, (counts.get(p.tenant_id) || 0) + 1)
        })
        rows.forEach((r) => {
          r.packages_count = counts.get(r.id) || 0
        })
      }

      if (!cancelled) setTravels(rows)
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = travels.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-6 py-16">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="h-7 bg-white/20 rounded-lg w-64 mx-auto animate-pulse" />
            <div className="h-4 bg-white/15 rounded w-96 mx-auto animate-pulse" />
            <div className="h-14 bg-white/30 rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className={`h-20 bg-gradient-to-r ${BANNER_GRADIENTS[i % BANNER_GRADIENTS.length]} opacity-40`} />
                <div className="p-5 pt-3">
                  <div className="flex items-end gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200 border-4 border-white -mt-8" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-glow/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
          aria-hidden />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-emerald-50 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur mb-4">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Mitra Resmi UmrahQu
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Travel Partner UmrahQu
            </h1>
            <p className="text-emerald-100/80 text-sm sm:text-base mt-2 max-w-xl mx-auto">
              Temukan travel partner terpercaya untuk perjalanan umrah Anda — sudah kami kurasi dan verifikasi.
            </p>
          </div>

          {/* Search bar besar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur" aria-hidden />
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-emerald-950/30 flex items-center pl-4 pr-2 py-2">
              <Search className="w-5 h-5 text-emerald-700 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama travel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Cari travel"]')?.focus()}
                  className="hidden sm:flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-10 px-4 rounded-xl transition-colors shrink-0"
                  aria-label="Cari travel"
                >
                  <Search className="w-3.5 h-3.5" /> Cari
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative h-6 bg-gradient-to-b from-transparent to-gray-50" aria-hidden />
      </section>

      {/* List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500">Tidak ada travel yang cocok dengan filter ini.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
            >
              Atur Ulang Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((travel, idx) => (
              <Link
                key={travel.id}
                href={`/travel/${travel.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-100/60 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Banner */}
                <div className={`relative h-20 bg-gradient-to-r ${BANNER_GRADIENTS[idx % BANNER_GRADIENTS.length]} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "18px 18px" }}
                    aria-hidden />
                  <div className="absolute inset-x-0 -bottom-6 flex justify-center" aria-hidden>
                    <div className="w-28 h-12 bg-white/20 rounded-full blur-xl" />
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 pt-0">
                  <div className="flex items-end gap-3">
                    <div className="relative shrink-0 -mt-8">
                      <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                        <Image
                          src={travel.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials(travel.name))}&background=2A7D4F&color=fff&size=120&bold=true`}
                          alt={travel.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                      {travel.is_verified && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
                          <BadgeCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <h3 className="font-bold text-sm group-hover:text-emerald-700 transition-colors truncate">
                        {travel.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
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
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      {travel.packages_count || 0} paket umrah
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:gap-1.5 transition-all">
                      Lihat Paket <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}