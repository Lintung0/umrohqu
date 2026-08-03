"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Package, BookOpen, Users, BarChart3, Globe, Megaphone, Settings, Wallet, LogOut, Home } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Image from "next/image"

const NAV_ITEMS = [
  { href: "/travel-dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/travel-dashboard/packages", label: "Paket Saya", icon: Package },
  { href: "/travel-dashboard/bookings", label: "Pesanan", icon: BookOpen },
  { href: "/travel-dashboard/pilgrims", label: "Jamaah", icon: Users },
  { href: "/travel-dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/travel-dashboard/wallet", label: "Dompet", icon: Wallet },
  { href: "/travel-dashboard/website", label: "Website", icon: Globe },
  { href: "/travel-dashboard/promotions", label: "Promo & Bidding", icon: Megaphone },
  { href: "/travel-dashboard/settings", label: "Pengaturan", icon: Settings },
]

export default function TravelDashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-border min-h-screen">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <Image
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || "Travel")}&background=2A7D4F&color=fff&size=80&bold=true`}
            alt="Avatar"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || "Travel"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/travel-dashboard" ? pathname === "/travel-dashboard" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive ? "bg-emerald-50 text-emerald-700 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Beranda
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
