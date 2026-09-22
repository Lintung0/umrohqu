"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Package, BookOpen, Users, BarChart3, Globe, Settings, LogOut, Home, Menu, X, Shield, Building2, UserCheck, MapPin, Plane, Hotel, Building, Bus, Bed, Calendar, Box, UsersRound, ClipboardList, PackageCheck, ChevronDown, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Image from "next/image"

const NAV_ITEMS = [
  { href: "/travel-dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/travel-dashboard/packages", label: "Paket Saya", icon: Package },
  { href: "/travel-dashboard/bookings", label: "Pesanan", icon: BookOpen },
  { href: "/travel-dashboard/pilgrims", label: "Jamaah", icon: Users },
  { href: "/travel-dashboard/staff", label: "Tim Saya", icon: Shield },
  { href: "/travel-dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/travel-dashboard/website", label: "Website", icon: Globe },
  { href: "/travel-dashboard/settings", label: "Pengaturan", icon: Settings },
]

// Fix Seat icon import - use a different icon
const Seat = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 18V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12"/><path d="M3 6h18"/><path d="M16 10a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/></svg>

const OPERATIONAL_NAV_GROUPS = [
  {
    label: "OPERASIONAL SDM & CABANG",
    items: [
      { href: "/travel-dashboard/branches", label: "Cabang", icon: Building2 },
      { href: "/travel-dashboard/agents", label: "Agen", icon: UserCheck },
      { href: "/travel-dashboard/muthawifs", label: "Muthawif", icon: UsersRound },
      { href: "/travel-dashboard/agent-commissions", label: "Komisi Agen", icon: PackageCheck },
    ],
  },
  {
    label: "KEBERANGKATAN & AKOMODASI",
    items: [
      { href: "/travel-dashboard/package-departures", label: "Keberangkatan Paket", icon: MapPin },
      { href: "/travel-dashboard/hotels", label: "Hotel", icon: Hotel },
      { href: "/travel-dashboard/airlines", label: "Maskapai", icon: Plane },
      { href: "/travel-dashboard/package-hotels", label: "Hotel Paket", icon: Bed },
      { href: "/travel-dashboard/package-flights", label: "Penerbangan Paket", icon: Plane },
    ],
  },
  {
    label: "ROOMING & BUS",
    items: [
      { href: "/travel-dashboard/room-templates", label: "Template Kamar", icon: Bed },
      { href: "/travel-dashboard/bus-templates", label: "Template Bus", icon: Bus },
      { href: "/travel-dashboard/bus-seats", label: "Kursi Bus", icon: Seat },
      { href: "/travel-dashboard/room-assignments", label: "Penempatan Kamar", icon: Bed },
      { href: "/travel-dashboard/seat-assignments", label: "Penempatan Kursi", icon: Seat },
    ],
  },
  {
    label: "MANASIK & PERLENGKAPAN",
    items: [
      { href: "/travel-dashboard/manasik-programs", label: "Program Manasik", icon: Calendar },
      { href: "/travel-dashboard/manasik-sessions", label: "Sesi Manasik", icon: Calendar },
      { href: "/travel-dashboard/manasik-attendances", label: "Presensi Manasik", icon: ClipboardList },
      { href: "/travel-dashboard/equipment-templates", label: "Template Perlengkapan", icon: Box },
      { href: "/travel-dashboard/participant-equipment", label: "Perlengkapan Jamaah", icon: PackageCheck },
    ],
  },
]

export default function TravelDashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const sidebarContent = (
    <>
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
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive ? "bg-emerald-50 text-emerald-700 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {OPERATIONAL_NAV_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors ${
                    isActive ? "bg-emerald-50 text-emerald-700 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
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
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/travel-dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <p className="font-bold text-sm">UmrahQu Travel</p>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-muted">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-border min-h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
