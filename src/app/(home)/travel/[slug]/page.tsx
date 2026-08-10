import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Clock, Users, Plane, BadgeCheck, Shield, Package, ChevronRight, Phone, Mail, MessageCircle, Zap, Camera, Building2, Globe, FileCheck, Award, Play } from "lucide-react"
import { formatRupiah, getSeatAvailability } from "@/lib/utils"
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
  image_url: string | null
  is_promo: boolean
}

function PackageCard({ pkg }: { pkg: PackageRow }) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  const seat = getSeatAvailability(pkg.available, pkg.quota ?? 0)

  return (
    <Link href={`/package/${pkg.slug}`} className="block bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden">
          <Image
            src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
            alt={pkg.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
              pkg.type === "vip" ? "bg-amber-400 text-amber-900" :
              pkg.type === "plus" ? "bg-purple-500 text-white" :
              "bg-primary text-white"
            }`}>
              {pkg.type}
            </span>
            {pkg.is_promo && discount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors mb-2">{pkg.name}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
              {pkg.departure_cities?.[0] && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{pkg.departure_cities.join(", ")}</span>
                </div>
              )}
              {pkg.duration_days && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary shrink-0" />
                  {pkg.duration_days} Hari
                </div>
              )}
              {pkg.airline && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Plane className="w-3 h-3 text-primary shrink-0" />
                  {pkg.airline}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3 text-primary shrink-0" />
                Sisa {seat.available} kursi
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {pkg.original_price && (
                <p className="text-[11px] text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
              )}
              <p className="text-base font-bold text-primary">{formatRupiah(pkg.price)}<span className="text-[10px] text-muted-foreground font-normal">/org</span></p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
              Lihat <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function TravelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  let tenant: TenantRow | null = null
  let packages: PackageRow[] = []

  try {
    const tenantResult = await supabase
      .from("tenants")
      .select("id, slug, name, logo_url, city, description, founded_year, is_verified, is_featured, phone, contact_email, brand_color, ppiu_number, accredited_at, total_jamaah, gallery_urls, video_urls")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single()

    if (tenantResult.error) {
      console.error("Error fetching tenant:", tenantResult.error)
      notFound()
    }
    tenant = tenantResult.data as TenantRow
    if (!tenant) notFound()

    const packagesResult = await supabase
      .from("packages")
      .select("id, name, slug, type, departure_cities, duration_days, departure_month, price, original_price, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars, available, quota, image_url, is_promo")
      .eq("tenant_id", tenant.id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("price", { ascending: true })

    packages = (packagesResult.data as PackageRow[]) || []
  } catch (error) {
    console.error("Travel detail page error:", error)
    notFound()
  }

  const tenantData = tenant as TenantRow
  const pkgList = packages
  const primaryColor = tenantData.brand_color || "#0E5C4E"

  const galleryImages: string[] = Array.isArray(tenantData.gallery_urls) && tenantData.gallery_urls.length > 0
    ? tenantData.gallery_urls
    : pkgList.flatMap((p) => p.image_url ? [p.image_url] : [])

  const videoUrls: string[] = Array.isArray(tenantData.video_urls) ? tenantData.video_urls : []
  const totalJamaah = tenantData.total_jamaah || 0

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}aa)` }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg0MHYtMmg0em0tMTYtNHYySDI0di0yaDEyem0tMTYtNHYySDI0di0yaDEyek0yMCAyMHYySDE0di0yaDZ6bTE2IDB2MkgzNHYtMmg2ek0yMCAyNHYySDE0di0yaDZ6bTE2IDB2MkgzNHYtMmg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-4">
            ← Kembali ke Pencarian
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {tenantData.logo_url ? (
              <Image src={tenantData.logo_url} alt={tenantData.name} width={80} height={80} className="rounded-2xl ring-4 ring-white/20 shadow-xl" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white/20 shadow-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}cc)` }}>
                {tenantData.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{tenantData.name}</h1>
                {tenantData.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-400/90 text-emerald-900 px-2.5 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> PPIU Kemenag RI
                </span>
                {tenantData.is_featured && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-amber-400/90 text-amber-900 px-2.5 py-1 rounded-full">
                    <Zap className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                {tenantData.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tenantData.city}</span>}
                {tenantData.founded_year && <span>Sejak {tenantData.founded_year}</span>}
                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{pkgList.length} Paket</span>
                {totalJamaah > 0 && (
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{totalJamaah.toLocaleString("id-ID")}+ Jamaah</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pkgList.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Paket Aktif</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalJamaah > 0 ? `${totalJamaah.toLocaleString("id-ID")}+` : pkgList.reduce((s, p) => s + (p.available || 0), 0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Jamaah Diberangkatkan</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{tenantData.founded_year || "-"}</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Berdiri Sejak</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{tenantData.is_verified ? "✓" : "-"}</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Status Verifikasi</p>
          </div>
        </div>

        {/* About + Legalitas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 bg-white border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm mb-2">Tentang Kami</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{tenantData.description || "Biro perjalanan umroh & haji terpercaya."}</p>
            </div>
            {/* Legalitas Section */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Legalitas & Perizinan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Nomor Izin PPIU</p>
                    <p className="text-xs font-bold text-emerald-700">{tenantData.ppiu_number || "Terverifikasi Kemenag RI"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <Award className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Tanggal Akreditasi</p>
                    <p className="text-xs font-bold text-blue-700">
                      {tenantData.accredited_at
                        ? new Date(tenantData.accredited_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Aktif"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white border border-border rounded-xl p-3">
                  <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Status Platform</p>
                    <p className="text-xs font-bold text-primary">{tenantData.is_verified ? "Terverifikasi UmrohQ" : "Dalam Proses"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white border border-border rounded-xl p-3">
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Jamaah</p>
                    <p className="text-xs font-bold text-primary">
                      {totalJamaah > 0 ? `${totalJamaah.toLocaleString("id-ID")}+ Jamaah` : "Data tersedia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">Info Singkat</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Berdiri Sejak</p>
                  <p className="text-xs font-semibold">{tenantData.founded_year || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Total Paket</p>
                  <p className="text-xs font-semibold">{pkgList.length} paket aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Kuota Tersedia</p>
                  <p className="text-xs font-semibold">{pkgList.reduce((sum, p) => sum + (p.available || 0), 0)} jamaah</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Website</p>
                  <p className="text-xs font-semibold">{tenantData.slug}.umrohq.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multimedia Gallery */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Galeri Dokumentasi
          </h2>
          {galleryImages.length === 0 && videoUrls.length === 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="min-w-[180px] sm:min-w-[220px] aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/5 to-primary/0 border border-dashed border-primary/20 flex items-center justify-center shrink-0">
                  <div className="text-center">
                    <Camera className="w-6 h-6 text-primary/30 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Foto {i}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((img, i) => (
                <div key={`img-${i}`} className="min-w-[180px] sm:min-w-[220px] aspect-[4/3] rounded-xl overflow-hidden relative group shrink-0">
                  <Image src={img} alt={`Galeri ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
              {videoUrls.map((url, i) => (
                <div key={`vid-${i}`} className="min-w-[280px] sm:min-w-[320px] aspect-video rounded-xl overflow-hidden relative shrink-0 bg-black">
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    poster=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                    <Play className="w-2.5 h-2.5" /> Video
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Galeri dokumentasi perjalanan jemaah — scroll untuk lihat semua →</p>
        </div>

        {/* Packages */}
        <div>
          <h2 className="text-lg font-bold mb-4">Paket Tersedia <span className="text-muted-foreground font-normal text-sm">({pkgList.length})</span></h2>
          {pkgList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Belum ada paket aktif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pkgList.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">Hubungi {tenantData.name}</h2>
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
              <a href={`tel:${tenantData.phone}`} className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-gray-50 transition-colors">
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
            <a href={`mailto:${tenantData.contact_email || `info@${tenantData.slug}.com`}`} className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-gray-50 transition-colors">
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
