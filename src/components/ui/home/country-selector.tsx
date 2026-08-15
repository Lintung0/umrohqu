"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useEffect } from "react"
import type { Tenant } from "@/lib/types"

const COUNTRY_FLAGS: Record<string, { flag: string; code: string }> = {
  Indonesia: { flag: "\ud83c\uddee\ud83c\uddf9", code: "id" },
  Malaysia: { flag: "\ud83c\uddf2\ud83c\uddfe", code: "my" },
  Singapura: { flag: "\ud83c\uddf8\ud83c\uddec", code: "sg" },
  UAE: { flag: "\ud83c\udde6\ud83c\uddea", code: "ae" },
  Pakistan: { flag: "\ud83c\uddf5\ud83c\uddf0", code: "pk" },
  Bangladesh: { flag: "\ud83c\udde7\ud83c\udde9", code: "bd" },
  "United Kingdom": { flag: "\ud83c\uddec\ud83c\udde7", code: "gb" },
  India: { flag: "\ud83c\uddee\ud83c\uddf3", code: "in" },
}

interface CountryCount {
  country: string
  count: number
}

export default function CountrySelector() {
  const [counts, setCounts] = useState<CountryCount[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tenants")
        .select("country")
        .eq("status", "active")
        .not("country", "is", null)

      if (data) {
        const map = new Map<string, number>()
        for (const row of data) {
          const c = row.country || "Indonesia"
          map.set(c, (map.get(c) || 0) + 1)
        }
        const arr = Array.from(map.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
        setCounts(arr)
      }
      setLoading(false)
    }
    load()
  }, [])

  const staticCountries = [
    { country: "Indonesia", count: 284 },
    { country: "Malaysia", count: 92 },
    { country: "Singapura", count: 34 },
    { country: "UAE", count: 61 },
    { country: "Pakistan", count: 118 },
    { country: "Bangladesh", count: 77 },
    { country: "United Kingdom", count: 29 },
    { country: "India", count: 203 },
  ]

  const display = counts.length > 0 ? counts : staticCountries

  return (
    <section className="py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              Pilih Negara Keberangkatan
            </h2>
            <p className="text-sm mt-1 text-muted-foreground">
              Temukan travel partner terpercaya di negara Anda
            </p>
          </div>
          <Link
            href="/travel"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {display.map((c) => {
            const meta = COUNTRY_FLAGS[c.country] || { flag: "\ud83c\uddf3\ud83c\uddf1", code: "id" }
            return (
              <button
                key={c.country}
                onClick={() => router.push(`/search?country=${encodeURIComponent(c.country)}`)}
                className="group rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 border border-transparent hover:border-primary/20 bg-white"
              >
                <div className="text-3xl mb-2">{meta.flag}</div>
                <div className="font-semibold text-xs mb-0.5 group-hover:text-primary transition-colors">
                  {c.country}
                </div>
                <div className="text-xs text-primary/70 font-medium">{c.count} Travel</div>
              </button>
            )
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Lihat Semua Negara <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
