"use client"

import { useTranslation } from "@/lib/i18n"
import Image from "next/image"
import Link from "next/link"
import { Star, Shield, Headphones, Award, Users, CheckCircle, ArrowRight, TrendingUp, BadgeCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Tenant } from "@/lib/types"
import { IslamicPattern } from "@/components/ui/islamic-pattern"

const FALLBACK_TESTIMONIALS = [
  {
    id: "t-1",
    name: "Hj. Siti Rahayu",
    city: "Jakarta",
    avatar: "https://ui-avatars.com/api/?name=Siti+Rahayu&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "Umroh Reguler 12 Hari",
    comment:
      "Alhamdulillah, perjalanan umroh kami sangat lancar. Pelayanan dari awal booking sampai kepulangan sangat memuaskan. Sangat direkomendasikan!",
  },
  {
    id: "t-2",
    name: "Bpk. Agus Santoso",
    city: "Surabaya",
    avatar: "https://ui-avatars.com/api/?name=Agus+Santoso&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "VIP Umroh Plus Turki",
    comment:
      "Paket VIP benar-benar worth it. Hotel bintang 5 dekat Masjidil Haram, muthawwif berpengalaman, dan semua fasilitas sangat terjaga.",
  },
  {
    id: "t-3",
    name: "Ibu Fatimah Noor",
    city: "Bandung",
    avatar: "https://ui-avatars.com/api/?name=Fatimah+Noor&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "Hemat Umroh Muharram",
    comment:
      "Harga terjangkau tapi kualitasnya tidak murahan. Booking mudah, pembayaran aman, dan status perjalanan bisa dipantau real-time. Subhanallah.",
  },
]

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
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "verified"),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["confirmed", "completed"]),
        supabase.from("reviews").select("rating").limit(100),
      ])

      const allRatings = reviewsRes.data || []
      const avg = allRatings.length > 0 ? allRatings.reduce((s: number, r: any) => s + (r.rating || 0), 0) / allRatings.length : 4.9

      setStats({
        travelCount: tenantsRes.count || 0,
        packageCount: packagesRes.count || 0,
        bookingCount: bookingsRes.count || 0,
        avgRating: Math.round(avg * 10) / 10,
      })
    }
    load()
  }, [])

  const displayStats = [
    { value: stats.travelCount > 0 ? `${stats.travelCount}+` : "0", label: t.landing.stats_travels },
    { value: stats.packageCount > 0 ? `${stats.packageCount}+` : "0", label: t.landing.stats_packages },
    { value: stats.bookingCount > 0 ? `${stats.bookingCount}+` : "0", label: t.landing.stats_customers },
    { value: stats.avgRating > 0 ? `${stats.avgRating}★` : "4.9★", label: t.landing.stats_cities },
  ]

  return (
    <section className="relative overflow-hidden py-14 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-glow/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {t.landing.stats_title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {displayStats.map((s) => (
          <div key={s.label} className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</div>
            <div className="text-sm text-white/60 font-medium">{s.label}</div>
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}

export function WhyUsSection() {
  const { t } = useTranslation()

  const WHY_US = [
    {
      icon: Award,
      title: t.landing.why_us_compare_title,
      desc: t.landing.why_us_compare_desc,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
    },
    {
      icon: Shield,
      title: t.landing.why_us_trusted_title,
      desc: t.landing.why_us_trusted_desc,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
    },
    {
      icon: Headphones,
      title: t.landing.why_us_easy_title,
      desc: t.landing.why_us_easy_desc,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
    },
  ]

  return (
    <section className="relative py-20 px-6 md:px-12 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 text-primary/5">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold">
            Keunggulan Kami
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.landing.why_us_title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            {t.landing.why_us_desc}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_US.map((item, index) => (
            <div
              key={item.title}
              className="group relative flex flex-col items-start gap-5 p-7 rounded-2xl border border-border/60 bg-white hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className="size-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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
      .select("*")
      .eq("status", "verified")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
      .then(async ({ data }) => {
        const ags = (data as Tenant[]) || []
        if (ags.length > 0) {
          const tenantIds = ags.map((a) => a.id)
          const { data: pkgs } = await supabase.from("packages").select("id, tenant_id").in("tenant_id", tenantIds)
          const pkgIds = (pkgs || []).map((p: any) => p.id)
          if (pkgIds.length > 0) {
            const { data: revs } = await supabase.from("reviews").select("package_id, rating").in("package_id", pkgIds)
            const ratingMap = new Map<string, { sum: number; count: number }>()
            ;(pkgs || []).forEach((p: any) => {
              const pkgReviews = (revs || []).filter((r: any) => r.package_id === p.id)
              const existing = ratingMap.get(p.tenant_id) || { sum: 0, count: 0 }
              pkgReviews.forEach((r: any) => { existing.sum += r.rating; existing.count += 1 })
              ratingMap.set(p.tenant_id, existing)
            })
            ags.forEach((a: any) => {
              const r = ratingMap.get(a.id)
              a.avg_rating = r && r.count > 0 ? Math.round((r.sum / r.count) * 10) / 10 : null
            })
          }
        }
        setAgencies(ags)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <section className="py-16 px-6 md:px-12 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-8 w-64 bg-muted rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (agencies.length === 0) return null

  return (
    <section className="py-16 px-6 md:px-12 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold">
            <Shield className="w-3 h-3" />
            Terverifikasi
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.landing.travel_section_title}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {t.landing.travel_section_desc}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/travel/${agency.slug}`}
              className="group flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-white hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              {agency.logo_url ? (
                <Image
                  src={agency.logo_url}
                  alt={agency.name}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{agency.name.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {agency.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  {(agency as any).avg_rating ? (
                    <>
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-xs text-muted-foreground">{(agency as any).avg_rating}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Baru</span>
                  )}
                  {agency.is_verified && (
                    <BadgeCheck className="w-3 h-3 text-primary ml-0.5" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/travel"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group/link"
          >
            {t.common.view_all}
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function TestimonialSection() {
  const { t } = useTranslation()
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS)

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("id, rating, review, created_at, customer:users(full_name), package:packages(name)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3)
        if (data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: r.id,
            name: r.customer?.full_name || "Pengguna",
            city: "Indonesia",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customer?.full_name || "U")}&background=E8F5EE&color=2A7D4F&size=80&bold=true`,
            rating: r.rating,
            package: r.package?.name || "Umroh",
            comment: r.review || "Paket bagus, pelayanan memuaskan!",
          }))
          setTestimonials(mapped)
        }
      } catch {
        // reviews table may have column mismatch — safe to ignore
      }
    }
    loadTestimonials()
  }, [])

  return (
    <section className="relative py-20 px-6 md:px-12 overflow-hidden">
      <div className="absolute bottom-0 left-0 text-primary/5">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold-dark text-xs font-semibold">
            Testimoni
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.landing.testimonial_title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t.landing.testimonial_desc}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-white hover:shadow-xl hover:shadow-gold/5 hover:border-gold/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-3 -left-1 text-5xl text-gold/15 font-serif leading-none select-none">
                &ldquo;
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 relative z-10">
                &ldquo;{item.comment}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <Image
                  src={item.avatar}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-gold/20"
                />
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.city} &middot; {item.package}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TrustSection() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ packages: 0, travels: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from("packages").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "verified"),
    ]).then(([pkgs, tnts]) => {
      setStats({ packages: pkgs.count || 0, travels: tnts.count || 0 })
    })
  }, [])

  const items = [
    { icon: Shield, title: "Transaksi Aman", desc: "Dana escrow terjamin" },
    { icon: Award, title: "Travel Terverifikasi", desc: "Seleksi ketat & berlisensi" },
    { icon: TrendingUp, title: "Harga Terbaik", desc: "Garansi harga kompetitif" },
    { icon: Users, title: `${stats.travels}+ Travel`, desc: `${stats.packages}+ paket tersedia` },
  ]

  return (
    <section className="py-14 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-5 rounded-2xl bg-muted/30 border border-border/40">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
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
    <section className="relative overflow-hidden py-20 px-6 md:px-12">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-glow/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
      <div className="relative max-w-3xl mx-auto text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight">
          {t.landing.cta_title}
        </h2>
        <p className="mt-4 text-white/60 text-sm md:text-base leading-relaxed">
          {t.landing.cta_desc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-light text-emerald-deep font-bold rounded-xl shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            {t.landing.cta_button}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            {t.hero.search}
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/50">
          {["Gratis daftar", "Tanpa biaya tambahan", "Pembayaran aman"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle className="size-4 text-gold/70" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
