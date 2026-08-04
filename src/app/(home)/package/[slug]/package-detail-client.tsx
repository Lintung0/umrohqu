"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Users, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, BookmarkPlus, BookmarkCheck, GitCompare, Loader2, ChevronRight,
  Share2, Phone, MessageCircle, ArrowUp, ChevronDown, Heart,
} from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import ImageGallery from "@/components/shared/image-gallery"
import { Button } from "@/components/ui/button"
import SeatAvailabilityBar from "@/components/shared/seat-availability-bar"
import { getSeatAvailability } from "@/lib/utils"
import { toast } from "sonner"

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
  travel: { id: string; name: string; slug: string; is_verified?: boolean; logo_url?: string | null; city?: string | null; description?: string | null; phone?: string | null } | null
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

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-muted-foreground">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  )
}

export default function PackageDetailClient({ pkg, reviews: initialReviews, images: initialImages }: Props) {
  const TAB_ITEMS = [
    { id: "overview", label: "Overview" },
    { id: "facilities", label: "Fasilitas" },
    { id: "reviews", label: `Ulasan (${initialReviews.length})` },
  ]

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const tabRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const avgRating = initialReviews.length > 0
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0

  const seat = getSeatAvailability(pkg.available, pkg.quota)
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  // Rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: initialReviews.filter((r) => r.rating === star).length,
  }))

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect()
        setShowStickyCta(rect.bottom < 0)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: pkg.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const hotelInfo = (pkg.hotel_info || {}) as any
  const facilitiesList: string[] = Array.isArray(pkg.facilities) ? pkg.facilities : typeof pkg.facilities === "object" && pkg.facilities?.includes ? pkg.facilities.includes : []
  const excludesList: string[] = typeof pkg.facilities === "object" && pkg.facilities?.excludes ? pkg.facilities.excludes : []

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50/80 to-white">
      {/* Hero Gallery */}
      <div className="relative">
        {initialImages && initialImages.length > 1 ? (
          <ImageGallery images={initialImages} title={pkg.name} />
        ) : (
          <div
            className="relative h-64 sm:h-80 md:h-96 cursor-pointer"
            onClick={() => setIsImageZoomed(!isImageZoomed)}
          >
            {pkg.image_url ? (
              <Image
                src={pkg.image_url}
                alt={pkg.name}
                fill
                className={`object-cover transition-transform duration-700 ${isImageZoomed ? "scale-150" : "scale-100"}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

            {/* Floating Badges */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2 z-10">
              {pkg.is_promo && discount > 0 && (
                <span className="animate-pulse bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> PROMO -{discount}%
                </span>
              )}
              {pkg.type && (
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 ${
                  pkg.type === "vip" ? "bg-amber-400/90 text-amber-900" :
                  pkg.type === "plus" ? "bg-purple-500/90 text-white" :
                  pkg.type === "furoda" ? "bg-rose-500/90 text-white" :
                  "bg-emerald-500/90 text-white"
                }`}>
                  {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); handleShare() }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist() }}
                className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 ${
                  isWishlisted ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {togglingWishlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />}
              </button>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 z-10">
              <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
                  <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/search" className="hover:text-white transition-colors">Cari Paket</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white/80 truncate">{pkg.name}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-2xl">{pkg.name}</h1>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {pkg.duration_days && (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />{pkg.duration_days} Hari
                    </span>
                  )}
                  {pkg.departure_date && (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />{new Date(pkg.departure_date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                    </span>
                  )}
                  {avgRating > 0 && (
                    <span className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm border border-amber-400/30 px-3 py-1.5 rounded-full text-white text-xs font-medium">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      {avgRating.toFixed(1)} ({initialReviews.length} ulasan)
                    </span>
                  )}
                  {pkg.departure_city && (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />{pkg.departure_city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce z-10 hidden sm:block">
              <ChevronDown className="w-5 h-5 text-white/50" />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats Bar - Horizontal Scroll on Mobile */}
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible scrollbar-hide">
              {pkg.duration_days && (
                <div className="min-w-[120px] bg-white border border-border/60 rounded-xl p-3 text-center hover:border-primary/30 hover:shadow-md transition-all group">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Durasi</p>
                  <p className="text-sm font-bold mt-0.5">{pkg.duration_days} Hari</p>
                </div>
              )}
              {pkg.airline && (
                <div className="min-w-[120px] bg-white border border-border/60 rounded-xl p-3 text-center hover:border-primary/30 hover:shadow-md transition-all group">
                  <Plane className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maskapai</p>
                  <p className="text-sm font-bold mt-0.5">{pkg.airline}</p>
                </div>
              )}
              {pkg.departure_city && (
                <div className="min-w-[120px] bg-white border border-border/60 rounded-xl p-3 text-center hover:border-primary/30 hover:shadow-md transition-all group">
                  <MapPin className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Berangkat</p>
                  <p className="text-sm font-bold mt-0.5">{pkg.departure_city}</p>
                </div>
              )}
              <div className="min-w-[120px] bg-white border border-border/60 rounded-xl p-3 text-center hover:border-primary/30 hover:shadow-md transition-all group">
                <Users className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sisa Kursi</p>
                <p className="text-sm font-bold mt-0.5">{seat.available}</p>
              </div>
            </div>

            {/* Travel Info Card */}
            {pkg.travel && (
              <Link href={`/travel/${pkg.travel.slug}`} className="group block">
                <div className="bg-white border border-border/60 rounded-2xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    {pkg.travel.logo_url ? (
                      <Image src={pkg.travel.logo_url} alt={pkg.travel.name} width={48} height={48} className="rounded-xl object-cover ring-2 ring-primary/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-lg font-bold text-white">{pkg.travel.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{pkg.travel.name}</span>
                        {pkg.travel.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      {pkg.travel.city && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{pkg.travel.city}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat Profil <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Tabs */}
            <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <div ref={tabRef} className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                {activeTab === "overview" && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {pkg.description && (
                      <div className="relative bg-gradient-to-br from-primary/5 via-emerald-50/50 to-transparent rounded-2xl p-5 border border-primary/10">
                        <div className="absolute top-3 right-3 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
                        <p className="text-sm text-muted-foreground leading-relaxed relative">{pkg.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        pkg.airline && { icon: Plane, label: "Maskapai", value: pkg.airline },
                        pkg.duration_days && { icon: Clock, label: "Durasi", value: `${pkg.duration_days} Hari` },
                        hotelInfo.makkah && { icon: Hotel, label: "Hotel Makkah", value: hotelInfo.makkah },
                        hotelInfo.madinah && { icon: Hotel, label: "Hotel Madinah", value: hotelInfo.madinah },
                      ].filter(Boolean).map((item: any) => (
                        <div key={item.label} className="group flex items-center gap-3 bg-white border border-border/60 rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                            <p className="text-sm font-semibold truncate mt-0.5">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pkg.departure_city && (
                      <div className="flex items-center gap-3 bg-white border border-border/60 rounded-xl p-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-50 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Kota Keberangkatan</p>
                          <p className="text-sm font-semibold">{pkg.departure_city}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "facilities" && (
                  <div className="grid sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {facilitiesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          Termasuk
                        </h3>
                        <ul className="space-y-2.5">
                          {facilitiesList.map((item: string) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              </div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excludesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          Tidak Termasuk
                        </h3>
                        <ul className="space-y-2.5">
                          {excludesList.map((item: string) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle className="w-3 h-3 text-red-400" />
                              </div>
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
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {initialReviews.length > 0 ? (
                      <>
                        {/* Rating Summary */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200/50">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
                            <div className="flex gap-0.5 justify-center mt-2">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5">{initialReviews.length} ulasan</div>
                          </div>
                          <div className="flex-1 w-full sm:w-auto space-y-1.5">
                            {ratingBreakdown.map(({ star, count }) => (
                              <RatingBar key={star} star={star} count={count} total={initialReviews.length} />
                            ))}
                          </div>
                        </div>

                        {/* Review List */}
                        <div className="space-y-4">
                          {initialReviews.map((r, idx) => (
                            <div key={r.id} className="border-b border-border/50 pb-4 last:border-0" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-emerald-50 flex items-center justify-center ring-2 ring-primary/5">
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
                              {r.review && <p className="text-sm text-muted-foreground leading-relaxed ml-12">{r.review}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Star className="w-7 h-7 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">Belum ada ulasan</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Sidebar */}
          <div className="lg:col-span-1" ref={sidebarRef}>
            <div className="bg-white border border-border/60 rounded-2xl p-5 sticky top-20 space-y-4 shadow-sm">
              {/* Price Hero */}
              <div className="relative bg-gradient-to-br from-primary/5 via-emerald-50/50 to-transparent rounded-2xl p-5 -mt-1 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                {pkg.original_price && (
                  <p className="text-sm text-muted-foreground line-through relative">{formatRupiah(pkg.original_price)}</p>
                )}
                <div className="flex items-baseline gap-2 relative">
                  <p className="text-3xl font-bold text-primary">{formatRupiah(pkg.price)}</p>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-0.5 rounded-full shadow-lg animate-pulse">-{discount}%</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 relative">per orang · belum termasuk biaya layanan</p>
              </div>

              {/* Seat Availability */}
              <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="detail" />

              {/* Quick Info */}
              <div className="space-y-2.5 text-sm">
                {[
                  pkg.duration_days && { icon: Clock, label: "Durasi", value: `${pkg.duration_days} Hari` },
                  pkg.airline && { icon: Plane, label: "Maskapai", value: pkg.airline },
                  pkg.departure_city && { icon: MapPin, label: "Berangkat dari", value: pkg.departure_city },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs">
                      <span className="text-muted-foreground">{item.label}:</span>{" "}
                      <span className="font-semibold">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link href={`/checkout?package=${pkg.id}`} className="block">
                  <Button className="w-full h-12 font-semibold text-sm bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
                    Booking
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 text-xs gap-1.5 transition-all ${isWishlisted ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""}`}
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
                   <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-9 text-xs gap-1.5"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: pkg.name,
                            text: `Lihat paket umroh: ${pkg.name}`,
                            url: window.location.href,
                          })
                        } else {
                          navigator.clipboard.writeText(window.location.href)
                          toast.success("Link disalin ke clipboard")
                        }
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5" /> Bagikan
                    </Button>
                </div>
              </div>

              {/* Contact Travel */}
              {pkg.travel && (
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground mb-2.5">Hubungi travel langsung:</p>
                  <div className="flex gap-2">
                    {pkg.travel.phone && (
                      <a href={`https://wa.me/${pkg.travel.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </Button>
                      </a>
                    )}
                    <Link href={`/travel/${pkg.travel.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Telepon
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="border-t border-border/50 pt-3 space-y-2">
                {[
                  { icon: Shield, text: "Pembayaran aman & terenkripsi" },
                  { icon: BadgeCheck, text: "Travel partner terverifikasi" },
                  { icon: CheckCircle, text: "Jaminan keberangkatan" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <item.icon className="w-3 h-3 text-emerald-600" />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border/50 p-3 z-50 lg:hidden animate-in slide-in-from-bottom duration-300">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-primary truncate">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-muted-foreground">per orang</p>
            </div>
            <Link href={`/checkout?package=${pkg.id}`}>
              <Button className="h-11 px-6 font-semibold text-sm bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/20">
                Booking
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 w-10 h-10 rounded-full bg-white border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all z-40 animate-in fade-in zoom-in duration-200"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </main>
  )
}
