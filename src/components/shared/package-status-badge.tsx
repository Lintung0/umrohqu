import { PACKAGE_STATUS_BADGES, PACKAGE_STATUS_FALLBACK } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function PackageStatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const cfg = PACKAGE_STATUS_BADGES[status || ""] || PACKAGE_STATUS_FALLBACK
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", cfg.className, className)}>
      {cfg.label}
    </span>
  )
}
