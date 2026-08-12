"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, GitCompare, ClipboardList, User } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCompare } from "@/lib/compare-context"

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/compare", label: "Bandingkan", icon: GitCompare },
  { href: "/dashboard/bookings", label: "Pesanan", icon: ClipboardList },
  { href: "/dashboard", label: "Akun", icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { compareCount } = useCompare()

  if (!isMobile) return null
  if (pathname.startsWith("/admin") || pathname.startsWith("/travel-dashboard") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/checkout")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-area-bottom pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                isActive ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.href === "/compare" && compareCount > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-bold leading-none">
                  {compareCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
