"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Plane, Hotel, Users, ArrowRight, Crown } from "lucide-react"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { formatRupiah, getPackageAvailable } from "@/lib/utils"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"
import type { Tenant, Package } from "@/lib/types"

interface TemplateProps {
  tenant: Tenant
  packages: Package[]
  themeConfig?: Record<string, unknown>
}

export default function RoyalGoldTemplate({ tenant, packages, themeConfig }: TemplateProps) {
  const primary = (themeConfig?.primary_color as string) || tenant.brand_color || "#0F172A"
  const gold = (themeConfig?.secondary_color as string) || "#D4AF37"

  return (
    <div className="min-h-screen" style={{ background: `${primary}` }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 text-white"><IslamicPattern opacity={0.04} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12" style={{ background: gold }} />
            <Crown className="w-5 h-5" style={{ color: gold }} />
            <div className="h-px w-12" style={{ background: gold }} />
          </div>
          {tenant.logo_url ? (
            <div className="relative w-28 h-28 mx-auto mb-6">
              <Image src={tenant.logo_url} alt={tenant.name} fill className="rounded-full object-cover shadow-2xl" style={{ border: `2px solid ${gold}` }} />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: gold }}>
                <Crown className="w-4 h-4" style={{ color: primary }} />
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold shadow-2xl" style={{ background: `linear-gradient(135deg, ${gold}, ${gold}cc)`, color: primary, border: `2px solid ${gold}` }}>
              {tenant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">{tenant.name}</h1>
          <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: `${gold}99` }}>
            {tenant.description || "Biro perjalanan umroh & haji premium. Pelayanan eksklusif untuk perjalanan ibadah Anda."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {tenant.city && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border" style={{ borderColor: `${gold}33`, color: `${gold}cc` }}>
                <MapPin className="w-3.5 h-3.5" /> {tenant.city}
              </span>
            )}
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors hover:bg-white/5" style={{ borderColor: `${gold}33`, color: `${gold}cc` }}>
                <Phone className="w-3.5 h-3.5" /> {tenant.phone}
              </a>
            )}
            {tenant.contact_email && (
              <a href={`mailto:${tenant.contact_email}`} className="flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors hover:bg-white/5" style={{ borderColor: `${gold}33`, color: `${gold}cc` }}>
                <Mail className="w-3.5 h-3.5" /> {tenant.contact_email}
              </a>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}44, transparent)` }} />
      </section>

      {/* Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: `${gold}44` }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: gold }}>Koleksi Paket</span>
            <div className="h-px w-8" style={{ background: `${gold}44` }} />
          </div>
          <h2 className="text-3xl font-bold text-white">Paket Umroh Premium</h2>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: `${gold}88` }}>
            Pilihan paket terbaik dari {tenant.name} untuk perjalanan ibadah yang tak terlupakan
          </p>
        </div>
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} primary={primary} gold={gold} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border rounded-2xl" style={{ borderColor: `${gold}22` }}>
            <Crown className="w-10 h-10 mx-auto mb-4" style={{ color: `${gold}44` }} />
            <p className="text-lg font-medium text-white">Belum Ada Paket</p>
            <p className="text-sm mt-1" style={{ color: `${gold}66` }}>Paket premium akan segera tersedia</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: `${gold}22` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: gold, color: primary }}>
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-white">{tenant.name}</p>
                <p className="text-xs" style={{ color: `${gold}66` }}>{tenant.city}</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: `${gold}44` }}>&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PackageCard({ pkg, primary, gold }: { pkg: Package; primary: string; gold: string }) {
  return (
    <Link href={`/package/${pkg.slug}`} className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1" style={{ background: `${primary}cc`, border: `1px solid ${gold}22` }}>
      <div className="relative h-48 overflow-hidden">
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <PackageStatusBadge status={pkg.status} />
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm border" style={{ borderColor: `${gold}44`, color: gold }}>
            {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ background: `${primary}99`, border: `1px solid ${gold}33` }}>
            <Clock className="w-3 h-3" />
            {pkg.duration_nights ? `${pkg.duration_nights} Hari` : "-"}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm leading-snug text-white line-clamp-2 min-h-[2.5rem] transition-colors" style={{ color: `${gold}cc` }}>
          {pkg.name}
        </h3>
          <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: `${gold}77` }}>
            <MapPin className="w-3 h-3 shrink-0" style={{ color: gold }} />
            <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).filter(Boolean).slice(0, 2).join(", ") || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: `${gold}77` }}>
            <Plane className="w-3 h-3 shrink-0" style={{ color: gold }} />
            {pkg.airline || "-"}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: `${gold}77` }}>
            <Hotel className="w-3 h-3 shrink-0" style={{ color: gold }} />
            <span className="truncate">{pkg.hotel_makkah ? `${pkg.hotel_makkah} (${"★".repeat(pkg.hotel_makkah_stars || 0)})` : "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: `${gold}77` }}>
            <Users className="w-3 h-3 shrink-0" style={{ color: gold }} />
            <span>Sisa <span className="font-semibold text-white">{getPackageAvailable(pkg)}</span> kursi</span>
          </div>
        </div>
        <div className="flex items-end justify-between pt-3 border-t" style={{ borderColor: `${gold}22` }}>
          <div>
            {pkg.original_price && <p className="text-[11px] line-through" style={{ color: `${gold}55` }}>{formatRupiah(pkg.original_price)}</p>}
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold" style={{ color: gold }}>{formatRupiah(pkg.price)}</p>
              <p className="text-[10px]" style={{ color: `${gold}55` }}>/org</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg" style={{ background: gold, color: primary }}>
            Lihat <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
