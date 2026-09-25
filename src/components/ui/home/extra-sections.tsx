"use client"

import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { Star, Shield, Headphones, Award, Users, CheckCircle, ArrowRight, TrendingUp, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Tenant } from "@/lib/types"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import LogoMarquee from "@/components/shared/logo-marquee"

interface TestimonialItem {
  id: string
  name: string
  rating: number
  package: string
  comment: string
}

const EMPTY_TESTIMONIALS: TestimonialItem[] = []

export function WhyUsSection() {
  const { t } = useTranslation()

  const WHY_US = [
    {
      icon: Award,
      title: t.landing.why_us_compare_title,
      desc: t.landing.why_us_compare_desc,
    },
    {
      icon: Shield,
      title: t.landing.why_us_trusted_title,
      desc: t.landing.why_us_trusted_desc,
    },
    {
      icon: Headphones,
      title: t.landing.why_us_easy_title,
      desc: t.landing.why_us_easy_desc,
    },
  ]

  return (
    <section className="py-14 sm:py-16 px-4 sm:px-6 md:px-12 bg-ivory border-t border-ivory-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-dark">{t.landing.why_us_title}</h2>
          <div className="mt-3 h-1 w-14 rounded-full bg-gold" />
          <p className="text-ivory-ink/70 mt-4 text-sm max-w-xl leading-relaxed">{t.landing.why_us_desc}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {WHY_US.map((item) => (
            <div
              key={item.title}
              className="group flex gap-3.5 sm:gap-4 p-6 sm:p-7 rounded-2xl border transition-colors border-emerald-dark bg-emerald-dark text-ivory"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-ivory/10 text-gold-light">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] mb-1.5 text-ivory">{item.title}</h3>
                <p className="text-xs leading-relaxed text-ivory/70">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TravelAgenciesSection() {
  const { t } = useTranslation()
  const [agencies, setAgencies] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("tenants")
      .select("id, name, slug, logo_url, is_verified, is_featured")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        setAgencies((data as Tenant[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <section className="py-14 px-4 sm:px-6 md:px-12 bg-ivory-soft border-t border-ivory-border">
        <div className="max-w-7xl mx-auto">
          <div className="h-5 w-48 bg-ivory-border/60 rounded animate-pulse mb-6 mx-auto" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-36 bg-ivory-border/40 rounded-lg animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (agencies.length === 0) return null

  const marqueeItems = agencies.map((a) => ({
    name: a.name,
    logo: a.logo_url || undefined,
    slug: a.slug,
  }))

  return (
    <section className="py-14 sm:py-16 px-4 sm:px-6 md:px-12 overflow-hidden border-t border-ivory-border bg-ivory">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-dark">{t.landing.travel_section_title}</h2>
          </div>
          <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-dark hover:text-emerald-deep transition-colors group">
            Semua <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <LogoMarquee
          items={marqueeItems}
          speed="slow"
          pauseOnHover
        />
      </div>
    </section>
  )
}

export function TestimonialSection() {
  const { t } = useTranslation()
  const [testimonials, setTestimonials] = useState(EMPTY_TESTIMONIALS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("id, rating, review, created_at, customer_id, booking_id")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3)
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((r: any) => r.customer_id).filter(Boolean))]
          let nameMap: Record<string, string> = {}
          if (userIds.length > 0) {
            const { data: users } = await supabase.from("users").select("id, full_name").in("id", userIds)
            if (users) nameMap = Object.fromEntries(users.map((u: any) => [u.id, u.full_name]))
          }
          const bookingIds = [...new Set(data.map((r: any) => r.booking_id).filter(Boolean))]
          let pkgMap: Record<string, string> = {}
          if (bookingIds.length > 0) {
            const { data: bookings } = await supabase.from("bookings").select("id, package_id").in("id", bookingIds)
            const bookingToPkg = new Map<string, string>()
            ;(bookings || []).forEach((b: any) => { if (b.package_id) bookingToPkg.set(b.id, b.package_id) })
            const pkgIds = [...new Set((bookings || []).map((b: any) => b.package_id).filter(Boolean))]
            if (pkgIds.length > 0) {
              const { data: pkgs } = await supabase.from("packages").select("id, name").in("id", pkgIds)
              const rawPkgMap = new Map<string, string>()
              ;(pkgs || []).forEach((p: any) => rawPkgMap.set(p.id, p.name))
              bookingToPkg.forEach((pkgId, bid) => { pkgMap[bid] = rawPkgMap.get(pkgId) || "umrah" })
            }
          }
          const mapped = data.map((r: any) => ({
            id: r.id,
            name: r.customer_id ? (nameMap[r.customer_id] || "Pengguna") : "Pengguna",
            rating: r.rating,
            package: r.booking_id ? (pkgMap[r.booking_id] || "umrah") : "umrah",
            comment: r.review || "",
          }))
          setTestimonials(mapped.filter((x: TestimonialItem) => x.comment.trim().length > 0))
        }
      } catch {
        // keep empty on error
      } finally {
        setLoaded(true)
      }
    }
    loadTestimonials()
  }, [])

  if (!loaded) {
    return (
      <section className="py-14 sm:py-16 px-4 sm:px-6 md:px-12 bg-ivory-soft border-t border-ivory-border">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-64 bg-ivory-border/60 rounded animate-pulse mx-auto mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-ivory-border bg-ivory-card p-6 space-y-3">
                <div className="h-4 w-24 bg-ivory-border/50 rounded animate-pulse" />
                <div className="h-3 w-full bg-ivory-border/40 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-ivory-border/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) return null

  return (
    <section className="py-14 sm:py-16 px-4 sm:px-6 md:px-12 bg-ivory-soft border-t border-ivory-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-dark">{t.landing.testimonial_title}</h2>
          <div className="mt-3 mx-auto h-1 w-14 rounded-full bg-gold" />
          <p className="text-ivory-ink/70 mt-4 text-sm">{t.landing.testimonial_desc}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="flex flex-col gap-4 p-6 rounded-2xl border border-ivory-border bg-ivory-card"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <figcaption className="text-sm text-ivory-ink/80 leading-relaxed flex-1">
                “{item.comment}”
              </figcaption>
              <div className="flex items-center gap-3 pt-4 border-t border-ivory-border">
                <div
                  className="w-9 h-9 rounded-full bg-emerald-dark text-gold-light flex items-center justify-center text-sm font-semibold shrink-0"
                  aria-hidden="true"
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-dark">{item.name}</p>
                  <p className="text-xs text-ivory-ink/70">{item.package}</p>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TrustSection() {
  const [stats, setStats] = useState({ packages: 0, travels: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from("packages").select("id", { count: "exact", head: true }).in("status", ["active", "ongoing"]),
      supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]).then(([pkgs, tnts]) => {
      setStats({ packages: pkgs.count || 0, travels: tnts.count || 0 })
    })
  }, [])

  const items = [
    { icon: Lock, title: "Pembayaran Aman", desc: "Dana tersimpan hingga perjalanan terkonfirmasi" },
    { icon: Shield, title: "Travel Terverifikasi", desc: "Semua mitra terdaftar & berizin resmi Kemenhaj RI" },
    { icon: TrendingUp, title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi" },
    { icon: Users, title: `${stats.travels} Travel Mitra`, desc: `${stats.packages} paket tersedia saat ini` },
  ]

  return (
    <section className="py-12 px-4 sm:px-6 md:px-12 bg-ivory border-t border-ivory-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-5 rounded-2xl bg-ivory-card border border-ivory-border"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-ivory border border-ivory-border flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-gold-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-emerald-dark">{item.title}</h3>
                <p className="text-[11px] text-ivory-ink/70 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASection() {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden py-14 sm:py-16 px-4 sm:px-6 md:px-12 bg-emerald-deep">
      <div className="absolute inset-0 text-gold-light/40">
        <IslamicPattern opacity={0.04} />
      </div>
      <div className="relative max-w-3xl mx-auto text-center text-ivory">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight">{t.landing.cta_title}</h2>
        <p className="mt-3 text-ivory/60 text-sm leading-relaxed">{t.landing.cta_desc}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gold hover:bg-gold-dark text-emerald-deep font-bold rounded-xl transition-colors"
          >
            {t.landing.cta_button}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-ivory/20 text-ivory font-medium rounded-xl hover:bg-ivory/10 transition-colors"
          >
            {t.hero.search}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 text-xs text-ivory/50">
          {["Gratis daftar", "Tanpa biaya tambahan", "Pembayaran aman"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-gold-light/80" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface HomeStats {
  travelCount: number
  packageCount: number
  bookingCount: number
  avgRating: number
}

export function StatsSection() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<HomeStats>({ travelCount: 0, packageCount: 0, bookingCount: 0, avgRating: 0 })

  useEffect(() => {
    async function load() {
      const [tenantsRes, packagesRes, bookingsRes, reviewsRes] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("packages").select("id", { count: "exact", head: true }).in("status", ["active", "ongoing"]),
        supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["confirmed", "completed"]),
        supabase.from("reviews").select("rating").limit(100),
      ])
      const allRatings = reviewsRes.data || []
      const avg = allRatings.length > 0 ? allRatings.reduce((s: number, r: any) => s + (r.rating || 0), 0) / allRatings.length : 0
      setStats({
        travelCount: tenantsRes.count || 0,
        packageCount: packagesRes.count || 0,
        bookingCount: bookingsRes.count || 0,
        avgRating: allRatings.length > 0 ? Math.round(avg * 10) / 10 : 0,
      })
    }
    load()
  }, [])

  const displayStats = [
    { value: `${stats.travelCount}`, label: t.landing.stats_travels },
    { value: `${stats.packageCount}`, label: t.landing.stats_packages },
    { value: `${stats.bookingCount}`, label: t.landing.stats_customers },
    { value: stats.avgRating > 0 ? `${stats.avgRating}★` : null, label: t.landing.stats_cities },
  ].filter((s) => s.value !== null)

  return (
    <section className="relative overflow-hidden py-14 px-4 sm:px-6 bg-emerald-deep">
      <div className="absolute inset-0 text-gold-light/40">
        <IslamicPattern opacity={0.04} />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-ivory tracking-tight">{t.landing.stats_title}</h2>
          <div className="mt-3 mx-auto h-1 w-14 rounded-full bg-gold" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {displayStats.map((s) => (
            <div key={s.label} className="space-y-1.5">
              <div className="text-3xl md:text-4xl font-bold text-gold-light tracking-tight">{s.value}</div>
              <div className="text-sm text-ivory/60 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
