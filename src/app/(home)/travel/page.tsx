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

const BANNER_FLATS = [
  "bg-emerald-dark",
  "bg-emerald-deep",
  "bg-gold-dark",
  "bg-emerald-dark",
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
      <main className="min-h-screen bg-ivory-50">
        <div className="bg-emerald-deep px-6 py-16">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="h-7 bg-ivory/20 rounded-lg w-64 mx-auto animate-pulse" />
            <div className="h-4 bg-ivory/15 rounded w-96 mx-auto animate-pulse" />
            <div className="h-14 bg-ivory/30 rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-ivory-card border border-ivory-border rounded-2xl overflow-hidden animate-pulse">
                <div className={`h-20 ${BANNER_FLATS[i % BANNER_FLATS.length]} opacity-40`} />
                <div className="p-5 pt-3">
                  <div className="flex items-end gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-ivory-border border-4 border-ivory-card -mt-8" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-ivory-border rounded w-32" />
                      <div className="h-3 bg-ivory-border rounded w-24" />
                    </div>
                  </div>
                  <div className="h-3 bg-ivory-border rounded w-full mt-4" />
                  <div className="h-3 bg-ivory-border rounded w-2/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ivory-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-deep">
        {/* Makkah background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-emerald-deep/80" aria-hidden />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-glow/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />

        {/* Islamic star pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="travel-islamic-star" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,2 35,22 55,22 40,34 46,54 30,42 14,54 20,34 5,22 25,22" fill="none" stroke="#d4a017" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#travel-islamic-star)" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 text-[11px] font-semibold px-4 py-1.5 rounded-full backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mb-4">
              <Sparkles className="w-3 h-3 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
              Mitra Resmi UmrahQu
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ivory tracking-tight drop-shadow-lg">
              Travel Partner{" "}
              <span className="text-gold-light drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
                UmrahQu
              </span>
            </h1>
          </div>

          {/* Search bar glassmorphism */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-white/15 rounded-full blur-lg" aria-hidden />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[340px] h-24 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" aria-hidden />
            <div className="relative bg-ivory-card/95 backdrop-blur-xl rounded-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-ivory-border border border-ivory-border flex items-center pl-4 pr-2 py-2">
              <Search className="w-5 h-5 text-emerald-dark shrink-0" />
              <input
                type="text"
                placeholder="Cari nama travel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-sm text-ivory-ink focus:outline-none placeholder:text-ivory-ink/70"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-9 h-9 rounded-full hover:bg-ivory flex items-center justify-center text-ivory-ink/60 hover:text-emerald-dark shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Cari travel"]')?.focus()}
                  className="hidden sm:flex items-center gap-1.5 bg-emerald-dark text-ivory hover:bg-emerald-deep text-xs font-semibold h-10 px-5 rounded-full shadow-lg shadow-emerald-deep/30 transition-all active:scale-95 shrink-0"
                  aria-label="Cari travel"
                >
                  <Search className="w-3.5 h-3.5" /> Cari
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative h-6 bg-ivory-50" aria-hidden />
      </section>

      {/* List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-ivory-card border border-ivory-border rounded-3xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-ivory flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-emerald-dark" />
            </div>
            <p className="text-sm text-ivory-ink/70">Tidak ada travel yang cocok dengan filter ini.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ivory bg-emerald-dark hover:bg-emerald-deep px-4 py-2 rounded-xl transition-colors"
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
                className="group bg-ivory-card border border-ivory-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-deep/5 hover:border-gold/50 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Banner */}
                <div className={`relative h-20 ${BANNER_FLATS[idx % BANNER_FLATS.length]} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "18px 18px" }}
                    aria-hidden />
                  <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
                    <defs>
                      <pattern id={`travel-card-star-${idx}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <polygon points="20,2 23.5,14 35,14 25,22 29,34 20,27 11,34 15,22 5,14 16.5,14" fill="none" stroke="#fff" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#travel-card-star-${idx})`} />
                  </svg>
                  <div className="absolute inset-x-0 -bottom-6 flex justify-center" aria-hidden>
                    <div className="w-28 h-12 bg-white/20 rounded-full blur-xl" />
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 pt-0">
                  <div className="flex items-end gap-3">
                    <div className="relative shrink-0 -mt-8">
                      <div className="w-14 h-14 rounded-2xl bg-ivory-card border-4 border-ivory-card shadow-md overflow-hidden flex items-center justify-center">
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
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-dark text-ivory flex items-center justify-center ring-2 ring-ivory-card shadow-sm">
                          <BadgeCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <h3 className="font-bold text-sm text-emerald-deep group-hover:text-emerald-dark transition-colors truncate">
                        {travel.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-ivory-ink/70 mt-0.5">
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
                    <p className="text-xs text-ivory-ink/70 mt-3 leading-relaxed line-clamp-2">{travel.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-ivory-border">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ivory-ink/70">
                      <Package className="w-3.5 h-3.5 text-emerald-dark" />
                      {travel.packages_count || 0} paket umrah
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-dark group-hover:gap-1.5 transition-all">
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