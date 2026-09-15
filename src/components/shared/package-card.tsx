"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, MapPin, Plane, Hotel, Calendar, Scale, Heart, Loader2, Star, Timer, BadgePercent } from "lucide-react"
import { formatRupiah, decodeUnicodeEscapes, getPackageAvailable, extractAirline, extractHotelStars, extractHotelName, formatDepartureDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useCompare } from "@/lib/compare-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import SeatAvailabilityBar from "./seat-availability-bar"
import type { Package, Tenant } from "@/lib/types"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format"

const BLOCKED = ["wooden-house", "house-wood", "cabin", "cottage", "barn", "shack", "hut", "1567496146600", "1549888834"]

function getSafeImage(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMAGE
  const lower = url.toLowerCase()
  if (BLOCKED.some((b) => lower.includes(b))) return FALLBACK_IMAGE
  return url
}

interface PackageCardProps {
  pkg: Package
  travel?: Tenant | null
  showTravel?: boolean
  variant?: "vertical" | "horizontal" | "clean"
}

export default function PackageCard({ pkg, travel, showTravel = true, variant = "vertical" }: PackageCardProps) {
  const { t } = useTranslation()
  const { addToCompare, isFull, comparePackages } = useCompare()
  const router = useRouter()
  const supabase = createClient()
  const [imgSrc, setImgSrc] = useState(getSafeImage((pkg.images && pkg.images[0]) || pkg.image_url))
  const [imgError, setImgError] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

  const soldOut = getPackageAvailable(pkg) <= 0
  const airline = extractAirline(pkg.includes, pkg.airline)
  const hotelStars = extractHotelStars(pkg.includes, pkg.hotel_makkah_stars)
  const hotelName = extractHotelName(pkg.includes, pkg.hotel_makkah)
  const departureLabel = formatDepartureDate(pkg.departure_date)

  useEffect(() => {
    let cancelled = false
    async function checkWishlist() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
          .eq("package_id", pkg.id)
          .maybeSingle()
        if (!cancelled && data) setIsWishlisted(true)
      } catch {
        // silent
      }
    }
    checkWishlist()
    return () => { cancelled = true }
  }, [pkg.id, supabase])

  useEffect(() => {
    let cancelled = false
    async function fetchRating() {
      try {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("package_id", pkg.id)
        const bookingIds = (bookings || []).map((b: { id: string }) => b.id)
        if (bookingIds.length === 0 || cancelled) return

        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .in("booking_id", bookingIds)
          .eq("status", "published")

        if (cancelled || !reviews || reviews.length === 0) return
        const sum = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0)
        setAvgRating(Math.round((sum / reviews.length) * 10) / 10)
        setReviewCount(reviews.length)
      } catch {
        // silent
      }
    }
    fetchRating()
    return () => { cancelled = true }
  }, [pkg.id, supabase])

  function handleError() {
    if (!imgError) {
      setImgError(true)
      setImgSrc(FALLBACK_IMAGE)
    }
  }

  const showPopup = useCallback((message: string, variant: "success" | "warning" = "success", actionLabel?: string, actionHref?: string) => {
    if (variant === "warning") {
      toast.warning(message, { action: actionLabel && actionHref ? { label: actionLabel, onClick: () => router.push(actionHref) } : undefined })
    } else {
      toast.success(message, { action: actionLabel && actionHref ? { label: actionLabel, onClick: () => router.push(actionHref) } : undefined })
    }
  }, [router])

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (comparePackages.some((p) => p.id === pkg.id)) return
    if (isFull) {
      showPopup("Maksimal 3 paket untuk dibandingkan", "warning", "Lihat Perbandingan", "/compare")
      return
    }
    addToCompare(pkg)
    showPopup("Ditambahkan ke perbandingan", "success", "Lihat Perbandingan", "/compare")
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (togglingWishlist) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    setTogglingWishlist(true)
    try {
      if (isWishlisted) {
        const { data: existing } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
          .eq("package_id", pkg.id)
          .maybeSingle()
        if (existing) {
          await supabase.from("wishlists").delete().eq("id", existing.id)
        }
        setIsWishlisted(false)
        showPopup("Dihapus dari wishlist", "success", "Lihat Wishlist", "/dashboard/wishlist")
      } else {
        const { data } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, package_id: pkg.id })
          .select("id")
          .single()
        if (data) {
          setIsWishlisted(true)
          showPopup("Ditambahkan ke wishlist", "success", "Lihat Wishlist", "/dashboard/wishlist")
        }
      }
    } catch {
      // silent
    } finally {
      setTogglingWishlist(false)
    }
  }

  function handleTravelClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  if (variant === "clean") {
    return (
      <Link
        href={`/package/${pkg.slug}`}
        className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer"
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imgSrc}
            alt={pkg.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            onError={handleError}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-2.5 left-2.5 flex gap-1.5 pointer-events-none">
            {pkg.duration_nights && (
              <span className="bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
                {pkg.duration_nights} {t("card.days")}
              </span>
            )}
            {soldOut && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800/80 text-white backdrop-blur-sm flex items-center gap-1">
                <Timer className="w-2.5 h-2.5" /> Paket ini penuh
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5">
            <button
              onClick={handleWishlist}
              className="bg-white/90 p-2 rounded-full hover:bg-white transition pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
              type="button"
              aria-label="Tambah ke wishlist"
            >
              {togglingWishlist ? (
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
              ) : (
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-500"}`} />
              )}
            </button>
            {!soldOut && (
              <button
                onClick={handleCompare}
                className="bg-white/90 p-2 rounded-full hover:bg-white transition pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                type="button"
                aria-label="Bandingkan paket"
              >
                <Scale className="w-4 h-4 text-emerald-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-3.5">
          <h3 title={pkg.name} className="font-semibold text-xl leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-[1.375em]">
            {pkg.name}
          </h3>

          {showTravel && travel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/travel/${travel.slug}`)
              }}
              className="inline-flex items-center gap-1.5 mb-3 w-fit pointer-events-auto cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md"
            >
              {travel.logo_url ? (
                <Image
                  src={travel.logo_url}
                  alt={travel.name}
                  width={16}
                  height={16}
                  unoptimized
                  className="rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-emerald-700">{travel.name.charAt(0)}</span>
                </div>
              )}
              <span className="text-[11px] text-slate-600 hover:text-emerald-600 transition-colors truncate max-w-[160px] font-medium">
                {travel.name}
              </span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-500 mb-3">
            <span className="inline-flex items-center gap-0.5 max-w-full">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities : [pkg.departure_city]).filter(Boolean).slice(0, 2).join(", ") || "-"}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span>{pkg.duration_nights ? `${pkg.duration_nights} ${t("card.days")}` : "-"}</span>
            {airline && (
              <>
                <span className="text-slate-300">·</span>
                <span className="truncate">{decodeUnicodeEscapes(airline)}</span>
              </>
            )}
            <>
              <span className="text-slate-300">·</span>
              {hotelStars ? (
                <span className="inline-flex items-center gap-0.5">
                  <Hotel className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Hotel</span>
                  <span className="text-amber-500">{"★".repeat(hotelStars)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <Hotel className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>-</span>
                </span>
              )}
            </>
          </div>

<div className="flex items-center gap-1 mb-2 h-4">
          {avgRating !== null && (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-slate-700">{avgRating}</span>
              <span className="text-[11px] text-slate-400">({reviewCount})</span>
            </>
          )}
        </div>

          <div className="mb-3">
            <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" soldOut={soldOut} quotaTaken={pkg.quota_taken} />
          </div>

          <div className="flex items-end justify-between pt-2.5 border-t border-slate-100 mt-auto">
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-emerald-700">{formatRupiah(pkg.price)}</p>
                <p className="text-[10px] text-slate-400">{t("card.per_person")}</p>
              </div>
              {Number(pkg.cashback_amount) > 0 && (
                <span className="inline-flex items-center gap-1 w-fit mt-1.5 text-[11px] font-bold text-amber-900 bg-gradient-to-r from-yellow-300 to-amber-400 border border-yellow-400 rounded-full px-2 py-0.5 shadow-sm">
                  <BadgePercent className="w-3.5 h-3.5 text-amber-800" /> Cashback {formatRupiah(Number(pkg.cashback_amount))}
                </span>
              )}
            </div>
          </div>
        </div>

      </Link>
    )
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/package/${pkg.slug}`}
        className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition-colors group cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row h-full">
          <div className="relative w-full aspect-video sm:aspect-auto sm:h-full min-h-[180px] shrink-0 overflow-hidden">
            <Image
              src={imgSrc}
              alt={pkg.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              onError={handleError}
              unoptimized
            />
            <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
              {pkg.duration_nights && (
                <span className="bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
                  <Clock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
                  {pkg.duration_nights} {t("card.days")}
                </span>
              )}
            </div>
            <div className="absolute top-2 right-2 z-10 flex gap-1.5">
              <button
                onClick={handleWishlist}
                className="bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
                type="button"
                aria-label="Tambah ke wishlist"
              >
                {togglingWishlist ? (
                  <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                ) : (
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-500"}`} />
                )}
              </button>
              {!soldOut && (
                <button
                  onClick={handleCompare}
                  className="bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
                  type="button"
                  aria-label="Bandingkan paket"
                >
                  <Scale className="w-4 h-4 text-emerald-600" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 title={pkg.name} className="font-semibold text-xl leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1 mb-[1.375em]">{pkg.name}</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities.join(", ") : pkg.departure_city) || "-"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                  {pkg.duration_nights ? `${pkg.duration_nights} ${t("card.days")}` : "-"}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{pkg.airline ? decodeUnicodeEscapes(pkg.airline) : "-"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" soldOut={soldOut} quotaTaken={pkg.quota_taken} />
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-lg font-extrabold text-emerald-700">
                  {formatRupiah(pkg.price)}
                  <span className="text-[10px] text-gray-400 font-normal">{t("card.per_person")}</span>
                </p>
                {Number(pkg.cashback_amount) > 0 && (
                  <span className="inline-flex items-center gap-1 w-fit mt-1.5 text-[11px] font-bold text-amber-900 bg-gradient-to-r from-yellow-300 to-amber-400 border border-yellow-400 rounded-full px-2 py-0.5 shadow-sm">
                    <BadgePercent className="w-3.5 h-3.5 text-amber-800" /> Cashback {formatRupiah(Number(pkg.cashback_amount))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </Link>
    )
  }

  return (
    <Link
      href={`/package/${pkg.slug}`}
      className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition-colors group cursor-pointer"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          onError={handleError}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 flex gap-1 pointer-events-none">
          {pkg.duration_nights && (
            <span className="bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
              <Clock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
              {pkg.duration_nights} {t("card.days")}
            </span>
          )}
          {soldOut && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800/80 text-white backdrop-blur-sm flex items-center gap-1">
              <Timer className="w-2.5 h-2.5" /> Paket ini penuh
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5">
          <button
            onClick={handleWishlist}
            className="bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
            type="button"
            aria-label="Tambah ke wishlist"
          >
            {togglingWishlist ? (
              <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            ) : (
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-500"}`} />
            )}
          </button>
          {!soldOut && (
            <button
              onClick={handleCompare}
              className="bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
              type="button"
              aria-label="Bandingkan paket"
            >
              <Scale className="w-4 h-4 text-emerald-600" />
            </button>
          )}
        </div>

      </div>

      <div className="flex flex-col flex-1 p-3.5">
        <h3 className="font-semibold text-xl leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3 min-h-[3.5rem]">
          {pkg.name}
        </h3>

        {showTravel && travel && (
          <Link
            href={`/travel/${travel.slug}`}
            onClick={handleTravelClick}
            className="inline-flex items-center gap-1 mb-3 w-fit pointer-events-auto"
          >
            {travel.logo_url ? (
              <Image
                src={travel.logo_url}
                alt={travel.name}
                width={14}
                height={14}
                unoptimized
                className="rounded-full object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-[6px] font-bold text-emerald-700">{travel.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-gray-600 font-medium truncate hover:text-emerald-600 transition-colors text-[11px]">
              {travel.name}
            </span>
          </Link>
        )}

        <div className="space-y-1.5 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities : [pkg.departure_city]).filter(Boolean).slice(0, 2).join(", ") || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{airline ? decodeUnicodeEscapes(airline) : "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hotel className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{hotelName ? `${hotelName}${hotelStars ? ` ${"★".repeat(hotelStars)}` : ""}` : hotelStars ? `Hotel ${"★".repeat(hotelStars)}` : "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{departureLabel || "-"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-2 h-4">
          {avgRating !== null && (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{avgRating}</span>
              <span className="text-[11px] text-gray-400">({reviewCount} ulasan)</span>
            </>
          )}
        </div>

        <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" soldOut={soldOut} quotaTaken={pkg.quota_taken} />

        {pkg.facilities && pkg.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 h-6 overflow-hidden">
            {(pkg.facilities as string[]).slice(0, 3).map((f) => (
              <span key={f} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 whitespace-nowrap">
                {f}
              </span>
            ))}
            {pkg.facilities.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500 whitespace-nowrap">
                +{pkg.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t border-gray-100 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-extrabold text-emerald-700">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-gray-400">{t("card.per_person")}</p>
            </div>
            {Number(pkg.cashback_amount) > 0 && (
              <span className="inline-flex items-center gap-1 w-fit mt-1.5 text-[11px] font-bold text-amber-900 bg-gradient-to-r from-yellow-300 to-amber-400 border border-yellow-400 rounded-full px-2 py-0.5 shadow-sm">
                <BadgePercent className="w-3.5 h-3.5 text-amber-800" /> Cashback {formatRupiah(Number(pkg.cashback_amount))}
              </span>
            )}
          </div>
        </div>
      </div>

    </Link>
  )
}
