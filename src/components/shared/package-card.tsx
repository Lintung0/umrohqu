"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, Plane, Hotel, Users, BadgeCheck, ArrowRight } from "lucide-react"
import { formatRupiah, getSeatAvailability } from "@/lib/utils"
import type { Package, Tenant } from "@/lib/types"

interface PackageCardProps {
  pkg: Package
  travel?: Tenant | null
  showTravel?: boolean
}

export default function PackageCard({ pkg, travel, showTravel = true }: PackageCardProps) {
  const discount = pkg.original_price
    ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
    : 0

  const seat = getSeatAvailability(pkg.available, pkg.quota)

  return (
    <Link href={`/package/${pkg.slug}`} className="group block relative bg-white border border-border/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/20 cursor-pointer">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {pkg.is_promo && (
            <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              PROMO {discount}%
            </span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            pkg.type === "vip" ? "bg-amber-400/90 text-amber-900" :
            pkg.type === "plus" ? "bg-purple-500/90 text-white" :
            pkg.type === "furoda" ? "bg-rose-500/90 text-white" :
            "bg-primary/90 text-white"
          }`}>
            {pkg.type === "vip" ? "★ VIP" : pkg.type === "plus" ? "+ Plus" : pkg.type === "furoda" ? "Furoda" : "Reguler"}
          </span>
        </div>

        {/* Duration chip */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />
            {pkg.duration_days} Hari
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {showTravel && travel && (
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/travel/${travel.slug}` }}
            className="inline-flex items-center gap-2 cursor-pointer group/travel"
          >
            {travel.logo_url ? (
              <Image
                src={travel.logo_url}
                alt={travel.name}
                width={18}
                height={18}
                className="rounded-full"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[7px] font-bold text-primary">{travel.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground font-medium group-hover/travel:text-primary transition-colors">
              {travel.name}
            </span>
            {travel.status === "verified" && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
          </span>
        )}

        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
          {pkg.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
              <MapPin className="w-3 h-3 text-primary" />
            </div>
            <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
              <Plane className="w-3 h-3 text-primary" />
            </div>
            {pkg.airline}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
              <Hotel className="w-3 h-3 text-primary" />
            </div>
            <span className="truncate">{pkg.hotel_makkah} ({'★'.repeat(pkg.hotel_makkah_stars || 0)})</span>
          </div>
        </div>

        {/* Seat Availability Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> Kursi tersisa
            </span>
            <span className="font-semibold">{seat.available}/{pkg.quota}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
          </div>
        </div>

        {pkg.facilities && pkg.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pkg.facilities.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] bg-primary/5 text-primary/80 px-2 py-0.5 rounded-full font-medium">
                {f}
              </span>
            ))}
            {pkg.facilities.length > 3 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                +{pkg.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-border/50">
          <div>
            {pkg.original_price && (
              <p className="text-[11px] text-muted-foreground line-through">
                {formatRupiah(pkg.original_price)}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold text-primary">{formatRupiah(pkg.price)}</p>
              <p className="text-[10px] text-muted-foreground">/org</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
