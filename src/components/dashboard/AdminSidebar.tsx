"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, Palette, DollarSign, Target, Tag, BarChart3, LifeBuoy, ClipboardCheck, Headphones, FileText, CreditCard, Wallet, Receipt, TrendingUp, LogOut, Shield, Menu, X } from "lucide-react"
import { type AdminRole } from "@/lib/types"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "marketplace_admin", "marketplace_operational", "marketplace_finance"] as AdminRole[] },
  { href: "/admin/travels", label: "Akun Travel", icon: Building2, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/users", label: "Pengguna", icon: Shield, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/templates", label: "Template Website", icon: Palette, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/config", label: "Konfigurasi Biaya", icon: DollarSign, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/bidding", label: "Kelola Bidding", icon: Target, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/promos", label: "Promo & Diskon", icon: Tag, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/reports", label: "Laporan Sistem", icon: BarChart3, roles: ["super_admin", "marketplace_admin"] },
  { href: "/admin/onboarding", label: "Onboarding", icon: ClipboardCheck, roles: ["super_admin", "marketplace_operational"] },
  { href: "/admin/verification", label: "Verifikasi Travel", icon: Shield, roles: ["super_admin", "marketplace_operational"] },
  { href: "/admin/tickets", label: "Tiket Kendala", icon: Headphones, roles: ["super_admin", "marketplace_operational"] },
  { href: "/admin/help", label: "Bantuan Pengguna", icon: LifeBuoy, roles: ["super_admin", "marketplace_operational"] },
  { href: "/admin/setup-fees", label: "Biaya Setup", icon: Wallet, roles: ["super_admin", "marketplace_finance"] },
  { href: "/admin/service-fees", label: "Service Fee", icon: Receipt, roles: ["super_admin", "marketplace_finance"] },
  { href: "/admin/invoices", label: "Invoice", icon: FileText, roles: ["super_admin", "marketplace_finance"] },
  { href: "/admin/payments", label: "Pembayaran Travel", icon: CreditCard, roles: ["super_admin", "marketplace_finance"] },
  { href: "/admin/billing-promos", label: "Promo & Diskon", icon: Tag, roles: ["super_admin", "marketplace_finance"] },
  { href: "/admin/billing-reports", label: "Laporan Keuangan", icon: TrendingUp, roles: ["super_admin", "marketplace_finance"] },
]

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  marketplace_admin: "Admin",
  marketplace_operational: "Operational",
  marketplace_finance: "Finance",
}

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  marketplace_admin: "bg-emerald-100 text-emerald-700",
  marketplace_operational: "bg-blue-100 text-blue-700",
  marketplace_finance: "bg-amber-100 text-amber-700",
}

interface AdminSidebarProps {
  currentRole: AdminRole
}

export default function AdminSidebar({ currentRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const visibleNav = ADMIN_NAV.filter((item) => item.roles.includes(currentRole))

  useState(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin")
        setUserEmail(user.email || "")
      }
    })
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <div>
            <p className="font-bold text-sm">UmrohQ</p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-700">{(userName || "A").charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{userName || "Admin"}</p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[currentRole]}`}>
              {ROLE_LABELS[currentRole]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
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
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
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
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <p className="font-bold text-sm">UmrohQ Admin</p>
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
