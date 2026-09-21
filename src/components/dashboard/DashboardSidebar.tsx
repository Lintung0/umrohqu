"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, BookOpen, Heart, Settings, LogOut, Home, Menu, X, UserRound, Bell, BadgePercent } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { onNotificationsChanged } from "@/lib/notify/events"
import { User } from "@supabase/supabase-js"
import Image from "next/image"
import Logo from "@/components/logo"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Pesanan Saya", icon: BookOpen },
  { href: "/dashboard/wishlist", label: "Daftar Keinginan", icon: Heart },
  { href: "/dashboard/cashback", label: "Cashback", icon: BadgePercent },
  { href: "/dashboard/data-diri", label: "Data Diri", icon: UserRound },
  { href: "/dashboard/notifications", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        const loadUnread = async () => {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false)
          setUnreadCount(count || 0)
        }
        loadUnread()
      }
    })
  }, [pathname])

  useEffect(() => {
    return onNotificationsChanged(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
          .then(({ count }) => setUnreadCount(count || 0))
      })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const sidebarContent = (
    <>
      <div className="h-16 px-5 border-b border-ivory-border flex items-center">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || "U")}&background=0D3D2B&color=fdfbf6&size=80&bold=true`}
            alt="Avatar"
            width={40}
            height={40}
            className="rounded-full ring-1 ring-gold/50"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-emerald-deep">{user?.user_metadata?.full_name || "Jamaah"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive ? "bg-emerald-dark text-ivory-soft font-medium" : "text-muted-foreground hover:text-emerald-deep hover:bg-ivory"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-gold text-emerald-deep text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-ivory-border space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-emerald-deep hover:bg-ivory rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Beranda
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-ivory-card border-b border-ivory-border h-16 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-ivory" aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 flex justify-end animate-in fade-in-0 duration-300" onClick={() => setMobileOpen(false)}>
          <aside className="w-72 sm:w-80 h-full bg-ivory-card shadow-xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-ivory-card border-r border-ivory-border min-h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
