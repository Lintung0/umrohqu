"use client"

import { useTranslation } from "@/lib/i18n"
import Image from "next/image"
import Link from "next/link"
import { Star, Shield, Headphones, Award, Users, CheckCircle, ArrowRight, TrendingUp, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Tenant } from "@/lib/types"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import LogoMarquee from "@/components/shared/logo-marquee"

const FALLBACK_TESTIMONIALS = [
  {
    id: "t-1",
    name: "Hj. Siti Rahayu",
    city: "Jakarta",
    avatar: "https://ui-avatars.com/api/?name=Siti+Rahayu&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "Umroh Reguler 12 Hari",
    comment: "Alhamdulillah, perjalanan umroh kami sangat lancar. Pelayanan dari awal booking sampai kepulangan sangat memuaskan.",
  },
  {
    id: "t-2",
    name: "Bpk. Agus Santoso",
    city: "Surabaya",
    avatar: "https://ui-avatars.com/api/?name=Agus+Santoso&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "Umroh VIP Plus Turki",
    comment: "Paket VIP benar-benar worth it. Hotel dekat Masjidil Haram, muthawwif berpengalaman, dan semua fasilitas terjaga.",
  },
  {
    id: "t-3",
    name: "Ibu Fatimah Noor",
    city: "Bandung",
    avatar: "https://ui-avatars.com/api/?name=Fatimah+Noor&background=E8F5EE&color=2A7D4F&size=80&bold=true",
    rating: 5,
    package: "Umroh Hemat Muharram",
    comment: "Harga terjangkau tapi kualitas tidak murahan. Booking mudah, pembayaran aman, status perjalanan bisa dipantau.",
  },
]

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
    <section className="py-16 px-6 md:px-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{t.landing.why_us_title}</h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
          <p className="text-gray-500 mt-4 text-sm max-w-xl leading-relaxed">{t.landing.why_us_desc}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {WHY_US.map((item) => (
            <div
              key={item.title}
              className="group relative flex gap-4 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-100 transition-all duration-300"
            >
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
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
      <section className="py-14 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-6 mx-auto" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse shrink-0" />
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
    <section className="relative py-16 px-6 md:px-12 overflow-hidden border-t border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{t.landing.travel_section_title}</h2>
          </div>
          <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group">
            Lihat semua <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS)

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
              bookingToPkg.forEach((pkgId, bid) => { pkgMap[bid] = rawPkgMap.get(pkgId) || "Umroh" })
            }
          }
          const mapped = data.map((r: any) => ({
            id: r.id,
            name: r.customer_id ? (nameMap[r.customer_id] || "Pengguna") : "Pengguna",
            city: "Indonesia",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameMap[r.customer_id] || "U")}&background=E8F5EE&color=2A7D4F&size=80&bold=true`,
            rating: r.rating,
            package: r.booking_id ? (pkgMap[r.booking_id] || "Umroh") : "Umroh",
            comment: r.review || "Paket bagus, pelayanan memuaskan.",
          }))
          setTestimonials(mapped)
        }
      } catch {
        // fallback to static
      }
    }
    loadTestimonials()
  }, [])

  return (
    <section className="relative py-16 px-6 md:px-12 bg-white border-t border-gray-100 overflow-hidden">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-emerald-50/60 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{t.landing.testimonial_title}</h2>
          <div className="mt-3 mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
          <p className="text-gray-500 mt-4 text-sm">{t.landing.testimonial_desc}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span className="absolute -top-1 right-4 text-6xl font-serif text-emerald-200/70 leading-none select-none" aria-hidden="true">"</span>
              <div className="flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.4)]" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">"{item.comment}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="p-[2px] rounded-full bg-gradient-to-br from-emerald-500 to-amber-400">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-white"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.city} · {item.package}</p>
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
    <section className="py-12 px-6 md:px-12 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group flex items-center gap-3.5 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-100 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0 group-hover:from-emerald-500 group-hover:to-emerald-700 transition-colors duration-300">
                <item.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{item.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
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
    <section className="relative overflow-hidden py-16 px-6 md:px-12">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="relative max-w-3xl mx-auto text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight">{t.landing.cta_title}</h2>
        <p className="mt-3 text-white/60 text-sm leading-relaxed">{t.landing.cta_desc}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-900 font-bold rounded-xl transition-colors"
          >
            {t.landing.cta_button}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
          >
            {t.hero.search}
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/40">
          {["Gratis daftar", "Tanpa biaya tambahan", "Pembayaran aman"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400/70" />
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t.landing.stats_title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {displayStats.map((s) => (
            <div key={s.label} className="space-y-1.5">
              <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</div>
              <div className="text-sm text-white/50 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
