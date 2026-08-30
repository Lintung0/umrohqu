import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Clock, Users, Plane, BadgeCheck, Shield, Package, ChevronRight, Phone, Mail, MessageCircle, Zap, Building2, Globe, FileCheck, Award, ArrowRight, Star } from "lucide-react"
import { formatRupiah, getSeatAvailability, getPackageAvailable } from "@/lib/utils"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { enrichTenantsWithDetail } from "@/lib/tenant-detail-fields"
import type { Package as PackageType, Tenant } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/server"
import TravelGalleryMosaic from "@/components/shared/travel-gallery-mosaic"
import { PackageDocumentationSection } from "@/components/shared/package-documentation"

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
}

interface PackageRow {
  id: string
  name: string
  slug: string
  type: string
  departure_cities: string[]
  duration_nights: number | null
  price: number
  original_price: number | null
  airline: string | null
  quota: number | null
  quota_taken: number | null
  image_url: string | null
  status: string
  doc_drive_link: string | null
}

function PackageCard({ pkg, href }: { pkg: PackageRow; href?: string | null }) {
  const seat = getSeatAvailability(undefined, pkg.quota ?? 0, pkg.quota_taken)
  const soldOut = seat.available <= 0

  const isDoc = typeof href === "string" && href !== `/package/${pkg.slug}`

  const content = (
    <div className="flex flex-col h-full">
      <div className="relative h-44 sm:h-48 shrink-0 overflow-hidden">
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format"}
          alt={pkg.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {pkg.duration_nights && (
            <span className="bg-black/55 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {pkg.duration_nights} Hari
            </span>
          )}
          {soldOut && (
            <span className="bg-red-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Penuh
            </span>
          )}
        </div>
        {pkg.airline && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Plane className="w-2.5 h-2.5" /> {pkg.airline}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors mb-2.5">{pkg.name}</h3>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities.join(", ") : null) || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3 h-3 text-emerald-600 shrink-0" />
            {soldOut ? "Kursi habis" : `Sisa ${seat.available} kursi`}
          </div>
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all duration-700 ${soldOut ? "bg-gray-400" : seat.color}`} style={{ width: `${soldOut ? 100 : seat.percent}%` }} />
        </div>

        <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <p className="text-base font-bold text-emerald-700">{formatRupiah(pkg.price)}<span className="text-[10px] text-gray-400 font-normal">/org</span></p>
          </div>
          {!soldOut ? (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all ${isDoc ? "text-blue-600" : "text-emerald-700"}`}>
              {isDoc ? "Lihat Dokumentasi" : "Lihat Paket"} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
              <Clock className="w-3.5 h-3.5" /> Berlangsung
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (isDoc) {
    return (
      <a
        href={href as string}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5 transition-all duration-300 group"
      >
        {content}
      </a>
    )
  }
  return (
    <Link
      href={`/package/${pkg.slug}`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/60 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      {content}
    </Link>
  )
}

export default async function TravelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  let tenant: TenantRow | null = null
  let packages: PackageRow[] = []
  let totalJamaah = 0

  try {
    const tenantQuery = await supabase
      .from("tenants")
      .select("id, slug, name, logo_url, description, founded_year, is_verified, is_featured, brand_color")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single()

    if (tenantQuery.error || !tenantQuery.data) notFound()
    const tenantBase = tenantQuery.data as Tenant
    const tenantEnriched = (await enrichTenantsWithDetail(supabase, [tenantBase])) as unknown as TenantRow[]
    tenant = tenantEnriched?.[0] ?? (tenantBase as unknown as TenantRow)

    const packagesResult = await supabase
      .from("packages")
      .select("*")
      .eq("tenant_id", tenant.id)
      .neq("type", "haji")
      .is("deleted_at", null)
      .order("status", { ascending: false })
      .order("price", { ascending: true })

    packages = ((await enrichPackagesWithDetail(supabase, (packagesResult.data as PackageType[]) || [])) as unknown as PackageRow[]) || []

    const bookingIdsResult = await supabase
      .from("bookings")
      .select("id")
      .eq("tenant_id", tenant.id)
      .in("status", ["confirmed", "paid", "ongoing", "completed"])

    const bookingIds = (bookingIdsResult.data ?? []).map((b) => b.id)
    if (bookingIds.length > 0) {
      const participantsResult = await supabase
        .from("booking_participants")
        .select("id", { count: "exact", head: true })
        .in("booking_id", bookingIds)
      totalJamaah = participantsResult.count ?? 0
    }
  } catch {
    notFound()
  }

  const tenantData = tenant as TenantRow
  const primaryColor = tenantData.brand_color || "#0E5C4E"

  const galleryImages: string[] = packages.map((p) => p.image_url).filter((u): u is string => !!u).slice(0, 6)
  const heroImage = galleryImages[0]

  const salePackages = packages.filter((p) => p.status === "active" || p.status === "ongoing")
  const otherPackages = packages.filter((p) => p.status !== "active" && p.status !== "ongoing")
  const docPackages = packages.filter((p) => p.doc_drive_link)

  const totalAvailable = salePackages.reduce((s, p) => s + getPackageAvailable(p), 0)

  return (
    <main className="min-h-screen bg-[#F7F8F7]">
      {/* Hero — profile banner */}
      <section className="relative overflow-hidden">
        {/* background: foto + gradasi brand */}
        <div className="absolute inset-0">
          {heroImage && (
            <Image src={heroImage} alt="" fill className="object-cover" unoptimized priority />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${primaryColor}f5 0%, ${primaryColor}e6 45%, ${primaryColor}b3 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F8F7] via-transparent to-black/30" />
        </div>

        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "26px 26px" }}
          aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-14 sm:pb-20">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/travel"
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 hover:scale-105 transition-transform"
            >
              ← Semua Travel Partner
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Shield className="w-3 h-3 text-emerald-300" /> PPIU Resmi
              </span>
              {tenantData.is_featured && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-100 bg-amber-500/25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-300/30">
                  <Star className="w-3 h-3 text-amber-300 fill-amber-300" /> Unggulan
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Kiri: identitas */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-5 mb-5">
                {tenantData.logo_url ? (
                  <div className="relative shrink-0">
                    <Image
                      src={tenantData.logo_url}
                      alt={tenantData.name}
                      width={84}
                      height={84}
                      className="rounded-3xl ring-4 ring-white/30 shadow-2xl object-cover"
                      unoptimized
                    />
                    {tenantData.is_verified && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-[3px] ring-white/50 shadow-lg">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-[84px] h-[84px] rounded-3xl flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white/30 shadow-2xl shrink-0" style={{ background: `${primaryColor}dd` }}>
                    {tenantData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-lg leading-tight">{tenantData.name}</h1>
                  <p className="text-white/85 text-lg mt-0.5 font-medium">
                    {tenantData.is_verified ? "Travel Partner Terverifikasi" : "Travel Partner UmrahQu"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75 mb-6">
                {tenantData.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tenantData.city}</span>}
                {tenantData.founded_year && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />Sejak {tenantData.founded_year}</span>}
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{salePackages.length + otherPackages.length} Paket</span>
                {totalJamaah > 0 && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{totalJamaah.toLocaleString("id-ID")}+ Jamaah</span>}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#paket-tersedia"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
                >
                  <Package className="w-4 h-4 text-emerald-700" /> Lihat Paket
                </a>
              </div>
            </div>

            {/* Kanan: foto unggulan floating + stats mini */}
            {heroImage && (
              <div className="hidden lg:block lg:w-72 lg:shrink-0">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-emerald-400/30 to-amber-300/20 rounded-[2rem] blur-xl" aria-hidden />
                  <div className="relative rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <Image src={heroImage} alt={`${tenantData.name} dokumentasi`} width={288} height={384} className="object-cover w-full h-80" unoptimized />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-10 pb-3">
                      <p className="text-[11px] text-white/90 font-medium flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" /> Dokumentasi jamaah terbaru
                      </p>
                    </div>
                  </div>
                  {totalJamaah > 0 && (
                    <div className="absolute -left-8 top-6 bg-white rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center gap-2 -rotate-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none">{totalJamaah.toLocaleString("id-ID")}+</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Jamaah</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute -right-4 bottom-14 bg-white rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center gap-2 rotate-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{salePackages.length + otherPackages.length}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Paket</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Tentang — editorial */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
                <h2 className="text-lg font-bold tracking-tight">Tentang Kami</h2>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-white to-emerald-50/60 border border-gray-100 p-5 sm:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/60 via-emerald-400/60 to-amber-300/60" aria-hidden />
                <p className="text-gray-600 leading-relaxed">
                  {tenantData.description || "Biro perjalanan umroh & haji terpercaya."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-gray-100 px-3.5 py-3.5 shadow-sm flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-emerald-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Beroperasi</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">Sejak {tenantData.founded_year || "-"}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-gray-100 px-3.5 py-3.5 shadow-sm flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4.5 h-4.5 text-emerald-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Verifikasi</p>
                    <p className="text-sm font-semibold text-emerald-700 truncate">{tenantData.is_verified ? "Terverifikasi" : "Proses"}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-gray-100 px-3.5 py-3.5 shadow-sm flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5 text-amber-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Kuota Tersedia</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{totalAvailable} kursi</p>
                  </div>
                </div>
              </div>

              {/* Legalitas inline */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  PPIU {tenantData.ppiu_number ? `No. ${tenantData.ppiu_number}` : "Resmi"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200/80 rounded-full px-3.5 py-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  {tenantData.accredited_at
                    ? `Akreditasi ${new Date(tenantData.accredited_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Akreditasi Kemenhaj"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  {tenantData.slug}.umrahqu.com
                </span>
              </div>
            </div>

            {/* Kontak kilat */}
            <aside className="lg:col-span-1">
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-6 text-white sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-4.5 h-4.5 text-emerald-300" />
                  </span>
                  <h3 className="text-sm font-bold">Hubungi Langsung</h3>
                </div>
                <p className="text-xs text-emerald-100/80 mb-4 leading-relaxed">
                  Konsultasi gratis dengan {tenantData.name} — tim kami siap membantu.
                </p>
                <div className="space-y-2.5">
                  {tenantData.phone ? (
                    <>
                      <a
                        href={`https://wa.me/${tenantData.phone.replace(/[^0-9]/g, "")}?text=Assalamualaikum,%20saya%20tertarik%20dengan%20paket%20umroh%20${encodeURIComponent(tenantData.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${tenantData.phone}`}
                        className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-2.5 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-100/60 uppercase tracking-wide">Telepon</p>
                          <p className="text-xs font-semibold truncate">{tenantData.phone}</p>
                        </div>
                      </a>
                    </>
                  ) : null}
                  <a
                    href={`mailto:${tenantData.contact_email || `info@${tenantData.slug}.com`}`}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-2.5 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-100/60 uppercase tracking-wide">Email</p>
                      <p className="text-xs font-semibold break-all">{tenantData.contact_email || `info@${tenantData.slug}.com`}</p>
                    </div>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Galeri — mosaic */}
        {galleryImages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-amber-600" />
                <h2 className="text-lg font-bold tracking-tight">Galeri Dokumentasi</h2>
              </div>
              <span className="text-xs text-gray-400">Klik untuk memperbesar · {galleryImages.length} foto</span>
            </div>
            <TravelGalleryMosaic images={galleryImages} alt={tenantData.name} />
          </section>
        )}

        {/* Paket Tersedia */}
        <section id="paket-tersedia" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
              <h2 className="text-lg font-bold tracking-tight">Paket Tersedia</h2>
              <span className="text-gray-400 font-normal text-sm">({salePackages.length + otherPackages.length})</span>
            </div>
            <Link href="/search" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
              Semua Paket <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {salePackages.length === 0 && otherPackages.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Belum ada paket tersedia</p>
              <p className="text-xs text-gray-400 mt-1">Nantikan pembaruan dari {tenantData.name}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {salePackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
              {otherPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} href={pkg.doc_drive_link || null} />
              ))}
            </div>
          )}
        </section>

        {/* Dokumentasi */}
        <PackageDocumentationSection packages={docPackages} />
      </div>
    </main>
  )
}