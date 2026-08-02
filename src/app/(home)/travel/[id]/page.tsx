import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Clock, Users, Plane, Hotel, BadgeCheck, Shield, Package, ChevronLeft, Phone, Mail, MessageCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRupiah } from "@/lib/utils"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface TenantRow {
  id: string
  slug: string
  name: string
  logo_url: string | null
  city: string | null
  description: string | null
  founded_year: string | null
  is_verified: boolean
  is_featured: boolean
  phone: string | null
  contact_email: string | null
}

interface PackageRow {
  id: string
  name: string
  slug: string
  type: string
  departure_cities: string[]
  duration_days: number | null
  departure_month: string | null
  price: number
  original_price: number | null
  airline: string | null
  hotel_makkah: string | null
  hotel_makkah_stars: number | null
  hotel_madinah: string | null
  hotel_madinah_stars: number | null
  available: number | null
  image_url: string | null
  is_promo: boolean
}

function PackageCard({ pkg }: { pkg: PackageRow }) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  return (
    <div className="bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex gap-4">
        <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0">
          <Image
            src={pkg.image_url || "https://ui-avatars.com/api/?name=Paket+Umroh&background=2A7D4F&color=fff&size=128&bold=true"}
            alt={pkg.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-1.5 left-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
              pkg.type === "vip" ? "bg-amber-400 text-amber-900" :
              pkg.type === "plus" ? "bg-purple-500 text-white" :
              "bg-primary text-white"
            }`}>
              {pkg.type}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug mb-2">{pkg.name}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{pkg.departure_cities?.join(", ") || "-"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 text-primary shrink-0" />
              {pkg.duration_days} Hari{pkg.departure_month ? ` · ${pkg.departure_month}` : ""}
            </div>
            {pkg.airline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Plane className="w-3 h-3 text-primary shrink-0" />
                {pkg.airline}
              </div>
            )}
            {pkg.available != null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3 text-primary shrink-0" />
                Sisa {pkg.available} kursi
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Hotel className="w-3 h-3 text-primary shrink-0" />
            {pkg.hotel_makkah || "-"}{pkg.hotel_makkah_stars ? ` ${pkg.hotel_makkah_stars}*` : ""} · {pkg.hotel_madinah || "-"}{pkg.hotel_madinah_stars ? ` ${pkg.hotel_madinah_stars}*` : ""}
          </div>

          <div className="flex items-end justify-between">
            <div>
              {pkg.original_price && (
                <p className="text-xs text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-primary">{formatRupiah(pkg.price)}</p>
                {pkg.is_promo && discount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">/ orang</p>
            </div>
            <Link href={`/package/${pkg.slug}`} className="inline-flex items-center justify-center text-xs font-medium h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Lihat Paket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function TravelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, logo_url, city, description, founded_year, is_verified, is_featured, phone, contact_email")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (!tenant) notFound()

  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, slug, type, departure_cities, duration_days, departure_month, price, original_price, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars, available, image_url, is_promo")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("price", { ascending: true })

  const tenantData = tenant as TenantRow
  const pkgList = (packages as PackageRow[]) || []

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="max-w-5xl mx-auto">
          <Link href="/travel" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Daftar Travel
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <Image
              src={tenantData.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenantData.name)}&background=2A7D4F&color=fff&size=80&bold=true`}
              alt={tenantData.name}
              width={80}
              height={80}
              className="rounded-2xl"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{tenantData.name}</h1>
                {tenantData.is_verified && (
                  <span className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                )}
                {tenantData.is_featured && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                {tenantData.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{tenantData.city}
                  </span>
                )}
                {tenantData.founded_year && <span>Berdiri {tenantData.founded_year}</span>}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                {pkgList.length} Paket Tersedia
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <span className="inline-flex items-center justify-center text-xs font-medium border border-dashed border-border rounded-md px-3 h-8 bg-muted/40 text-muted-foreground cursor-not-allowed" title="Subdomain aktif setelah travel onboarding">
                {tenantData.slug}.umrohq.com (segera)
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed border-t border-border pt-4">
            {tenantData.description}
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { icon: Shield, text: "PPIU Resmi Kemenag" },
              { icon: BadgeCheck, text: "Terverifikasi UmrohQ" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <item.icon className="w-3.5 h-3.5 text-primary" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Paket Tersedia ({pkgList.length})</h2>
          {pkgList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-muted-foreground text-sm">Belum ada paket aktif</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pkgList.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Hubungi {tenantData.name}</h2>
          <p className="text-sm text-muted-foreground">Ada pertanyaan? Hubungi travel langsung atau kirim pesan.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tenantData.phone ? (
              <a
                href={`https://wa.me/${tenantData.phone.replace(/[^0-9]/g, "")}?text=Assalamualaikum,%20saya%20tertarik%20dengan%20paket%20umroh%20${encodeURIComponent(tenantData.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-green-200 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">WhatsApp</p>
                  <p className="text-xs text-green-600">Chat langsung</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 border border-border rounded-xl opacity-50">
                <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Belum tersedia</p>
                </div>
              </div>
            )}
            {tenantData.phone ? (
              <a
                href={`tel:${tenantData.phone}`}
                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-gray-50 transition-colors"
              >
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Telepon</p>
                <p className="text-xs text-muted-foreground">{tenantData.phone}</p>
              </div>
            </a>
            ) : (
              <div className="flex items-center gap-3 p-4 border border-border rounded-xl opacity-50">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Telepon</p>
                  <p className="text-xs text-muted-foreground">Belum tersedia</p>
                </div>
              </div>
            )}
            <a
              href={`mailto:${tenantData.contact_email || `info@${tenantData.slug}.com`}`}
              className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-xs text-muted-foreground">{tenantData.contact_email || `info@${tenantData.slug}.com`}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
