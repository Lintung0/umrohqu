"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Package, BadgeCheck, Zap } from "lucide-react"
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

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("tenants")
      .select("id, slug, name, logo_url, city, description, founded_year, is_verified, is_featured, packages_count")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .then(({ data }) => {
        setTravels((data as TravelRow[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50">
        <div className="bg-white border-b border-border px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-6 bg-muted rounded animate-pulse w-64 mb-2" />
            <div className="h-4 bg-muted rounded animate-pulse w-48" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Client-side search
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTravels = travels.filter((travel) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      travel.name.toLowerCase().includes(query) ||
      travel.slug.toLowerCase().includes(query) ||
      travel.city?.toLowerCase().includes(query) ||
      travel.description?.toLowerCase().includes(query)
    )
  })

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Travel Partner UmrohQ</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredTravels.length} travel terpercaya • Semua terverifikasi Kementerian Agama
          </p>
          
          {/* Search Input */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Cari travel partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground hover:text-foreground transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Menampilkan {filteredTravels.length} dari {travels.length} travel
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {travels.map((travel) => (
            <Link
              key={travel.id}
              href={`/travel/${travel.id}`}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <Image
                    src={travel.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(travel.name)}&background=2A7D4F&color=fff&size=80&bold=true`}
                    alt={travel.name}
                    width={56}
                    height={56}
                    className="rounded-xl"
                  />
                  {travel.is_featured && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-amber-900" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {travel.name}
                    </h3>
                    {travel.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{travel.city}
                    </span>
                    {travel.founded_year && <span>Sejak {travel.founded_year}</span>}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed line-clamp-2">
                {travel.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  {travel.packages_count || 0} Paket Aktif
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
