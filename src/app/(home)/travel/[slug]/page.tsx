import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Users, BadgeCheck, Package, ChevronRight, Phone, Mail, MessageCircle, Building2, Globe, Award, Star } from "lucide-react"
import { getPackageAvailable } from "@/lib/utils"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { enrichTenantsWithDetail } from "@/lib/tenant-detail-fields"
import type { Package as PackageType, Tenant } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/server"
import TravelGalleryMosaic from "@/components/shared/travel-gallery-mosaic"
import { PackageDocumentationSection } from "@/components/shared/package-documentation"
import PackageCardShared from "@/components/shared/package-card"

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

function PackageCard({ pkg, href: _href }: { pkg: PackageRow; href?: string | null }) {
  return (
    <PackageCardShared pkg={pkg as unknown as PackageType} showTravel={false} />
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
        .from("participants")
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
    <main className="min-h-screen bg-ivory-50">
      {/* Hero — flat emerald-deep */}
      <section className="relative overflow-hidden bg-emerald-deep">
        {heroImage && (
          <div className="absolute inset-0">
            <Image src={heroImage} alt="" fill className="object-cover" unoptimized priority />
          </div>
        )}
        <div className="absolute inset-0 bg-emerald-deep/80" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-14 sm:pb-20">
          <div className="flex items-center justify-start mb-8">
            <Link
              href="/travel"
              className="inline-flex items-center gap-1.5 text-xs text-ivory/80 hover:text-ivory transition-colors border border-ivory/20 bg-emerald-deep/50 px-3 py-1.5 rounded-full"
            >
              ← Semua Travel Partner
            </Link>
          </div>

          <div className="flex-1 text-ivory">
            <div className="flex items-center gap-5 mb-5">
              {tenantData.logo_url ? (
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-ivory-card overflow-hidden flex items-center justify-center">
                    <Image
                      src={tenantData.logo_url}
                      alt={tenantData.name}
                      width={84}
                      height={84}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  {tenantData.is_verified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-dark rounded-full flex items-center justify-center ring-[3px] ring-ivory-card">
                      <BadgeCheck className="w-4 h-4 text-ivory" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-ivory shrink-0" style={{ background: `${primaryColor}dd` }}>
                  {tenantData.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight first-letter:uppercase">{tenantData.name}</h1>
                <p className="text-ivory/85 text-lg mt-0.5 font-medium">
                  {tenantData.is_verified ? "Travel Partner Terverifikasi" : "Travel Partner UmrahQu"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ivory/80 mb-6">
              {tenantData.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tenantData.city}</span>}
              {tenantData.founded_year && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />Sejak {tenantData.founded_year}</span>}
              <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{salePackages.length + otherPackages.length} Paket</span>
              {totalJamaah > 0 && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{totalJamaah.toLocaleString("id-ID")}+ Jamaah</span>}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#paket-tersedia"
                className="inline-flex items-center gap-2 bg-gold text-emerald-deep text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gold-dark transition-colors"
              >
                <Package className="w-4 h-4" /> Lihat Paket
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Tentang — editorial */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-6 w-1 rounded-full bg-emerald-dark" />
                <h2 className="text-lg font-bold tracking-tight text-emerald-deep">Tentang Kami</h2>
              </div>

              <div className="rounded-2xl bg-ivory-card border border-ivory-border p-5 sm:p-6">
                <p className="text-ivory-ink/70 leading-relaxed">
                  {tenantData.description || "Biro perjalanan umrah & haji terpercaya."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-ivory-card border border-ivory-border px-3.5 py-3.5 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-dark/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-dark" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-ivory-ink/70 uppercase tracking-wide">Beroperasi</p>
                    <p className="text-sm font-semibold text-emerald-deep truncate">Sejak {tenantData.founded_year || "-"}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-ivory-card border border-ivory-border px-3.5 py-3.5 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-dark/10 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4 h-4 text-emerald-dark" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-ivory-ink/70 uppercase tracking-wide">Verifikasi</p>
                    <p className="text-sm font-semibold text-emerald-dark truncate">{tenantData.is_verified ? "Terverifikasi" : "Proses"}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-ivory-card border border-ivory-border px-3.5 py-3.5 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-dark/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-emerald-dark" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-ivory-ink/70 uppercase tracking-wide">Kuota Tersedia</p>
                    <p className="text-sm font-semibold text-emerald-deep truncate">{totalAvailable} kursi</p>
                  </div>
                </div>
              </div>

              {/* Legalitas inline */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-dark bg-emerald-dark/10 border border-emerald-dark/25 rounded-full px-3.5 py-1.5">
                  <Award className="w-3.5 h-3.5" />
                  {tenantData.accredited_at
                    ? `Akreditasi ${new Date(tenantData.accredited_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Akreditasi Kemenhaj"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ivory-ink/70 bg-ivory border border-ivory-border rounded-full px-3.5 py-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  {tenantData.slug}.umrahqu.com
                </span>
              </div>
            </div>

            {/* Kontak kilat */}
            <aside className="lg:col-span-1">
              <div className="bg-emerald-deep rounded-2xl p-6 text-ivory sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-ivory/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-gold" />
                  </span>
                  <h3 className="text-sm font-bold">Hubungi Langsung</h3>
                </div>
                <p className="text-xs text-ivory/70 mb-4 leading-relaxed">
                  Konsultasi gratis dengan {tenantData.name} — tim kami siap membantu.
                </p>
                <div className="space-y-2.5">
                  {tenantData.phone ? (
                    <>
                      <a
                        href={`https://wa.me/${tenantData.phone.replace(/[^0-9]/g, "")}?text=Assalamualaikum,%20saya%20tertarik%20dengan%20paket%20umrah%20${encodeURIComponent(tenantData.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-emerald-deep text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${tenantData.phone}`}
                        className="flex items-center gap-3 bg-ivory/10 hover:bg-ivory/15 rounded-xl px-4 py-2.5 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-gold shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-ivory/60 uppercase tracking-wide">Telepon</p>
                          <p className="text-xs font-semibold truncate">{tenantData.phone}</p>
                        </div>
                      </a>
                    </>
                  ) : null}
                  <a
                    href={`mailto:${tenantData.contact_email || `info@${tenantData.slug}.com`}`}
                    className="flex items-center gap-3 bg-ivory/10 hover:bg-ivory/15 rounded-xl px-4 py-2.5 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-ivory/60 uppercase tracking-wide">Email</p>
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
                <span className="h-6 w-1 rounded-full bg-gold" />
                <h2 className="text-lg font-bold tracking-tight text-emerald-deep">Galeri Dokumentasi</h2>
              </div>
              <span className="text-xs text-ivory-ink/70">Klik untuk memperbesar · {galleryImages.length} foto</span>
            </div>
            <TravelGalleryMosaic images={galleryImages} alt={tenantData.name} />
          </section>
        )}

        {/* Paket Tersedia */}
        <section id="paket-tersedia" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-emerald-dark" />
              <h2 className="text-lg font-bold tracking-tight text-emerald-deep">Paket Tersedia</h2>
              <span className="text-ivory-ink/70 font-normal text-sm">({salePackages.length + otherPackages.length})</span>
            </div>
            <Link href="/search" className="text-xs font-semibold text-emerald-dark hover:text-emerald-deep inline-flex items-center gap-1">
              Semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {salePackages.length === 0 && otherPackages.length === 0 ? (
            <div className="text-center py-14 bg-ivory-card rounded-3xl border border-ivory-border">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-dark/10 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-emerald-dark" />
              </div>
              <p className="text-ivory-ink/70 text-sm font-medium">Belum ada paket tersedia</p>
              <p className="text-xs text-ivory-ink/70 mt-1">Nantikan pembaruan dari {tenantData.name}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
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
