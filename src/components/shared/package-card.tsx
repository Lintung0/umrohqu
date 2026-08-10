"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Clock, MapPin, Plane, Hotel, BadgeCheck, Shield, Heart } from "lucide-react"
import { formatRupiah, decodeUnicodeEscapes } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import SeatAvailabilityBar from "./seat-availability-bar"
import type { Package, Tenant } from "@/lib/types"

const KAABAH_IMAGE = "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80&fm=webp&auto=format"

function getSafeImage(url: string | null | undefined): string {
  if (!url) return KAABAH_IMAGE
  const blocked = ["wooden-house", "house-wood", "cabin", "cottage", "barn", "shack", "hut", "1567496146600", "1549888834"]
  const lower = url.toLowerCase()
  if (blocked.some((b) => lower.includes(b))) return KAABAH_IMAGE
  return url
}

interface PackageCardProps {
  pkg: Package
  travel?: Tenant | null
  showTravel?: boolean
  variant?: "vertical" | "horizontal"
}

export default function PackageCard({ pkg, travel, showTravel = true, variant = "vertical" }: PackageCardProps) {
  const { t } = useTranslation()
  const [imgSrc, setImgSrc] = useState(getSafeImage(pkg.image_url))
  const [imgError, setImgError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  function handleError() {
    if (!imgError) {
      setImgError(true)
      setImgSrc(KAABAH_IMAGE)
    }
  }

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  function handleTravelClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/package/${pkg.slug}`}
        className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-emerald-500/8 hover:-translate-y-0.5 hover:border-emerald-300/40 transition-all duration-300 group cursor-pointer block"
      >
        <div className="flex flex-col sm:flex-row h-full">
          <div className="relative w-full sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden">
            <Image
              src={imgSrc}
              alt={pkg.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              onError={handleError}
              unoptimized
            />
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                pkg.type === "vip" ? "bg-amber-400 text-amber-900" :
                pkg.type === "plus" ? "bg-purple-500 text-white" :
                "bg-emerald-600 text-white"
              }`}>
                {pkg.type}
              </span>
              {pkg.is_promo && discount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                  -{discount}%
                </span>
              )}
            </div>
            <button
              onClick={handleFavorite}
              className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition shadow-sm pointer-events-auto"
              type="button"
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
            </button>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Shield className="w-2.5 h-2.5" /> {t("card.ppiu")}
                </span>
                {travel?.status === "verified" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    <BadgeCheck className="w-2.5 h-2.5" /> {t("card.verified")}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors mb-2 line-clamp-2 min-h-[2.5rem]">{pkg.name}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                {pkg.departure_cities?.[0] && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{pkg.departure_cities.join(", ")}</span>
                  </div>
                )}
                {pkg.duration_days && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                    {pkg.duration_days} {t("card.days")}
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{decodeUnicodeEscapes(pkg.airline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-slate-100">
              <div>
                {pkg.original_price && (
                  <p className="text-[11px] text-slate-400 line-through">{formatRupiah(pkg.original_price)}</p>
                )}
                <p className="text-base font-bold text-emerald-700">{formatRupiah(pkg.price)}<span className="text-[10px] text-slate-400 font-normal">{t("checkout.per_person")}</span></p>
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
      className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 hover:-translate-y-0.5 hover:border-emerald-300/40 transition-all duration-300 group cursor-pointer block"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
          onError={handleError}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          {pkg.is_promo && (
            <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              PROMO {discount}%
            </span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            pkg.type === "vip" ? "bg-amber-400/90 text-amber-900" :
            pkg.type === "plus" ? "bg-purple-500/90 text-white" :
            pkg.type === "furoda" ? "bg-rose-500/90 text-white" :
            "bg-emerald-600/90 text-white"
          }`}>
            {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
          </span>
        </div>

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition shadow-sm pointer-events-auto"
          type="button"
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
        </button>

        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />
            {pkg.duration_days} {t("card.days")}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-col flex-1 p-4 justify-between">
        {/* Trust Badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <Shield className="w-2.5 h-2.5" /> {t("card.ppiu")}
          </span>
          {travel?.status === "verified" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              <BadgeCheck className="w-2.5 h-2.5" /> {t("card.verified")}
            </span>
          )}
        </div>

        {showTravel && travel && (
          <Link
            href={`/travel/${travel.slug}`}
            onClick={handleTravelClick}
            className="inline-flex items-center gap-2 cursor-pointer group/travel mb-2 pointer-events-auto"
          >
            {travel.logo_url ? (
              <Image
                src={travel.logo_url}
                alt={travel.name}
                width={18}
                height={18}
                className="rounded-full"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-[7px] font-bold text-emerald-700">{travel.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-xs text-slate-500 font-medium group-hover/travel:text-emerald-600 transition-colors">
              {travel.name}
            </span>
          </Link>
        )}

        <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[2.5rem] mb-2">
          {pkg.name}
        </h3>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
              <Plane className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="truncate">{decodeUnicodeEscapes(pkg.airline || "")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
              <Hotel className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="truncate">{pkg.hotel_makkah} ({'★'.repeat(Math.min(pkg.hotel_makkah_stars || 0, 5))})</span>
          </div>
        </div>

        <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" />

        {pkg.facilities && pkg.facilities.length > 0 && (
          <div className="flex flex-wrap h-12 overflow-hidden gap-1.5 mt-3">
            {pkg.facilities.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                {f}
              </span>
            ))}
            {pkg.facilities.length > 3 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                +{pkg.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t border-slate-100 mt-auto">
          <div>
            {pkg.original_price && (
              <p className="text-[11px] text-slate-400 line-through">
                {formatRupiah(pkg.original_price)}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-slate-400">{t("checkout.per_person")}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}