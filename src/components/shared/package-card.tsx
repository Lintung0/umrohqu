"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Clock, MapPin, Plane, Hotel, Heart, Bookmark, BookmarkCheck } from "lucide-react"
import { formatRupiah, decodeUnicodeEscapes } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useCompare } from "@/lib/compare-context"
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

const TYPE_LABEL: Record<string, string> = {
  vip: "VIP",
  plus: "Plus",
  furoda: "Furoda",
  reguler: "Reguler",
  hemat: "Hemat",
}

const TYPE_COLOR: Record<string, string> = {
  vip: "bg-amber-100 text-amber-800",
  plus: "bg-purple-100 text-purple-800",
  furoda: "bg-rose-100 text-rose-800",
  reguler: "bg-emerald-100 text-emerald-800",
  hemat: "bg-sky-100 text-sky-800",
}

interface PackageCardProps {
  pkg: Package
  travel?: Tenant | null
  showTravel?: boolean
  variant?: "vertical" | "horizontal"
}

export default function PackageCard({ pkg, travel, showTravel = true, variant = "vertical" }: PackageCardProps) {
  const { t } = useTranslation()
  const { addPackage, removePackage, isSelected, isFull } = useCompare()
  const [imgSrc, setImgSrc] = useState(getSafeImage(pkg.image_url))
  const [imgError, setImgError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  const typeKey = (pkg.type || "reguler").toLowerCase()
  const typeLabel = TYPE_LABEL[typeKey] || pkg.type
  const typeColor = TYPE_COLOR[typeKey] || "bg-gray-100 text-gray-700"
  const compared = isSelected(pkg.id)

  function handleError() {
    if (!imgError) {
      setImgError(true)
      setImgSrc(FALLBACK_IMAGE)
    }
  }

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (compared) {
      removePackage(pkg.id)
      toast.info("Dihapus dari perbandingan")
    } else {
      if (isFull) {
        toast.warning("Bandingkan maksimal 3 paket. Hapus salah satu terlebih dulu.")
        return
      }
      addPackage(pkg)
      toast.success("Ditambahkan ke perbandingan")
    }
  }

  function handleTravelClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/package/${pkg.slug}`}
        className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition-colors group cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row h-full">
          <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
            <Image
              src={imgSrc}
              alt={pkg.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              onError={handleError}
              unoptimized
            />
            <div className="absolute top-2 left-2 flex gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${typeColor}`}>
                {typeLabel}
              </span>
              {pkg.is_promo && discount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                  -{discount}%
                </span>
              )}
            </div>
            <button
              onClick={handleCompare}
              className="absolute top-2 right-2 z-10 bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
              type="button"
              aria-label={compared ? "Hapus dari perbandingan" : "Tambah ke perbandingan"}
            >
              {compared ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors mb-2 line-clamp-2">{pkg.name}</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                {pkg.departure_cities?.[0] && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{pkg.departure_cities.join(", ")}</span>
                  </div>
                )}
                {pkg.duration_days && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                    {pkg.duration_days} {t("card.days")}
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{decodeUnicodeEscapes(pkg.airline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" />
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-gray-100">
              <div>
                {pkg.original_price && (
                  <p className="text-[11px] text-gray-400 line-through">{formatRupiah(pkg.original_price)}</p>
                )}
                <p className="text-base font-bold text-emerald-700">
                  {formatRupiah(pkg.price)}
                  <span className="text-[10px] text-gray-400 font-normal">{t("card.per_person")}</span>
                </p>
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
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          onError={handleError}
          unoptimized
        />

        <div className="absolute top-2.5 left-2.5 flex gap-1 pointer-events-none">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${typeColor}`}>
            {typeLabel}
          </span>
          {pkg.is_promo && discount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
              -{discount}%
            </span>
          )}
        </div>

        <button
          onClick={handleFavorite}
          className="absolute top-2.5 right-2.5 z-10 bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
          type="button"
          aria-label="Simpan ke wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>

        <button
          onClick={handleCompare}
          className="absolute top-2.5 right-10 z-10 bg-white/90 p-1.5 rounded-full hover:bg-white transition pointer-events-auto"
          type="button"
          aria-label={compared ? "Hapus dari perbandingan" : "Tambah ke perbandingan"}
        >
          {compared ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
          <span className="bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
            <Clock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
            {pkg.duration_days} {t("card.days")}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3.5">
        {showTravel && travel && (
          <Link
            href={`/travel/${travel.slug}`}
            onClick={handleTravelClick}
            className="inline-flex items-center gap-1.5 mb-2 w-fit pointer-events-auto"
          >
            {travel.logo_url ? (
              <Image
                src={travel.logo_url}
                alt={travel.name}
                width={16}
                height={16}
                className="rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-[6px] font-bold text-emerald-700">{travel.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-[11px] text-gray-500 hover:text-emerald-600 transition-colors truncate max-w-[140px]">
              {travel.name}
            </span>
          </Link>
        )}

        <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[2.5rem] mb-2.5">
          {pkg.name}
        </h3>

        <div className="space-y-1.5 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{(pkg.departure_cities?.length ? pkg.departure_cities : [pkg.departure_city]).filter(Boolean).slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{decodeUnicodeEscapes(pkg.airline || "")}</span>
          </div>
          {pkg.hotel_makkah && (
            <div className="flex items-center gap-1.5">
              <Hotel className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{pkg.hotel_makkah}{pkg.hotel_makkah_stars ? ` ${"★".repeat(Math.min(pkg.hotel_makkah_stars, 5))}` : ""}</span>
            </div>
          )}
        </div>

        <SeatAvailabilityBar available={pkg.available} quota={pkg.quota} variant="compact" />

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
            {pkg.original_price && (
              <p className="text-[11px] text-gray-400 line-through">{formatRupiah(pkg.original_price)}</p>
            )}
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-emerald-700">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-gray-400">{t("card.per_person")}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
