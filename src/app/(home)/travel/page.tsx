"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, BadgeCheck, Search, X, ArrowRight, Building2, Star } from "lucide-react"
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

type SortKey = "nama" | "paket"

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "T"
}

export default function TravelListPage() {
  const [travels, setTravels] = useState<TravelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>("nama")

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

  const filtered = useMemo(() => {
    let list = travels
    if (verifiedOnly) list = list.filter((t) => t.is_verified)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    if (sort === "paket") sorted.sort((a, b) => b.packages_count - a.packages_count)
    else sorted.sort((a, b) => a.name.localeCompare(b.name, "id"))
    return sorted
  }, [travels, searchQuery, verifiedOnly, sort])

  if (loading) {
    return (
      <main className="min-h-screen bg-ivory-50">
        <div className="bg-emerald-deep px-6 py-14">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="h-4 w-48 bg-ivory/20 rounded mx-auto animate-pulse" />
            <div className="h-9 bg-ivory/25 rounded max-w-md mx-auto animate-pulse" />
            <div className="h-14 bg-ivory-card rounded-2xl animate-pulse max-w-2xl mx-auto" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-ivory-card border border-ivory-border rounded-2xl p-5 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-ivory-border shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-ivory-border rounded w-40" />
                  <div className="h-3 bg-ivory-border rounded w-24" />
                  <div className="h-3 bg-ivory-border rounded w-full" />
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
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-emerald-deep/80" aria-hidden />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-3">
              Mitra resmi · Terdaftar PPIU
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ivory tracking-tight first-letter:uppercase">
              Travel Partner{" "}
              <span className="text-gold-light">
                UmrahQu
              </span>
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-ivory-card rounded-full border border-ivory-border flex items-center pl-4 pr-2 py-2">
              <Search className="w-5 h-5 text-emerald-dark shrink-0" />
              <input
                type="text"
                placeholder="Cari nama travel..."
                aria-label="Cari travel"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-sm text-ivory-ink focus:outline-none placeholder:text-ivory-ink/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-9 h-9 rounded-full hover:bg-ivory flex items-center justify-center text-ivory-ink/60 hover:text-emerald-dark shrink-0 transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative h-6 bg-ivory-50" aria-hidden />
      </section>

      {/* List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-ivory-ink/70">
            {filtered.length} travel ditemukan
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              aria-pressed={verifiedOnly}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                verifiedOnly
                  ? "bg-emerald-dark text-ivory border-emerald-dark"
                  : "bg-ivory-card text-emerald-dark border-ivory-border hover:border-emerald-dark/40"
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Terverifikasi saja
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Urutkan travel"
              className="px-3.5 py-2 rounded-full text-xs font-semibold bg-ivory-card text-emerald-dark border border-ivory-border focus:outline-none focus:border-emerald-dark/40 cursor-pointer"
            >
              <option value="nama">Nama A–Z</option>
              <option value="paket">Paket terbanyak</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-ivory-card border border-ivory-border rounded-3xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-ivory flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-emerald-dark" />
            </div>
            <p className="text-sm text-ivory-ink/70">Tidak ada travel yang cocok dengan filter ini.</p>
            <button
              onClick={() => { setSearchQuery(""); setVerifiedOnly(false) }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ivory bg-emerald-dark hover:bg-emerald-deep px-4 py-2 rounded-xl transition-colors"
            >
              Atur Ulang Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((travel) => (
              <Link
                key={travel.id}
                href={`/travel/${travel.slug}`}
                className={`group bg-ivory-card border rounded-2xl p-5 flex items-center gap-4 transition-colors ${
                  travel.is_featured
                    ? "border-gold/60 hover:border-gold"
                    : "border-ivory-border hover:border-emerald-dark/40"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-ivory border border-ivory-border overflow-hidden flex items-center justify-center">
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
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-dark text-gold flex items-center justify-center ring-2 ring-ivory-card">
                      <BadgeCheck className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-sm text-emerald-deep truncate">
                      {travel.name}
                    </h3>
                    {travel.is_featured && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-deep bg-gold px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" /> Unggulan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ivory-ink/70 mt-0.5">
                    {travel.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{travel.city}
                      </span>
                    )}
                    {travel.founded_year && <span>Sejak {travel.founded_year}</span>}
                  </div>
                  {travel.description ? (
                    <p className="text-xs text-ivory-ink/70 mt-1.5 leading-relaxed line-clamp-2">{travel.description}</p>
                  ) : (
                    <p className="text-xs text-ivory-ink/70 mt-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-dark" />
                      {travel.packages_count || 0} paket umrah
                    </p>
                  )}
                </div>
                <span className="shrink-0 w-10 h-10 rounded-full border border-ivory-border flex items-center justify-center text-emerald-dark group-hover:bg-emerald-dark group-hover:text-ivory group-hover:border-emerald-dark transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
