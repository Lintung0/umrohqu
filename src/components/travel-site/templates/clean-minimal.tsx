"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Plane, Hotel, Users, ArrowRight } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { Tenant, Package } from "@/lib/types"

interface TemplateProps {
  tenant: Tenant
  packages: Package[]
  themeConfig?: Record<string, unknown>
}

export default function CleanMinimalTemplate({ tenant, packages, themeConfig }: TemplateProps) {
  const primary = (themeConfig?.primary_color as string) || tenant.brand_color || "#111827"
  const accent = (themeConfig?.secondary_color as string) || primary

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt={tenant.name} width={32} height={32} className="rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: primary }}>
                {tenant.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-sm">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {tenant.city && <span className="hidden sm:flex items-center gap-1"><MapPin className="w-3 h-3" /> {tenant.city}</span>}
            {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors"><Phone className="w-3 h-3" /> {tenant.phone}</a>}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-0.5 rounded-full" style={{ background: primary }} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Travel Terpercaya</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {tenant.name}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {tenant.description || "Biro perjalanan umroh & haji terpercaya. Melayani keberangkatan dengan pelayanan terbaik dan harga terjangkau."}
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
            {tenant.city && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-gray-50/50">
                <MapPin className="w-3.5 h-3.5" /> {tenant.city}
              </span>
            )}
            {tenant.contact_email && (
              <a href={`mailto:${tenant.contact_email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <Mail className="w-3.5 h-3.5" /> {tenant.contact_email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="font-bold text-2xl" style={{ color: primary }}>{packages.length}</p>
              <p className="text-xs text-muted-foreground">Paket Aktif</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div>
              <p className="font-bold text-2xl" style={{ color: primary }}>{packages.reduce((sum, p) => sum + (p.available ?? p.quota), 0)}</p>
              <p className="text-xs text-muted-foreground">Kursi Tersisa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paket Perjalanan</h2>
            <p className="text-sm text-muted-foreground mt-1">Semua paket dari {tenant.name}</p>
          </div>
        </div>
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} primary={primary} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
              <Plane className="w-5 h-5 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">Belum Ada Paket</p>
            <p className="text-sm text-muted-foreground mt-1">Paket perjalanan akan segera tersedia</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} width={28} height={28} className="rounded-md" />
              ) : (
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: primary }}>
                  {tenant.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium">{tenant.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {tenant.name}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PackageCard({ pkg, primary }: { pkg: Package; primary: string }) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  return (
    <div className="group bg-white border border-border/60 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {pkg.is_promo && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              -{discount}%
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-gray-700">
            {pkg.type === "vip" ? "VIP" : pkg.type === "plus" ? "Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="flex items-center gap-1 bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" /> {pkg.duration_days} Hari
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-gray-900 transition-colors">{pkg.name}</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hotel className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate">{pkg.hotel_makkah}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3 shrink-0 text-gray-400" />
            <span>{pkg.available ?? pkg.quota} kursi tersisa</span>
          </div>
        </div>
        <div className="flex items-end justify-between pt-3 border-t border-border/40">
          <div>
            {pkg.original_price && <p className="text-[11px] text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>}
            <p className="text-lg font-bold text-gray-900">{formatRupiah(pkg.price)}</p>
          </div>
          <Link href={`/package/${pkg.slug}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 text-gray-700 hover:bg-gray-50 transition-colors group/btn">
            Detail <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
