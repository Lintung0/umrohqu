"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, Scale, ClipboardList, User } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCompare } from "@/lib/compare-context"

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/compare", label: "Bandingkan", icon: Scale },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/dashboard/bookings", label: "Pesanan", icon: ClipboardList },
  { href: "/dashboard", label: "Akun", icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { compareCount } = useCompare()

  if (!isMobile) return null
  if (pathname.startsWith("/admin") || pathname.startsWith("/travel-dashboard") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/checkout") || pathname.startsWith("/travel-site")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-ivory-card border-t border-ivory-border safe-area-bottom pb-safe lg:hidden">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : item.href === "/dashboard"
              ? pathname === "/dashboard" || (pathname.startsWith("/dashboard/") && !pathname.startsWith("/dashboard/bookings"))
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                isActive ? "text-emerald-dark" : "text-ivory-ink/60 hover:text-emerald-dark"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.href === "/compare" && compareCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-4 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gold text-emerald-deep text-[10px] font-bold leading-none">
                  {compareCount}
                </span>
              )}
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
