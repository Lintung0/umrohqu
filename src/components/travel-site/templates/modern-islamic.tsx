"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Plane, Hotel, Users, ArrowRight, Star } from "lucide-react"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { formatRupiah, getPackageAvailable } from "@/lib/utils"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"
import type { Tenant, Package } from "@/lib/types"

interface TemplateProps {
  tenant: Tenant
  packages: Package[]
  themeConfig?: Record<string, unknown>
}

export default function ModernIslamicTemplate({ tenant, packages, themeConfig }: TemplateProps) {
  const primary = (themeConfig?.primary_color as string) || tenant.brand_color || "#0D7C5F"
  const secondary = (themeConfig?.secondary_color as string) || "#D4AF37"

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc, ${primary}99)` }}>
        <div className="absolute inset-0 text-white"><IslamicPattern opacity={0.05} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {tenant.logo_url ? (
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Image src={tenant.logo_url} alt={tenant.name} fill className="rounded-full object-cover ring-4 ring-white/20 shadow-xl" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: secondary }}>
                <Star className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white/20 shadow-xl" style={{ background: `linear-gradient(135deg, ${secondary}, ${secondary}cc)` }}>
              {tenant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">{tenant.name}</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-6">{tenant.description || "Biro perjalanan umroh & haji terpercaya"}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
            {tenant.city && <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><MapPin className="w-3.5 h-3.5" /> {tenant.city}</span>}
            {tenant.phone && <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</span>}
            {tenant.contact_email && <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><Mail className="w-3.5 h-3.5" /> {tenant.contact_email}</span>}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-50/30 to-transparent" />
      </section>

      {/* Stats bar */}
      <section className="relative -mt-8 z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-white/60 p-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: primary }}>{packages.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paket Tersedia</p>
          </div>
          <div className="border-x border-border/50">
            <p className="text-2xl font-bold" style={{ color: primary }}>{tenant.packages_count || packages.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Paket</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: primary }}>{packages.reduce((sum, p) => sum + getPackageAvailable(p), 0)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Kursi Tersisa</p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Paket Umroh Terbaik</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">Pilih paket perjalanan ibadah terbaik dari {tenant.name}</p>
          <div className="mt-4 w-16 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
        </div>
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} primary={primary} secondary={secondary} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-border/50">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${primary}10` }}>
              <Plane className="w-7 h-7" style={{ color: primary }} />
            </div>
            <p className="text-lg font-medium text-gray-900">Belum Ada Paket</p>
            <p className="text-sm text-muted-foreground mt-1">Paket umroh akan segera tersedia</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: primary }}>
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">{tenant.city}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PackageCard({ pkg, primary, secondary }: { pkg: Package; primary: string; secondary: string }) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  return (
    <Link href={`/package/${pkg.slug}`} className="group block bg-white border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <PackageStatusBadge status={pkg.status} />
          {pkg.is_promo && (
            <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              PROMO {discount}%
            </span>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm" style={{ background: `${primary}e6`, color: "white" }}>
            {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />
            {pkg.duration_days} Hari
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-[2.5rem]">{pkg.name}</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" style={{ color: primary }} />
            <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Plane className="w-3 h-3 shrink-0" style={{ color: primary }} />
            {pkg.airline}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hotel className="w-3 h-3 shrink-0" style={{ color: primary }} />
            <span className="truncate">{pkg.hotel_makkah} ({'★'.repeat(pkg.hotel_makkah_stars || 0)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3 shrink-0" style={{ color: primary }} />
            <span>Sisa <span className="font-semibold text-foreground">{getPackageAvailable(pkg)}</span> kursi</span>
          </div>
        </div>
        <div className="flex items-end justify-between pt-3 border-t border-border/50">
          <div>
            {pkg.original_price && <p className="text-[11px] text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>}
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold" style={{ color: primary }}>{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-muted-foreground">/org</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all duration-200 hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
            Lihat <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
