"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Users, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, BookmarkPlus, BookmarkCheck, Loader2, ChevronRight,
  Share2, Phone, MessageCircle, ArrowUp, ChevronDown, Heart, Info, Wifi,
  Utensils, Car, Camera, Globe, Award, TrendingUp, Sparkles,
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

export default function PackageDetailClient({ pkg, reviews: initialReviews, images: initialImages }: Props) {
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
  const itineraryList: string[] = Array.isArray(pkg.itinerary) ? pkg.itinerary.map((item: any) => typeof item === "string" ? item : item.text || item.day || JSON.stringify(item)) : []

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Image */}
      <div className="relative bg-black">
        {initialImages && initialImages.length > 1 ? (
          <ImageGallery images={initialImages} title={pkg.name} />
        ) : (
          <div className="relative h-48 sm:h-56 md:h-64">
            {pkg.image_url ? (
              <Image
                src={pkg.image_url}
                alt={pkg.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-emerald-900/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        )}

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-20">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleWishlist}
            className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 ${
              isWishlisted ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {togglingWishlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />}
          </button>
        </div>

        {/* Type Badge */}
        {pkg.type && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 ${
              pkg.type === "vip" ? "bg-amber-400/90 text-amber-900" :
              pkg.type === "plus" ? "bg-purple-500/90 text-white" :
              pkg.type === "furoda" ? "bg-rose-500/90 text-white" :
              "bg-emerald-500/90 text-white"
            }`}>
              {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
            </span>
          </div>
        )}

        {/* Promo Badge */}
        {pkg.is_promo && discount > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 sm:top-6">
            <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> PROMO -{discount}%
            </span>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
              <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/search" className="hover:text-white transition-colors">Cari Paket</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/80 truncate">{pkg.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{pkg.name}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* LEFT: Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick Info Chips */}
            <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {pkg.duration_days && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary text-xs font-medium px-3 py-2 rounded-xl">
                    <Clock className="w-3.5 h-3.5" /> {pkg.duration_days} Hari{pkg.duration_nights ? ` / ${pkg.duration_nights} Malam` : ""}
                  </span>
                )}
                {pkg.airline && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-2 rounded-xl">
                    <Plane className="w-3.5 h-3.5" /> {pkg.airline}
                  </span>
                )}
                {pkg.departure_city && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-xs font-medium px-3 py-2 rounded-xl">
                    <MapPin className="w-3.5 h-3.5" /> {pkg.departure_city}
                  </span>
                )}
                {pkg.departure_date && (
                  <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-medium px-3 py-2 rounded-xl">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(pkg.departure_date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-xs font-medium px-3 py-2 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {avgRating.toFixed(1)} ({initialReviews.length})
                  </span>
                )}
              </div>
            </div>

            {/* Travel Partner Card */}
            {pkg.travel && (
              <Link href={`/travel/${pkg.travel.slug}`} className="block group">
                <div className="bg-white border border-border/60 rounded-2xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    {pkg.travel.logo_url ? (
                      <Image src={pkg.travel.logo_url} alt={pkg.travel.name} width={44} height={44} className="rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                        <span className="text-base font-bold text-white">{pkg.travel.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{pkg.travel.name}</span>
                        {pkg.travel.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      {pkg.travel.city && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{pkg.travel.city}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            )}

            {/* Tabs */}
            <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {pkg.description && (
                      <div className="bg-gradient-to-br from-primary/5 via-emerald-50/30 to-transparent rounded-2xl p-5 border border-primary/10">
                        <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pkg.airline && <InfoCard icon={Plane} label="Maskapai" value={pkg.airline} color="blue" />}
                      {pkg.duration_days && <InfoCard icon={Clock} label="Durasi" value={`${pkg.duration_days} Hari`} />}
                      {pkg.hotel_makkah && <InfoCard icon={Hotel} label="Hotel Makkah" value={`${pkg.hotel_makkah}${pkg.hotel_makkah_stars ? ` (${pkg.hotel_makkah_stars}★)` : ""}`} color="amber" />}
                      {pkg.hotel_madinah && <InfoCard icon={Hotel} label="Hotel Madinah" value={`${pkg.hotel_madinah}${pkg.hotel_madinah_stars ? ` (${pkg.hotel_madinah_stars}★)` : ""}`} color="amber" />}
                      {pkg.departure_city && <InfoCard icon={MapPin} label="Kota Keberangkatan" value={pkg.departure_city} />}
                      {pkg.quota && <InfoCard icon={Users} label="Kuota" value={`${pkg.quota} orang`} color="blue" />}
                    </div>
                  </div>
                )}

                {/* Itinerary Tab */}
                {activeTab === "itinerary" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {itineraryList.length > 0 ? (
                      itineraryList.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{idx + 1}</span>
                            </div>
                            {idx < itineraryList.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                          </div>
                          <div className="pb-4 flex-1">
                            <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Belum ada itinerary</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Facilities Tab */}
                {activeTab === "facilities" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {includesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          Termasuk
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground bg-emerald-50/50 rounded-xl px-3 py-2.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
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
                        <div className="grid sm:grid-cols-2 gap-2">
                          {excludesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground bg-red-50/50 rounded-xl px-3 py-2.5">
                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {facilitiesList.length > 0 && includesList.length === 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          Fasilitas
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {facilitiesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground bg-emerald-50/50 rounded-xl px-3 py-2.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {facilitiesList.length === 0 && includesList.length === 0 && excludesList.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Belum ada info fasilitas</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {initialReviews.length > 0 ? (
                      <>
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

                        <div className="space-y-4">
                          {initialReviews.map((r) => (
                            <div key={r.id} className="border-b border-border/50 pb-4 last:border-0">
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
              {/* Price */}
              <div className="text-center pb-4 border-b border-border/50">
                {pkg.original_price && (
                  <p className="text-sm text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
                )}
                <div className="flex items-baseline justify-center gap-2">
                  <p className="text-3xl font-bold text-primary">{formatRupiah(pkg.price)}</p>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 rounded-full">-{discount}%</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">per orang · belum termasuk biaya layanan</p>
              </div>

              {/* Seat Availability */}
              <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="detail" />

              {/* Quick Info */}
              <div className="space-y-2.5 text-sm">
                {pkg.duration_days && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs"><span className="text-muted-foreground">Durasi:</span> <span className="font-semibold">{pkg.duration_days} Hari</span></span>
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs"><span className="text-muted-foreground">Maskapai:</span> <span className="font-semibold">{pkg.airline}</span></span>
                  </div>
                )}
                {pkg.departure_city && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs"><span className="text-muted-foreground">Berangkat dari:</span> <span className="font-semibold">{pkg.departure_city}</span></span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link href={`/checkout?slug=${pkg.slug}`} className="block">
                  <Button className="w-full h-12 font-semibold text-sm bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
                    Booking Sekarang
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
                  <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handleShare}>
                    <Share2 className="w-3.5 h-3.5" /> Bagikan
                  </Button>
                </div>
              </div>

              {/* Contact */}
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
                        <Phone className="w-3.5 h-3.5" /> Lihat Travel
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Trust */}
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
            <Link href={`/checkout?slug=${pkg.slug}`}>
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