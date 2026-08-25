import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Clock, Users, Plane, BadgeCheck, Shield, Package, ChevronRight, Phone, Mail, MessageCircle, Zap, Building2, Globe, FileCheck, Award } from "lucide-react"
import { formatRupiah, getSeatAvailability, getPackageAvailable } from "@/lib/utils"
import { enrichPackagesWithCovers } from "@/lib/package-covers"
import type { Package as PackageType } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/server"
import ImageGallery from "@/components/shared/image-gallery"
import { PackageDocumentationSection } from "@/components/shared/package-documentation"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"

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
  brand_color: string | null
  ppiu_number: string | null
  accredited_at: string | null
  total_jamaah: number
  gallery_urls: string[]
  video_urls: string[]
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
  quota: number | null
  quota_taken: number | null
  image_url: string | null
  is_promo: boolean
  status: string
  doc_drive_link: string | null
}

function PackageCard({ pkg, href }: { pkg: PackageRow; href?: string | null }) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0
  const seat = getSeatAvailability(pkg.available, pkg.quota ?? 0, pkg.quota_taken)

  const typeColor: Record<string, string> = {
    vip: "bg-amber-100 text-amber-800",
    plus: "bg-purple-100 text-purple-800",
    furoda: "bg-rose-100 text-rose-800",
    reguler: "bg-emerald-100 text-emerald-800",
    hemat: "bg-sky-100 text-sky-800",
  }

  const isDoc = typeof href === "string" && href !== `/package/${pkg.slug}`

  const content = (
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
          <Image
            src={pkg.image_url || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format"}
            alt={pkg.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          <div className="absolute top-2 left-2 flex gap-1">
            <PackageStatusBadge status={pkg.status} />
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${typeColor[pkg.type] || "bg-gray-100 text-gray-700"}`}>
              {pkg.type}
            </span>
            {pkg.is_promo && discount > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors mb-2">{pkg.name}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities.join(", ") : null) || "-"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                {pkg.duration_days ? `${pkg.duration_days} Hari` : "-"}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
                {pkg.airline || "-"}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                Sisa {seat.available} kursi
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {pkg.original_price && (
                <p className="text-[11px] text-gray-400 line-through">{formatRupiah(pkg.original_price)}</p>
              )}
              <p className="text-base font-bold text-emerald-700">{formatRupiah(pkg.price)}<span className="text-[10px] text-gray-400 font-normal">/org</span></p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium group-hover:gap-1.5 transition-all ${isDoc ? "text-blue-600" : "text-emerald-700"}`}>
              {isDoc ? "Lihat Dokumentasi" : "Lihat"} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
  )

  if (isDoc) {
    return <a href={href as string} target="_blank" rel="noopener noreferrer" className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors group">{content}</a>
  }
  return <Link href={`/package/${pkg.slug}`} className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-emerald-300 transition-colors group">{content}</Link>
}

export default async function TravelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  let tenant: TenantRow | null = null
  let packages: PackageRow[] = []

  try {
    const tenantResult = await supabase
      .from("tenants")
      .select("id, slug, name, logo_url, description, founded_year, is_verified, is_featured, brand_color, total_jamaah")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single()

    if (tenantResult.error || !tenantResult.data) notFound()
    tenant = tenantResult.data as TenantRow

    const packagesResult = await supabase
      .from("packages")
      .select("*")
      .eq("tenant_id", tenant.id)
      .neq("type", "haji")
      .is("deleted_at", null)
      .order("status", { ascending: false })
      .order("price", { ascending: true })

    packages = ((await enrichPackagesWithCovers(supabase, (packagesResult.data as PackageType[]) || [])) as unknown as PackageRow[]) || []
  } catch {
    notFound()
  }

  const tenantData = tenant as TenantRow
  const primaryColor = tenantData.brand_color || "#0E5C4E"
  const totalJamaah = tenantData.total_jamaah || 0

  const galleryImages: string[] = Array.isArray(tenantData.gallery_urls) && tenantData.gallery_urls.length > 0
    ? tenantData.gallery_urls
    : packages.flatMap((p) => p.image_url ? [p.image_url] : []).slice(0, 6)

  const salePackages = packages.filter((p) => p.status === "active" || p.status === "ongoing")
  const otherPackages = packages.filter((p) => p.status !== "active" && p.status !== "ongoing")
  const docPackages = packages.filter((p) => p.doc_drive_link)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}cc, ${primaryColor}88)` }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 relative">
          <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full">
            ← Semua Travel Partner
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {tenantData.logo_url ? (
              <div className="relative">
                <Image src={tenantData.logo_url} alt={tenantData.name} width={80} height={80} className="rounded-2xl ring-2 ring-white/25 shadow-2xl object-cover" unoptimized />
                {tenantData.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    <BadgeCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ring-2 ring-white/25 shadow-2xl" style={{ background: `${primaryColor}dd` }}>
                {tenantData.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-lg">{tenantData.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {tenantData.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                    <BadgeCheck className="w-3 h-3" /> Terverifikasi
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-medium bg-emerald-400/20 backdrop-blur-sm text-emerald-100 px-2.5 py-1 rounded-full border border-emerald-400/20">
                   <Shield className="w-3 h-3" /> PPIU Resmi
                </span>
                {tenantData.is_featured && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-amber-400/20 backdrop-blur-sm text-amber-100 px-2.5 py-1 rounded-full border border-amber-400/20">
                    <Zap className="w-3 h-3" /> Unggulan
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/60">
                {tenantData.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tenantData.city}</span>}
                {tenantData.founded_year && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Sejak {tenantData.founded_year}</span>}
                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{salePackages.length + otherPackages.length} Paket</span>
                {totalJamaah > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{totalJamaah.toLocaleString("id-ID")}+ Jamaah</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: salePackages.length + otherPackages.length, label: "Total Paket", icon: Package, gradient: "from-emerald-500 to-emerald-600" },
            { value: totalJamaah > 0 ? `${totalJamaah.toLocaleString("id-ID")}+` : packages.reduce((s, p) => s + getPackageAvailable(p), 0), label: "Jamaah", icon: Users, gradient: "from-blue-500 to-blue-600" },
            { value: tenantData.founded_year || "-", label: "Berdiri Sejak", icon: Building2, gradient: "from-amber-500 to-amber-600" },
            { value: tenantData.is_verified ? "Aktif" : "Proses", label: "Verifikasi", icon: Shield, gradient: "from-emerald-500 to-teal-600" },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center min-w-0 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mx-auto mb-2`}>
                <m.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">{m.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* About + Legalitas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
                Tentang Kami
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">{tenantData.description || "Biro perjalanan umroh & haji terpercaya."}</p>
            </div>
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Legalitas & Perizinan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100/80 rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Nomor Izin PPIU</p>
                    <p className="text-xs font-semibold text-emerald-700">{tenantData.ppiu_number || "Terverifikasi Kemenhaj"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100/80 rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tanggal Akreditasi</p>
                    <p className="text-xs font-semibold text-blue-700">
                      {tenantData.accredited_at
                        ? new Date(tenantData.accredited_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Aktif"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-100/80 rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status Platform</p>
                    <p className="text-xs font-semibold text-emerald-700">{tenantData.is_verified ? "Terverifikasi UmrahQu" : "Dalam Proses"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-100/80 rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Jamaah</p>
                    <p className="text-xs font-semibold text-emerald-700">
                      {totalJamaah > 0 ? `${totalJamaah.toLocaleString("id-ID")}+ Jamaah` : "Data tersedia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
              Info Singkat
            </h2>
            <div className="space-y-3.5">
              {[
                { icon: Building2, label: "Berdiri Sejak", value: tenantData.founded_year || "-" },
                { icon: Package, label: "Total Paket", value: `${salePackages.length + otherPackages.length} paket` },
                { icon: Users, label: "Kuota Tersedia", value: `${salePackages.reduce((sum, p) => sum + getPackageAvailable(p), 0)} kursi` },
                { icon: Globe, label: "Website", value: `${tenantData.slug}.umrahqu.com` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs font-semibold break-all text-gray-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery — ImageGallery slider */}
        {galleryImages.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full" />
              Galeri Dokumentasi
            </h2>
            <ImageGallery images={galleryImages} alt={tenantData.name} />
            <p className="text-[10px] text-gray-400 mt-3 text-center">Dokumentasi perjalanan jamaah — klik panah atau geser untuk navigasi</p>
          </div>
        )}

        {/* Packages */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
              Paket Tersedia
              <span className="text-gray-400 font-normal text-sm">({salePackages.length + otherPackages.length} paket)</span>
            </h2>
          </div>

          {salePackages.length === 0 && otherPackages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Belum ada paket tersedia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salePackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
              {otherPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} href={pkg.doc_drive_link || null} />
              ))}
            </div>
          )}
        </div>

        {/* Documentation */}
        <PackageDocumentationSection packages={docPackages} />

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
            Hubungi {tenantData.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tenantData.phone ? (
              <a
                href={`https://wa.me/${tenantData.phone.replace(/[^0-9]/g, "")}?text=Assalamualaikum,%20saya%20tertarik%20dengan%20paket%20umroh%20${encodeURIComponent(tenantData.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-green-200/80 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-md hover:border-green-300 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">WhatsApp</p>
                  <p className="text-xs text-green-600">Chat langsung</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl opacity-40">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">WhatsApp</p>
                  <p className="text-xs text-gray-400">Belum tersedia</p>
                </div>
              </div>
            )}
            {tenantData.phone ? (
              <a href={`tel:${tenantData.phone}`} className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Telepon</p>
                  <p className="text-xs text-gray-500">{tenantData.phone}</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl opacity-40">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Telepon</p>
                  <p className="text-xs text-gray-400">Belum tersedia</p>
                </div>
              </div>
            )}
            <a href={`mailto:${tenantData.contact_email || `info@${tenantData.slug}.com`}`} className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800">Email</p>
                <p className="text-xs text-gray-500 break-all">{tenantData.contact_email || `info@${tenantData.slug}.com`}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
