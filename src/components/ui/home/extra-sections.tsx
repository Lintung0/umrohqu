"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Shield, Headphones, Award, Users, CheckCircle, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tenant } from "@/lib/types"
import { IslamicPattern } from "@/components/ui/islamic-pattern"

const TESTIMONIALS = [
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

const WHY_US = [
  {
    icon: Shield,
    title: "Terpercaya & Berizin",
    desc: "Seluruh travel partner terverifikasi Kementerian Agama dan memiliki izin resmi PPIU.",
    bg: "bg-emerald-50",
  },
  {
    icon: Award,
    title: "100+ Travel Partner",
    desc: "Pilih dari ratusan biro perjalanan umroh & haji terbaik di seluruh Indonesia.",
    bg: "bg-amber-50",
  },
  {
    icon: Headphones,
    title: "Dukungan 24/7",
    desc: "Tim kami siap membantu Anda sebelum, selama, dan setelah perjalanan ibadah.",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "100.000+ Jamaah",
    desc: "Telah dipercaya lebih dari 100 ribu jamaah untuk merencanakan perjalanan suci mereka.",
    bg: "bg-purple-50",
  },
]

const STATS = [
  { value: "100+", label: "Travel Partner" },
  { value: "500+", label: "Paket Tersedia" },
  { value: "100rb+", label: "Jamaah Berangkat" },
  { value: "4.9\u2605", label: "Rating Rata-rata" },
]

export function StatsSection() {
  return (
    <section className="relative overflow-hidden py-14 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-glow/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((s) => (
          <div key={s.label} className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</div>
            <div className="text-sm text-white/60 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhyUsSection() {
  return (
    <section className="relative py-20 px-6 md:px-12 overflow-hidden">
      <div className="absolute top-0 right-0 text-primary/5">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold">
            Keunggulan Kami
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Kenapa Pilih <span className="text-gradient-primary">UmrohQ</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Platform marketplace umroh & haji pertama di Indonesia yang menghubungkan jamaah dengan travel terpercaya.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_US.map((item) => (
            <div
              key={item.title}
              className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl border border-border/60 bg-white hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`p-3 rounded-xl ${item.bg} transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className="size-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
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
  const [agencies, setAgencies] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("tenants")
      .select("*")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        setAgencies((data as Tenant[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <section className="py-20 px-6 md:px-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-8 w-56 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-white">
                <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-6 md:px-12 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold">
              Travel Partner
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Travel Partner Terbaik
            </h2>
            <p className="text-muted-foreground text-sm">
              Dipilih berdasarkan rating & kepuasan jamaah
            </p>
          </div>
          <Link
            href="/travel"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group/link"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/travel/${agency.id}`}
              className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border/60 bg-white hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative">
                {agency.logo_url ? (
                  <Image
                    src={agency.logo_url}
                    alt={agency.name}
                    width={64}
                    height={64}
                    className="rounded-full ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-emerald-glow/10 flex items-center justify-center ring-4 ring-primary/5 transition-all duration-300 group-hover:ring-primary/15">
                    <span className="text-lg font-bold text-primary">{agency.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {agency.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {agency.city || "Indonesia"}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center md:hidden">
          <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            Lihat Semua Travel
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function TestimonialSection() {
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
            Kata <span className="text-gradient-gold">Mereka</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Pengalaman nyata jamaah yang telah berangkat bersama kami
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-white hover:shadow-xl hover:shadow-gold/5 hover:border-gold/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-3 -left-1 text-5xl text-gold/15 font-serif leading-none select-none">
                &ldquo;
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 relative z-10">
                &ldquo;{t.comment}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-gold/20"
                />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.city} &middot; {t.package}
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

export function CTASection() {
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
          Siap Memulai Perjalanan{" "}
          <span className="text-gradient-gold">Ibadah</span> Anda?
        </h2>
        <p className="mt-4 text-white/60 text-sm md:text-base leading-relaxed">
          Daftar sekarang dan temukan paket umroh terbaik sesuai kebutuhan Anda.
          Lebih dari 500 paket dari 100+ travel terpercaya menanti Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-light text-emerald-deep font-bold rounded-xl shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            Daftar Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            Cari Paket
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
