"use client"

import { Users } from "lucide-react"
import { getSeatAvailability } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface SeatAvailabilityBarProps {
  available: number | null | undefined
  quota: number
  variant?: "card" | "detail" | "compact"
  showLabel?: boolean
}

export default function SeatAvailabilityBar({ available, quota, variant = "card", showLabel = true }: SeatAvailabilityBarProps) {
  const { t } = useTranslation()
  const seat = getSeatAvailability(available, quota)

  if (variant === "compact") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {t("card.seats_left")}
          </span>
          <span className="font-semibold">{seat.available}/{quota}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
        </div>
      </div>
    )
  }

  if (variant === "detail") {
    return (
      <div className="bg-muted/40 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" /> {t("card.seats_left")}
          </span>
          {showLabel && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${seat.bgColor} ${seat.textColor}`}>
              {seat.label}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{seat.available} {t("card.seats_of")} {quota} {t("card.seats_unit")}</span>
          <span>{Math.round(seat.percent)}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> {t("card.seats_left")}
        </span>
        <span className="font-semibold">{seat.available}/{quota}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${seat.color}`} style={{ width: `${seat.percent}%` }} />
      </div>
    </div>
  )
}
