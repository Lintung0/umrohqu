"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Users, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, BookmarkPlus, BookmarkCheck, GitCompare, Loader2, ChevronRight,
} from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import ImageGallery from "@/components/shared/image-gallery"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

interface PackageDetail {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  original_price: number | null
  currency: string
  quota: number
  available: number | null
  departure_city: string | null
  departure_date: string | null
  duration_days: number | null
  airline: string | null
  hotel_info: any
  facilities: any
  status: string
  image_url: string | null
  tenant_id: string
  is_promo: boolean
  type: string | null
  travel: { id: string; name: string; slug: string; verified?: boolean; logo_url?: string | null; city?: string | null; description?: string | null } | null
}

interface ReviewRow {
  id: string
  rating: number
  review: string | null
  created_at: string
  customer: { full_name: string } | null
}

interface Props {
  pkg: PackageDetail
  reviews: ReviewRow[]
  images?: string[]
}

export default function PackageDetailClient({ pkg, reviews: initialReviews, images: initialImages }: Props) {
  const { t } = useTranslation()
  const TAB_ITEMS = [
    { id: "overview", label: "Overview" },
    { id: "facilities", label: "Fasilitas" },
    { id: "reviews", label: `Ulasan (${initialReviews.length})` },
  ]

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const supabase = createClient()
  const avgRating = initialReviews.length > 0
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0

  const available = pkg.available ?? pkg.quota
  const seatPercent = pkg.quota > 0 ? (available / pkg.quota) * 100 : 100
  const seatColor = seatPercent <= 20 ? "bg-red-500" : seatPercent <= 50 ? "bg-amber-500" : "bg-emerald-500"
  const seatLabel = seatPercent <= 20 ? "Segera Habis!" : seatPercent <= 50 ? "Terbatas" : "Tersedia"

  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  async function toggleWishlist() {
    setTogglingWishlist(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/login"; return }

    if (isWishlisted && wishlistId) {
      await supabase.from("wishlists").delete().eq("id", wishlistId)
      setIsWishlisted(false)
      setWishlistId(null)
    } else {
      const { data } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, package_id: pkg.id })
        .select("id")
        .single()
      if (data) { setIsWishlisted(true); setWishlistId(data.id) }
    }
    setTogglingWishlist(false)
  }

  const hotelInfo = (pkg.hotel_info || {}) as any
  const facilitiesList: string[] = Array.isArray(pkg.facilities) ? pkg.facilities : typeof pkg.facilities === "object" && pkg.facilities?.includes ? pkg.facilities.includes : []
  const excludesList: string[] = typeof pkg.facilities === "object" && pkg.facilities?.excludes ? pkg.facilities.excludes : []

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/search" className="hover:text-primary transition-colors">Cari Paket</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium truncate">{pkg.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery / Hero Image */}
            {initialImages && initialImages.length > 1 ? (
              <ImageGallery images={initialImages} title={pkg.name} />
            ) : (
              <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden">
                {pkg.image_url ? (
                  <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {pkg.is_promo && discount > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      PROMO {discount}%
                    </span>
                  )}
                  {pkg.type && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                      pkg.type === "vip" ? "bg-amber-400/90 text-amber-900" :
                      pkg.type === "plus" ? "bg-purple-500/90 text-white" :
                      "bg-primary/90 text-white"
                    }`}>
                      {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : "Reguler"}
                    </span>
                  )}
                </div>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">{pkg.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/80">
                    {pkg.duration_days && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{pkg.duration_days} Hari</span>}
                    {pkg.departure_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(pkg.departure_date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>}
                    {avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {avgRating.toFixed(1)} ({initialReviews.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Travel Info - Fully Clickable */}
            {pkg.travel && (
              <Link href={`/travel/${pkg.travel.slug}`} className="block bg-white border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-3">
                  {pkg.travel.logo_url ? (
                    <Image src={pkg.travel.logo_url} alt={pkg.travel.name} width={44} height={44} className="rounded-xl object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{pkg.travel.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{pkg.travel.name}</span>
                      {pkg.travel.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    {pkg.travel.city && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{pkg.travel.city}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            )}

            {/* Tabs */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                {activeTab === "overview" && (
                  <div className="space-y-5">
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pkg.airline && (
                        <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-3 border border-primary/10">
                          <Plane className="w-5 h-5 text-primary mb-2" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Maskapai</p>
                          <p className="text-sm font-semibold mt-0.5">{pkg.airline}</p>
                        </div>
                      )}
                      {pkg.duration_days && (
                        <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-3 border border-primary/10">
                          <Clock className="w-5 h-5 text-primary mb-2" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Durasi</p>
                          <p className="text-sm font-semibold mt-0.5">{pkg.duration_days} Hari</p>
                        </div>
                      )}
                      {hotelInfo.makkah && (
                        <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-3 border border-primary/10">
                          <Hotel className="w-5 h-5 text-primary mb-2" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hotel Makkah</p>
                          <p className="text-sm font-semibold mt-0.5 leading-snug">{hotelInfo.makkah}</p>
                        </div>
                      )}
                      {hotelInfo.madinah && (
                        <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-3 border border-primary/10">
                          <Hotel className="w-5 h-5 text-primary mb-2" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hotel Madinah</p>
                          <p className="text-sm font-semibold mt-0.5 leading-snug">{hotelInfo.madinah}</p>
                        </div>
                      )}
                    </div>
                    {pkg.departure_city && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Kota Keberangkatan</h3>
                        <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium w-fit">
                          <MapPin className="w-3 h-3" />{pkg.departure_city}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "facilities" && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {facilitiesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" /> Termasuk
                        </h3>
                        <ul className="space-y-2">
                          {facilitiesList.map((item: string) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excludesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" /> Tidak Termasuk
                        </h3>
                        <ul className="space-y-2">
                          {excludesList.map((item: string) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {facilitiesList.length === 0 && excludesList.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8 sm:col-span-2">Belum ada info fasilitas</p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-5">
                    {initialReviews.length > 0 ? (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
                            <div className="flex gap-0.5 justify-center mt-1">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{initialReviews.length} ulasan</div>
                          </div>
                        </div>
                        {initialReviews.map((r) => (
                          <div key={r.id} className="border-b border-border pb-4 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {r.customer?.full_name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{r.customer?.full_name || "Pengguna"}</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map((s) => (
                                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                                </div>
                              </div>
                            </div>
                            {r.review && <p className="text-sm text-muted-foreground leading-relaxed">{r.review}</p>}
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Belum ada ulasan</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-2xl p-5 sticky top-24 space-y-4">
              {/* Price */}
              <div>
                {pkg.original_price && (
                  <p className="text-sm text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
                )}
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-primary">{formatRupiah(pkg.price)}</p>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">-{discount}%</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">per orang · belum termasuk biaya layanan</p>
              </div>

              {/* Seat Availability Progress Bar */}
              <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> Kursi Tersisa
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    seatPercent <= 20 ? "bg-red-100 text-red-600" :
                    seatPercent <= 50 ? "bg-amber-100 text-amber-600" :
                    "bg-emerald-100 text-emerald-600"
                  }`}>
                    {seatLabel}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${seatColor}`} style={{ width: `${seatPercent}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{available} dari {pkg.quota} kursi</span>
                  <span>{Math.round(seatPercent)}%</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-2.5 text-sm">
                {pkg.duration_days && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs"><span className="text-muted-foreground">Durasi:</span> <span className="font-semibold">{pkg.duration_days} Hari</span></span>
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs"><span className="text-muted-foreground">Maskapai:</span> <span className="font-semibold">{pkg.airline}</span></span>
                  </div>
                )}
                {pkg.departure_city && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs"><span className="text-muted-foreground">Berangkat dari:</span> <span className="font-semibold">{pkg.departure_city}</span></span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-2 pt-1">
                <Link href={`/checkout?package=${pkg.id}`}>
                  <Button className="w-full h-12 font-semibold text-sm bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/20">
                    Booking Sekarang
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 h-9 ${isWishlisted ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""}`}
                    onClick={toggleWishlist}
                    disabled={togglingWishlist}
                  >
                    {togglingWishlist ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isWishlisted ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    {isWishlisted ? "Tersimpan" : "Simpan"}
                  </Button>
                  <Link href={`/compare?pkg=${pkg.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-9">
                      <GitCompare className="w-3.5 h-3.5" /> Bandingkan
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Trust badges */}
              <div className="border-t border-border pt-3 space-y-2">
                {[
                  { icon: Shield, text: "Pembayaran aman & terenkripsi" },
                  { icon: BadgeCheck, text: "Travel partner terverifikasi" },
                  { icon: CheckCircle, text: "Jaminan keberangkatan" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
