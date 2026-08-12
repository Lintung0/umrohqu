"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Users, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, BookmarkPlus, BookmarkCheck, Loader2, ChevronLeft, ChevronRight,
  Share2, Phone, MessageCircle, ArrowUp, ChevronDown, Heart, Info, Wifi,
  Utensils, Car, Camera, Globe, Award, TrendingUp, Sparkles, Package, Maximize2, X,
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { decodeUnicodeEscapes } from "@/lib/utils"
import ImageGallery from "@/components/shared/image-gallery"
import { Button } from "@/components/ui/button"
import SeatAvailabilityBar from "@/components/shared/seat-availability-bar"
import { getSeatAvailability } from "@/lib/utils"
import { toast } from "sonner"
import { useCompare } from "@/lib/compare-context"
import type { Package as PackageType } from "@/lib/types"

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
  duration_nights: number | null
  airline: string | null
  hotel_info: any
  facilities: any
  includes: any
  excludes: any
  itinerary: any
  status: string
  image_url: string | null
  tenant_id: string
  is_promo: boolean
  type: string | null
  hotel_makkah: string | null
  hotel_makkah_stars: number | null
  hotel_madinah: string | null
  hotel_madinah_stars: number | null
  travel: { id: string; name: string; slug: string; is_verified?: boolean; logo_url?: string | null; city?: string | null; description?: string | null; phone?: string | null; contact_email?: string | null } | null
}

interface ReviewRow {
  id: string
  rating: number
  review: string | null
  created_at: string
  customer_id: string | null
}

interface GalleryItem {
  url: string
  type: "image" | "video"
}

interface Props {
  pkg: PackageDetail
  reviews: ReviewRow[]
  reviewerMap?: Record<string, string>
  images?: string[]
  galleryItems?: GalleryItem[]
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

function InfoCard({ icon: Icon, label, value, color = "primary" }: { icon: any; label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    primary: "from-primary/10 to-emerald-50 text-primary",
    amber: "from-amber-100 to-orange-50 text-amber-600",
    blue: "from-blue-100 to-sky-50 text-blue-600",
    purple: "from-purple-100 to-violet-50 text-purple-600",
  }
  return (
    <div className="group flex items-center gap-3 bg-white border border-border/60 rounded-xl p-3.5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-semibold truncate mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function PackageDetailClient({ pkg, reviews: initialReviews, reviewerMap = {}, images: initialImages, galleryItems }: Props) {
  const router = useRouter()
  const { toggleSave, isSaved } = useCompare()
  const TAB_ITEMS = [
    { id: "overview", label: "Ringkasan", icon: Info },
    { id: "itinerary", label: "Itinerary", icon: Calendar },
    { id: "facilities", label: "Fasilitas", icon: CheckCircle },
    { id: "reviews", label: `Ulasan (${initialReviews.length})`, icon: Star },
  ]
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null)
  const [singleImageLightbox, setSingleImageLightbox] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const avgRating = initialReviews.length > 0
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0

  const seat = getSeatAvailability(pkg.available, pkg.quota)
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: initialReviews.filter((r) => r.rating === star).length,
  }))

  const hotelInfo = (pkg.hotel_info || {}) as any
  const facilitiesList: string[] = Array.isArray(pkg.facilities) ? pkg.facilities : []
  const includesList: string[] = Array.isArray(pkg.includes) ? pkg.includes : (typeof pkg.facilities === "object" && pkg.facilities?.includes ? pkg.facilities.includes : [])
  const excludesList: string[] = Array.isArray(pkg.excludes) ? pkg.excludes : (typeof pkg.facilities === "object" && pkg.facilities?.excludes ? pkg.facilities.excludes : [])
  const itineraryList: { day: number; title: string; description: string }[] = Array.isArray(pkg.itinerary)
    ? pkg.itinerary.map((item: any, idx: number) => {
        if (typeof item === "string") return { day: idx + 1, title: `Hari ke-${idx + 1}`, description: item }
        if (item && typeof item === "object") {
          return {
            day: Number(item.day) || idx + 1,
            title: item.title ? String(item.title) : `Hari ke-${idx + 1}`,
            description: item.description || item.text || "",
          }
        }
        return { day: idx + 1, title: `Hari ke-${idx + 1}`, description: "" }
      })
    : []

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
      toast.success("Dihapus dari wishlist")
    } else {
      const { data } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, package_id: pkg.id })
        .select("id")
        .single()
      if (data) { setIsWishlisted(true); setWishlistId(data.id); toast.success(" Ditambahkan ke wishlist") }
    }
    setTogglingWishlist(false)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: pkg.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link disalin ke clipboard")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-12 sm:pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/search" className="hover:text-primary transition-colors">Cari Paket</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{pkg.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm relative">
              {initialImages && initialImages.length > 1 ? (
                <ImageGallery images={initialImages} items={galleryItems} title={pkg.name} />
              ) : (
                <div
                  className="relative aspect-[16/9] cursor-pointer"
                  onClick={() => pkg.image_url && setSingleImageLightbox(true)}
                >
                  {pkg.image_url ? (
                    <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-emerald-50 flex items-center justify-center">
                      <Package className="w-16 h-16 text-primary/30" />
                    </div>
                  )}
                  {/* Maximize button for single image */}
                  {pkg.image_url && (
                    <button
                      className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
                      aria-label="Perbesar foto"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {pkg.type && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        pkg.type === "vip" ? "bg-amber-400 text-amber-900" :
                        pkg.type === "plus" ? "bg-purple-500 text-white" :
                        pkg.type === "furoda" ? "bg-rose-500 text-white" :
                        "bg-emerald-500 text-white"
                      }`}>
                        {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
                      </span>
                    )}
                    {pkg.is_promo && discount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {/* Floating Actions — always visible on top of image */}
              <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                <button onClick={handleShare} className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-gray-600 hover:bg-white hover:text-primary transition-all shadow-sm">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={toggleWishlist} className={`w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center transition-all shadow-sm ${isWishlisted ? "text-rose-500" : "text-gray-600 hover:bg-white hover:text-rose-500"}`}>
                  {togglingWishlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm mt-4">
              <div className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pkg.airline && <InfoCard icon={Plane} label="Maskapai" value={decodeUnicodeEscapes(pkg.airline)} color="blue" />}
                      {pkg.duration_days && <InfoCard icon={Clock} label="Durasi" value={`${pkg.duration_days} Hari`} />}
                      {pkg.hotel_makkah && <InfoCard icon={Hotel} label="Hotel Makkah" value={pkg.hotel_makkah} color="amber" />}
                      {pkg.hotel_madinah && <InfoCard icon={Hotel} label="Hotel Madinah" value={pkg.hotel_madinah} color="amber" />}
                      {pkg.departure_city && <InfoCard icon={MapPin} label="Berangkat dari" value={pkg.departure_city} />}
                      {pkg.quota && <InfoCard icon={Users} label="Kuota" value={`${pkg.quota} orang`} color="blue" />}
                    </div>
                  </div>
                )}

                {/* Itinerary */}
                {activeTab === "itinerary" && (
                  <div className="animate-in fade-in duration-200">
                    {itineraryList.length > 0 ? (
                      <div className="relative">
                        {itineraryList.map((item, idx) => (
                          <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* Timeline line */}
                            {idx < itineraryList.length - 1 && (
                              <div className="absolute left-[15px] top-[32px] bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-primary/10" />
                            )}
                            {/* Day marker */}
                            <div className="relative z-10 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-md shadow-primary/20">
                                <span className="text-[10px] font-bold text-white">{item.day}</span>
                              </div>
                            </div>
                            {/* Content */}
                            <div className="flex-1 pt-1">
                              <div className="bg-gray-50 rounded-xl p-4 border border-border/40 hover:border-primary/20 hover:bg-primary/[0.02] transition-all">
                                <p className="text-xs font-semibold text-primary mb-1">Hari ke-{item.day}</p>
                                {item.title && <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>}
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                               </div>
                             </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">Belum ada itinerary</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Facilities */}
                {activeTab === "facilities" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {includesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          Termasuk
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-3 text-sm bg-emerald-50/80 border border-emerald-100 rounded-xl px-4 py-3 hover:bg-emerald-50 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="text-emerald-800">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {excludesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          Tidak Termasuk
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {excludesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-3 text-sm bg-red-50/80 border border-red-100 rounded-xl px-4 py-3 hover:bg-red-50 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                <XCircle className="w-4 h-4 text-red-400" />
                              </div>
                              <span className="text-red-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {includesList.length === 0 && excludesList.length === 0 && facilitiesList.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Info className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">Belum ada info fasilitas</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {initialReviews.length > 0 ? (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200/50">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
                            <div className="flex gap-0.5 justify-center mt-1" role="img" aria-label={`Rating ${avgRating.toFixed(1)} dari 5 bintang`}>
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{initialReviews.length} ulasan</div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {ratingBreakdown.map(({ star, count }) => (
                              <RatingBar key={star} star={star} count={count} total={initialReviews.length} />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {initialReviews.map((r) => {
                            const reviewerName = r.customer_id ? (reviewerMap[r.customer_id] || "Pengguna") : "Pengguna"
                            return (
                            <div key={r.id} className="border-b border-border/50 pb-3 last:border-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{reviewerName.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{reviewerName}</p>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex gap-0.5" role="img" aria-label={`Rating ${r.rating} dari 5 bintang`}>
                                      {[1,2,3,4,5].map((s) => (
                                        <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                                  </div>
                                </div>
                              </div>
                              {r.review && <p className="text-sm text-muted-foreground ml-10">{r.review}</p>}
                            </div>
                          )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                          <div className="relative">
                            <Star className="w-10 h-10 text-amber-300" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-amber-600">?</span>
                            </div>
                          </div>
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">Belum ada ulasan</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Jadilah yang pertama memberikan ulasan untuk paket ini setelah perjalanan Anda.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Info & Booking */}
          <div className="lg:col-span-1" ref={sidebarRef}>
            <div className="lg:sticky lg:top-24 space-y-3">
            {/* Title & Price */}
            <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm mb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-lg font-bold leading-tight">{pkg.name}</h1>
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-medium px-2 py-1 rounded-lg shrink-0">
                    <Star className="w-3 h-3 fill-amber-400" /> {avgRating.toFixed(1)}
                  </span>
                )}
              </div>
              {pkg.original_price && (
                <p className="text-sm text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
              )}
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">{formatRupiah(pkg.price)}</p>
                {discount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded">-{discount}%</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">per orang · belum termasuk biaya layanan</p>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                {pkg.duration_days && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{pkg.duration_days} Hari</span>
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Plane className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{decodeUnicodeEscapes(pkg.airline)}</span>
                  </div>
                )}
                {pkg.departure_city && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{pkg.departure_city}</span>
                  </div>
                )}
                {pkg.departure_date && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(pkg.departure_date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seat */}
            <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm mb-3">
              <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="detail" />
            </div>

            {/* CTA */}
            <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm mb-3 space-y-2.5">
              <Link href={`/checkout?slug=${pkg.slug}`} className="block">
                <Button className="w-full h-11 font-semibold text-sm bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                  Pesan
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs gap-1.5"
                onClick={() => {
                  toggleSave(pkg as unknown as PackageType)
                  toast.success(isSaved(pkg.id) ? "Dihapus dari tersimpan" : "Disimpan ke bookmark")
                  router.push("/compare")
                }}
              >
                {isSaved(pkg.id) ? (
                  <><BookmarkCheck className="w-3.5 h-3.5" /> Tersimpan</>
                ) : (
                  <><BookmarkPlus className="w-3.5 h-3.5" /> Bandingkan</>
                )}
              </Button>
            </div>

            {/* Travel */}
            {pkg.travel && (
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm mb-3">
                <Link href={`/travel/${pkg.travel.slug}`} className="flex items-center gap-3 group">
                  {pkg.travel.logo_url ? (
                    <Image src={pkg.travel.logo_url} alt={pkg.travel.name} width={40} height={40} className="rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white">{pkg.travel.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{pkg.travel.name}</span>
                      {pkg.travel.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    {pkg.travel.city && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{pkg.travel.city}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
                {pkg.travel.phone && (
                  <a href={`https://wa.me/${pkg.travel.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                    <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                      <MessageCircle className="w-3.5 h-3.5" /> Hubungi via WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Trust */}
            <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm">
              <div className="space-y-2">
                {[
                  { icon: Shield, text: "Pembayaran aman & terenkripsi" },
                  { icon: BadgeCheck, text: "Travel partner terverifikasi" },
                  { icon: CheckCircle, text: "Jaminan keberangkatan" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border/50 p-3 z-50 lg:hidden">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-primary truncate">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-muted-foreground">per orang</p>
            </div>
            <Link href={`/checkout?slug=${pkg.slug}`}>
              <Button className="h-10 px-5 font-semibold text-sm bg-primary shadow-lg shadow-primary/20">Pesan</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 w-9 h-9 rounded-full bg-white border border-border shadow flex items-center justify-center text-muted-foreground hover:text-primary transition-all z-40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Single Image Lightbox */}
      {singleImageLightbox && pkg.image_url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSingleImageLightbox(false)}
        >
          <button
            onClick={() => setSingleImageLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <Image
            src={pkg.image_url}
            alt={pkg.name}
            width={1200}
            height={800}
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
            unoptimized
          />
        </div>
      )}
    </main>
  )
}