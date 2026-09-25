"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, Scale, Loader2, ChevronLeft, ChevronRight,
  Share2, Phone, MessageCircle, ArrowUp, ChevronDown, Heart, Info, Wifi,
  Utensils, Car, Camera, Globe, Award, TrendingUp, Sparkles, Package, Maximize2, X, Timer,
  BadgePercent, Users,
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { decodeUnicodeEscapes } from "@/lib/utils"
import ImageGallery from "@/components/shared/image-gallery"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import SeatAvailabilityBar from "@/components/shared/seat-availability-bar"
import { getPackageAvailable } from "@/lib/utils"
import { useCompare } from "@/lib/compare-context"
import type { Package as PackageType } from "@/lib/types"

interface PackageDetail {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  original_price: number | null
  cashback_amount?: number | null
  currency: string
  quota: number
  quota_taken: number | null
  available: number | null
  departure_city: string | null
  departure_date: string | null
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
    primary: "bg-emerald-dark/10 text-emerald-dark",
    gold: "bg-emerald-dark/10 text-emerald-dark",
    sand: "bg-emerald-dark/10 text-emerald-dark",
    clay: "bg-emerald-dark/10 text-emerald-dark",
  }
  return (
    <div className="group flex items-center gap-3 bg-ivory-card border border-ivory-border rounded-xl p-3.5 hover:border-emerald-dark/30 hover:shadow-md transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-ivory-ink/70 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-semibold line-clamp-2 [overflow-wrap:anywhere] mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function PackageDetailClient({ pkg, reviews: initialReviews, reviewerMap = {}, images: initialImages, galleryItems }: Props) {
  const router = useRouter()
  const { addToCompare, isFull, comparePackages } = useCompare()
  const [livePkg, setLivePkg] = useState<PackageDetail | null>(null)

  const supabase = createClient()

  // Realtime: refetch package seats/status on change
  useEffect(() => {
    const channel = supabase
      .channel(`package-${pkg.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "packages", filter: `id=eq.${pkg.id}` }, (payload) => {
        if (payload.new && (payload.new as any).id === pkg.id) {
          setLivePkg((payload.new as unknown) as PackageDetail)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [pkg.id, supabase])
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
  const [openDays, setOpenDays] = useState<number[]>([])
  const [singleImageLightbox, setSingleImageLightbox] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)

  const avgRating = initialReviews.length > 0
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0

  const displayPkg = livePkg || pkg
  const soldOut = getPackageAvailable(displayPkg) <= 0
  const blocked = displayPkg.status === "ongoing" || soldOut
  const currentAvailable = getPackageAvailable(displayPkg)
  const departedCount = Math.max(0, displayPkg.quota - currentAvailable)
  const departedPercent = displayPkg.quota > 0 ? Math.min(100, (departedCount / displayPkg.quota) * 100) : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: initialReviews.filter((r) => r.rating === star).length,
  }))

  const hotelInfo = (pkg.hotel_info || {}) as any
  const facilitiesList: string[] = Array.isArray(pkg.facilities) ? pkg.facilities : []
  const includesList: string[] = Array.isArray(pkg.includes) ? pkg.includes : (typeof pkg.facilities === "object" && pkg.facilities?.includes ? pkg.facilities.includes : [])
  const excludesList: string[] = Array.isArray(pkg.excludes) ? pkg.excludes : (typeof pkg.facilities === "object" && pkg.facilities?.excludes ? pkg.facilities.excludes : [])
  const cleanItineraryTitle = (raw: string) =>
    raw.replace(/^\s*(?:Hari\s*(?:ke)?[-: ]*\s?\d+|Day\s*\d+)\s*[:.-]?\s*/i, "").trim()

  const parseItinerary = (raw: any): { day: number; title: string; description: string }[] => {
    if (Array.isArray(raw)) {
      return raw.map((item: any, idx: number) => {
        if (typeof item === "string") return { day: idx + 1, title: `Hari ke-${idx + 1}`, description: item }
        if (item && typeof item === "object") {
          let description = String(item.description || item.details || item.text || "")
            // 1. Hapus SEMUA "Hari ke-N" dan "Hari N" dari mana saja (global) — INI YANG KUNCI biar "umrah AWAL MUSIM Hari ke-1" jadi bersih
            .replace(/hari\s*ke\s*\d+/gi, "")
            // 2. Ekstra hapus "Hari1"/"Hari 1" tanpa "ke"
            .replace(/\bHari\d+\b/gi, "")
            // 3. Hapus "Day N" dan "DayN"
            .replace(/\bDay\d+\b/gi, "")
            // 4. Strip prefix "Hari ke-N"/"Day N" dari START of description (jika ada, sebagai safety)
            .replace(/^\s*(?:Hari\s*(?:ke)?[-: ]*\s?\d+|Day\s*\d+)\s*[:.-]?\s*/i, "")
            // 5. Trim sisa spasi
            .trim()
          return {
            day: Number(item.day) || idx + 1,
            title: cleanItineraryTitle(item.title ? String(item.title) : ""),
            description,
          }
        }
        return { day: idx + 1, title: `Hari ke-${idx + 1}`, description: "" }
      })
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parseItinerary(parsed)
      } catch {}
      return raw
        .split(/\n+/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string, idx: number) => ({ day: idx + 1, title: `Hari ke-${idx + 1}`, description: line }))
    }
    return []
  }

  const itineraryList = parseItinerary(pkg.itinerary)

  useEffect(() => {
    let cancelled = false
    async function checkEligibility() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) { setCanReview(false); return }

        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("customer_id", user.id)
          .eq("package_id", pkg.id)
          .in("status", ["completed", "confirmed"])
          .maybeSingle()

        if (cancelled) return

        if (booking) {
          const { data: existingReview } = await supabase
            .from("reviews")
            .select("id")
            .eq("booking_id", booking.id)
            .eq("customer_id", user.id)
            .maybeSingle()

          if (!cancelled) {
            setCanReview(!existingReview)
            setEligibleBookingId(booking.id)
          }
        } else {
          if (!cancelled) setCanReview(false)
        }
      } catch {
        if (!cancelled) setCanReview(false)
      }
    }
    checkEligibility()
    return () => { cancelled = true }
  }, [pkg.id, pkg.tenant_id, supabase])

  async function handleSubmitReview() {
    if (reviewRating === 0) { toast.error("Pilih rating bintang"); return }
    setSubmittingReview(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Silakan login terlebih dahulu"); return }

      const { error } = await supabase.from("reviews").insert({
        booking_id: eligibleBookingId,
        customer_id: user.id,
        tenant_id: pkg.tenant_id,
        rating: reviewRating,
        review: reviewText.trim() || null,
        status: "pending",
      })
      if (error) {
        toast.error("Gagal mengirim ulasan: " + error.message)
      } else {
        toast.success("Ulasan berhasil dikirim! Akan tampil setelah moderasi.")
        setCanReview(false)
        setReviewRating(0)
        setReviewText("")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim ulasan")
    } finally {
      setSubmittingReview(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect()
        setShowStickyCta(rect.top < 0)
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
      toast.success("Dihapus dari wishlist", { action: { label: "Lihat Wishlist", onClick: () => router.push("/dashboard/wishlist") } })
    } else {
      const { data } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, package_id: pkg.id })
        .select("id")
        .single()
      if (data) { setIsWishlisted(true); setWishlistId(data.id); toast.success("Ditambahkan ke wishlist", { action: { label: "Lihat Wishlist", onClick: () => router.push("/dashboard/wishlist") } }) }
    }
    setTogglingWishlist(false)
  }

  async function handleCheckout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = `/login?redirect_to=${encodeURIComponent(`/checkout?slug=${pkg.slug}`)}`
      return
    }
    window.location.href = `/checkout?slug=${pkg.slug}`
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
    <main className="min-h-screen bg-ivory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-48 sm:pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-emerald-dark transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/search" className="hover:text-emerald-dark transition-colors">Cari Paket</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{pkg.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-ivory-card rounded-2xl border border-ivory-border overflow-hidden shadow-sm relative">
              {galleryItems && galleryItems.length > 0 ? (
                <ImageGallery images={initialImages || []} items={galleryItems} title={pkg.name} />
              ) : (
                <div
                  className="relative aspect-[16/9] cursor-pointer"
                  onClick={() => initialImages?.[0] && setSingleImageLightbox(true)}
                >
                  {initialImages?.[0] ? (
                    <Image src={initialImages[0]} alt={pkg.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-ivory-soft flex items-center justify-center">
                      <Package className="w-16 h-16 text-emerald-dark/40" />
                    </div>
                  )}
                  {/* Maximize button for single image */}
                  {initialImages?.[0] && (
                    <button
                      className="absolute top-3 right-3 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
                      aria-label="Perbesar foto"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <PackageStatusBadge status={displayPkg.status} />
                    {pkg.type && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        pkg.type === "vip" ? "bg-gold text-emerald-deep" :
                        pkg.type === "plus" ? "bg-emerald-dark text-ivory" :
                        pkg.type === "furoda" ? "bg-emerald-dark text-ivory" :
                        "bg-emerald-dark text-ivory"
                      }`}>
                        {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {/* Floating Actions — always visible on top of image */}
              <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                <button onClick={handleShare} className="w-10 h-10 rounded-lg bg-ivory-card/90 backdrop-blur flex items-center justify-center text-ivory-ink/70 hover:bg-ivory-card hover:text-emerald-dark transition-all shadow-sm">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={toggleWishlist} className={`w-10 h-10 rounded-lg bg-ivory-card/90 backdrop-blur flex items-center justify-center transition-all shadow-sm ${isWishlisted ? "text-rose-500" : "text-ivory-ink/70 hover:bg-ivory-card hover:text-rose-500"}`}>
                  {togglingWishlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-ivory-card rounded-2xl border border-ivory-border overflow-hidden shadow-sm mt-4">
              <div className="flex border-b border-ivory-border overflow-x-auto scrollbar-hide">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id ? "text-emerald-dark" : "text-ivory-ink/70 hover:text-emerald-deep"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-dark rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {pkg.description && (
                      <div className="bg-ivory-card border border-ivory-border border-l-4 border-l-emerald-dark rounded-r-xl p-4">
                        <p className="text-sm text-ivory-ink/70 leading-relaxed">{pkg.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pkg.airline && <InfoCard icon={Plane} label="Maskapai" value={decodeUnicodeEscapes(pkg.airline)} color="sand" />}
                      {pkg.duration_nights && <InfoCard icon={Clock} label="Durasi" value={`${pkg.duration_nights} Hari`} />}
                      {pkg.departure_city && <InfoCard icon={MapPin} label="Kota Berangkat" value={pkg.departure_city} />}
                      {pkg.departure_date && <InfoCard icon={Calendar} label="Tanggal Berangkat" value={new Date(pkg.departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />}
                      {pkg.hotel_makkah && <InfoCard icon={Hotel} label="Hotel Makkah" value={pkg.hotel_makkah} color="gold" />}
                      {pkg.hotel_madinah && <InfoCard icon={Hotel} label="Hotel Madinah" value={pkg.hotel_madinah} color="gold" />}
                    </div>
                    {includesList.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-ivory-ink/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-dark" /> Fasilitas Utama
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {includesList.slice(0, 6).map((inc) => (
                            <span key={inc} className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-deep bg-emerald-dark/10 border border-ivory-border rounded-full px-2.5 py-1">
                              <CheckCircle className="w-3 h-3 shrink-0" /> {inc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

{activeTab === "itinerary" && (
                  <div className="animate-in fade-in duration-200">
                    {itineraryList.length > 0 ? (
                      <div className="relative">
                        {/* Header summary */}
                        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-ivory-card border border-ivory-border">
                          <div className="w-10 h-10 rounded-xl bg-emerald-dark flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-ivory" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-deep">Perjalanan {itineraryList.length} Hari</p>
                            <p className="text-xs text-ivory-ink/70">Ikuti langkah demi langkah perjalanan ibadah Anda</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setOpenDays(itineraryList.map((_, i) => i))}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-dark hover:bg-emerald-dark/10 transition-colors cursor-pointer"
                            >
                              Buka Semua
                            </button>
                            <span className="text-ivory-border">|</span>
                            <button
                              onClick={() => setOpenDays([])}
                              disabled={openDays.length === 0}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-dark hover:bg-emerald-dark/10 transition-colors disabled:opacity-40 disabled:cursor-default cursor-pointer"
                            >
                              Tutup Semua
                            </button>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative ml-5 pr-2 sm:pr-3 border-l-2 border-ivory-border space-y-0">
                          {itineraryList.map((item, idx) => {
                            const isOpen = openDays.includes(idx)
                            const isLast = idx === itineraryList.length - 1
                            return (
                              <div
                                key={idx}
                                className="relative group"
                              >
                                {/* Timeline dot */}
                                <div className={`absolute -left-[1.35rem] top-4 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                                  isOpen
                                    ? "bg-emerald-dark border-emerald-dark scale-125 shadow-md"
                                    : "bg-ivory-card border-ivory-border group-hover:border-emerald-dark group-hover:bg-ivory-soft"
                                }`} />

                                {/* Day card */}
                                <button
                                  onClick={() => setOpenDays((prev) => isOpen ? prev.filter((d) => d !== idx) : [...prev, idx])}
                                  className={`w-full text-left ml-6 p-4 rounded-xl transition-all duration-300 ${
                                    isOpen
                                      ? "bg-ivory-soft border border-ivory-border shadow-sm"
                                      : "hover:bg-ivory-soft border border-transparent hover:border-ivory-border"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                        isOpen
                                          ? "bg-emerald-dark text-ivory"
                                          : "bg-emerald-dark/10 text-emerald-dark"
                                      }`}>
                                        Hari {item.day}
                                      </span>
                                      <h3 className={`text-sm font-semibold truncate transition-colors ${
                                        isOpen ? "text-emerald-deep" : "text-emerald-deep group-hover:text-emerald-dark"
                                      }`}>
                                        {item.title || `Hari ke-${item.day}`}
                                      </h3>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 shrink-0 text-ivory-ink/70 transition-transform duration-300 ${
                                      isOpen ? "rotate-90 text-emerald-dark" : ""
                                    }`} />
                                  </div>

                                  {/* Expandable description */}
                                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 mt-3" : "max-h-0"}`}>
                                    <p className="text-sm text-ivory-ink/70 leading-relaxed whitespace-pre-line break-words border-t border-ivory-border pt-3">
                                      {item.description || ""}
                                    </p>
                                  </div>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-ivory-soft flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-ivory-ink/30" />
                        </div>
                        <p className="text-ivory-ink/70 text-sm">Tidak ada informasi itinerary</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Facilities */}
                {activeTab === "facilities" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {includesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-emerald-deep">
                          <div className="w-6 h-6 rounded-lg bg-emerald-dark/10 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-dark" />
                          </div>
                          Termasuk
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center gap-3 text-sm bg-ivory-card border border-ivory-border rounded-xl px-4 py-3 hover:bg-ivory-soft transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-emerald-dark/10 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-4 h-4 text-emerald-dark" />
                              </div>
                              <span className="text-emerald-deep">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {excludesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-emerald-deep">
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
                        <div className="w-16 h-16 rounded-2xl bg-ivory-soft flex items-center justify-center mx-auto mb-4">
                          <Info className="w-8 h-8 text-ivory-ink/30" />
                        </div>
                        <p className="text-sm text-ivory-ink/70">Belum ada info fasilitas</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {initialReviews.length > 0 ? (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-ivory-card rounded-xl border border-ivory-border">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-deep">{avgRating.toFixed(1)}</div>
                            <div className="flex gap-0.5 justify-center mt-1" role="img" aria-label={`Rating ${avgRating.toFixed(1)} dari 5 bintang`}>
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                              ))}
                            </div>
                            <div className="text-xs text-ivory-ink/70 mt-1">{initialReviews.length} ulasan</div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {ratingBreakdown.map(({ star, count }) => (
                              <RatingBar key={star} star={star} count={count} total={initialReviews.length} />
                            ))}
                          </div>
                        </div>

                        {/* Review Form */}
                        {canReview === true && (
                          <div className="p-4 bg-ivory-card rounded-xl border border-ivory-border shadow-sm">
                            <h4 className="text-sm font-semibold mb-3 text-emerald-deep">Tulis Ulasan Anda</h4>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setReviewRating(s)}
                                  onMouseEnter={() => setReviewHoverRating(s)}
                                  onMouseLeave={() => setReviewHoverRating(0)}
                                  className="p-0.5 transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      s <= (reviewHoverRating || reviewRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                              {reviewRating > 0 && (
                                <span className="text-xs text-muted-foreground self-center ml-2">{reviewRating}/5</span>
                              )}
                            </div>
                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Ceritakan pengalaman Anda (opsional)"
                              rows={3}
                              className="w-full text-sm border border-ivory-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-dark/30 resize-none"
                            />
                            <button
                              type="button"
                              onClick={handleSubmitReview}
                              disabled={submittingReview || reviewRating === 0}
                              className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-dark text-ivory hover:bg-emerald-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                            >
                              {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Kirim Ulasan
                            </button>
                          </div>
                        )}
                        {canReview === false && eligibleBookingId && (
                          <div className="p-3 bg-ivory-soft rounded-xl border border-ivory-border text-center">
                            <p className="text-xs text-ivory-ink/70">Anda sudah memberikan ulasan untuk paket ini.</p>
                          </div>
                        )}

                        <div className="space-y-3">
                          {initialReviews.map((r) => {
                            const reviewerName = r.customer_id ? (reviewerMap[r.customer_id] || "Pengguna") : "Pengguna"
                            return (
                            <div key={r.id} className="border-b border-ivory-border pb-3 last:border-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-dark/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-emerald-dark">{reviewerName.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{reviewerName}</p>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex gap-0.5" role="img" aria-label={`Rating ${r.rating} dari 5 bintang`}>
                                      {[1,2,3,4,5].map((s) => (
                                        <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-ivory-ink/70">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                                  </div>
                                </div>
                              </div>
                              {r.review && <p className="text-sm text-ivory-ink/70 ml-10">{r.review}</p>}
                            </div>
                          )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {/* Review Form (also shown when no reviews yet) */}
                        {canReview === true && (
                          <div className="p-4 bg-ivory-card rounded-xl border border-ivory-border shadow-sm">
                            <h4 className="text-sm font-semibold mb-3 text-emerald-deep">Jadilah yang pertama memberikan ulasan</h4>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setReviewRating(s)}
                                  onMouseEnter={() => setReviewHoverRating(s)}
                                  onMouseLeave={() => setReviewHoverRating(0)}
                                  className="p-0.5 transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      s <= (reviewHoverRating || reviewRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                              {reviewRating > 0 && (
                                <span className="text-xs text-muted-foreground self-center ml-2">{reviewRating}/5</span>
                              )}
                            </div>
                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Ceritakan pengalaman Anda (opsional)"
                              rows={3}
                              className="w-full text-sm border border-ivory-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-dark/30 resize-none"
                            />
                            <button
                              type="button"
                              onClick={handleSubmitReview}
                              disabled={submittingReview || reviewRating === 0}
                              className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-dark text-ivory hover:bg-emerald-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                            >
                              {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Kirim Ulasan
                            </button>
                          </div>
                        )}
                        <div className="text-center py-8">
                          <div className="w-20 h-20 rounded-2xl bg-ivory-card flex items-center justify-center mx-auto mb-4 border border-ivory-border">
                            <div className="relative">
                              <Star className="w-10 h-10 text-amber-300" />
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ivory-card border-2 border-ivory-border flex items-center justify-center">
                                <span className="text-[8px] font-bold text-emerald-deep">?</span>
                              </div>
                            </div>
                          </div>
                          <h4 className="font-semibold text-emerald-deep mb-1">Belum ada ulasan</h4>
                          <p className="text-sm text-ivory-ink/70 max-w-xs mx-auto">
                            {canReview === false
                              ? "Booking dan selesaikan perjalanan untuk bisa memberikan ulasan."
                              : "Ulasan Anda akan muncul di sini setelah perjalanan selesai."}
                          </p>
                        </div>
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
            {/* Booking Card — title + price + seats + CTA (satu kartu) */}
            <div className="bg-ivory-card rounded-2xl border border-ivory-border p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <PackageStatusBadge status={displayPkg.status} />
                {pkg.type && pkg.type !== "haji" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-dark/10 text-emerald-dark uppercase tracking-wide">
                    {pkg.type}
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 ml-auto">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)}
                    <span className="text-[10px] font-normal text-muted-foreground">({initialReviews.length})</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold leading-tight line-clamp-2 mb-2 text-emerald-deep first-letter:uppercase">{pkg.name}</h1>

              <div className="flex items-end justify-between gap-2 mb-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-extrabold text-emerald-deep">{formatRupiah(pkg.price)}</p>
                    <span className="text-xs text-ivory-ink/70">/ orang</span>
                  </div>
                  {Number(pkg.cashback_amount) > 0 && (
                    <TooltipProvider delay={100}>
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex items-center gap-1 w-fit text-xs font-bold text-emerald-deep bg-gold border border-gold rounded-full px-2.5 py-1">
                          <BadgePercent className="w-3.5 h-3.5 text-emerald-deep" /> Cashback {formatRupiah(Number(pkg.cashback_amount))}
                        </span>} />
                        <TooltipContent className="max-w-xs">Cashback (pengembalian sebagian dana) dari biaya umrah ditangani langsung oleh travel, biasanya berupa uang cash Riyal sesuai kebijakan travel.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {Number(pkg.cashback_amount) > 0 && (
                    <p className="text-[11px] text-ivory-ink/70 max-w-[220px] leading-relaxed">
                      Ditangani langsung oleh travel saat keberangkatan sesuai kebijakan travel.
                    </p>
                  )}
                </div>
              </div>

              {/* Seat — bar bawaan: label "Sisa kursi" + jumlah + progress (satu sumber) */}
              <div className="mt-4 pt-4 border-t border-ivory-border">
                <SeatAvailabilityBar available={displayPkg.available} quota={displayPkg.quota} quotaTaken={displayPkg.quota_taken} variant="compact" soldOut={soldOut} />
              </div>

              {/* CTA */}
              <div className="mt-4 space-y-2.5">
                {blocked ? (
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-deep bg-emerald-deep p-4 text-ivory shadow-lg">
                    {/* Decorative glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-emerald-dark/40 blur-3xl" />

                    {/* Ribbon */}
                    <div className="relative flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                        {displayPkg.status === "ongoing" ? "Sedang Berlangsung" : "Kursi Penuh"}
                      </span>
                      <Plane className="w-5 h-5 text-gold/80" />
                    </div>

                    {/* Title */}
                    <div className="relative flex items-center gap-3 mt-3">
                      <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shrink-0 shadow-md">
                        <Timer className="w-5 h-5 text-emerald-deep" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">
                          {displayPkg.status === "ongoing" ? "Paket telah berangkat" : "Paket sudah habis"}
                        </p>
                        <p className="text-xs text-ivory/80 leading-tight mt-0.5">Keberangkatan ini sudah tidak bisa dipesan</p>
                      </div>
                    </div>

                    {/* Realtime stats */}
                    {displayPkg.status === "ongoing" && (
                      <div className="relative mt-4 pt-3.5 border-t border-white/10">
                        <div className="flex items-center text-[11px] text-ivory/80 mb-1.5">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gold" />
                            {departedCount} dari {displayPkg.quota} jamaah berangkat
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold transition-all duration-700"
                            style={{ width: `${departedPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={handleCheckout} className="w-full block">
                      <Button className="w-full h-12 font-bold text-sm bg-gold text-emerald-deep hover:bg-emerald-deep hover:text-ivory shadow-lg transition-all active:scale-[0.98]">
                        Pesan
                      </Button>
                    </button>
                    <Button
                      variant="outline"
                      className="w-full h-11 text-xs gap-2 font-semibold border-ivory-border hover:bg-ivory-soft transition-all"
                      onClick={() => {
                        if (comparePackages.some((p) => p.id === pkg.id)) return
                        if (isFull) {
                          toast.warning("Maksimal 3 paket untuk dibandingkan", { action: { label: "Lihat Perbandingan", onClick: () => router.push("/compare") } })
                          return
                        }
                        addToCompare(pkg as unknown as PackageType)
                        toast.success("Paket berhasil ditambahkan ke perbandingan", { action: { label: "Lihat Perbandingan", onClick: () => router.push("/compare") } })
                      }}
                    >
                      <Scale className="w-4 h-4" /> Bandingkan
                    </Button>
                  </>
                )}
                <p className="text-[10px] text-ivory-ink/70 text-center">Bayar via saldo dompet, transfer, atau pembayaran lainnya</p>
              </div>
            </div>

            {/* Travel */}
            {pkg.travel && (
              <div className="bg-ivory-card rounded-2xl border border-ivory-border p-5 shadow-sm mb-3">
                <Link href={`/travel/${pkg.travel.slug}`} className="group flex items-center gap-3">
                  {pkg.travel.logo_url ? (
                    <div className="w-12 h-12 rounded-2xl bg-white ring-2 ring-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                      <Image src={pkg.travel.logo_url} alt={pkg.travel.name} width={48} height={48} unoptimized className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-dark flex items-center justify-center shrink-0">
                      <span className="text-base font-bold text-ivory">{pkg.travel.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold group-hover:text-emerald-dark transition-colors truncate">{pkg.travel.name}</span>
                      {pkg.travel.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-dark shrink-0" />}
                    </div>
                    {pkg.travel.city && <p className="text-[11px] text-ivory-ink/70 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{pkg.travel.city}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-ivory-ink/70 shrink-0 group-hover:text-emerald-dark transition-colors" />
                </Link>
                {pkg.travel.phone && (
                  <a href={`https://wa.me/${pkg.travel.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                    <Button className="w-full h-11 text-xs font-bold gap-2 bg-emerald-dark hover:bg-emerald-deep text-ivory shadow-md transition-all">
                      <MessageCircle className="w-4 h-4" /> Tanya via WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Trust */}
            <div className="bg-ivory-card rounded-2xl border border-ivory-border p-5">
              <p className="text-[11px] font-bold text-ivory-ink/70 uppercase tracking-wider mb-3">Keamanan & Jaminan</p>
              <div className="space-y-2.5">
                {[
                  { icon: Shield, text: "Pembayaran aman & terenkripsi", highlight: false },
                  { icon: BadgeCheck, text: "Travel partner terverifikasi", highlight: false },
                  { icon: CheckCircle, text: "Jaminan keberangkatan", highlight: false },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-xs text-ivory-ink/70 bg-ivory-soft border border-ivory-border rounded-xl px-3 py-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-dark/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-emerald-dark" />
                    </span>
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
      {showStickyCta && !blocked && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-ivory-card/95 backdrop-blur-md border-t border-ivory-border px-3 pt-3 pb-3 z-50 lg:hidden">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-emerald-deep truncate">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-ivory-ink/70">per orang</p>
            </div>
            <button onClick={handleCheckout}>
              <Button className="h-10 px-5 font-semibold text-sm bg-gold text-emerald-deep shadow-lg">Pesan</Button>
            </button>
          </div>
        </div>
      )}
      {showStickyCta && blocked && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden px-3 pt-3 pb-3 bg-emerald-deep border-t border-emerald-deep text-ivory">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center shrink-0 shadow-md">
              <Timer className="w-4.5 h-4.5 text-emerald-deep" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">
                {displayPkg.status === "ongoing" ? "Paket telah berangkat" : "Paket sudah habis"}
              </p>
              <p className="text-[11px] text-ivory/80 truncate">Tidak bisa dipesan lagi</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              {displayPkg.status === "ongoing" ? "Berlangsung" : "Penuh"}
            </span>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] right-4 w-10 h-10 rounded-full bg-ivory-card border border-ivory-border shadow flex items-center justify-center text-ivory-ink/70 hover:text-emerald-dark transition-all z-40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Single Image Lightbox */}
      {singleImageLightbox && initialImages?.[0] && (
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
            src={initialImages[0]}
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