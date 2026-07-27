"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, Palette, DollarSign, Target, Tag, BarChart3, LifeBuoy, ClipboardCheck, Headphones, FileText, CreditCard, Wallet, Receipt, TrendingUp, LogOut, ChevronDown, Shield } from "lucide-react"
import { type AdminRole } from "@/lib/types"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["marketplace_admin", "marketplace_support", "marketplace_billing"] as AdminRole[] },
  { href: "/admin/travels", label: "Akun Travel", icon: Building2, roles: ["marketplace_admin"] },
  { href: "/admin/templates", label: "Template Website", icon: Palette, roles: ["marketplace_admin"] },
  { href: "/admin/config", label: "Konfigurasi Biaya", icon: DollarSign, roles: ["marketplace_admin"] },
  { href: "/admin/bidding", label: "Kelola Bidding", icon: Target, roles: ["marketplace_admin"] },
  { href: "/admin/promos", label: "Promo & Diskon", icon: Tag, roles: ["marketplace_admin"] },
  { href: "/admin/reports", label: "Laporan Sistem", icon: BarChart3, roles: ["marketplace_admin"] },
  { href: "/admin/onboarding", label: "Onboarding", icon: ClipboardCheck, roles: ["marketplace_support"] },
  { href: "/admin/verification", label: "Verifikasi Travel", icon: Shield, roles: ["marketplace_support"] },
  { href: "/admin/tickets", label: "Tiket Kendala", icon: Headphones, roles: ["marketplace_support"] },
  { href: "/admin/help", label: "Bantuan Pengguna", icon: LifeBuoy, roles: ["marketplace_support"] },
  { href: "/admin/setup-fees", label: "Biaya Setup", icon: Wallet, roles: ["marketplace_billing"] },
  { href: "/admin/service-fees", label: "Service Fee", icon: Receipt, roles: ["marketplace_billing"] },
  { href: "/admin/invoices", label: "Invoice", icon: FileText, roles: ["marketplace_billing"] },
  { href: "/admin/payments", label: "Pembayaran Travel", icon: CreditCard, roles: ["marketplace_billing"] },
  { href: "/admin/billing-promos", label: "Promo & Diskon", icon: Tag, roles: ["marketplace_billing"] },
  { href: "/admin/billing-reports", label: "Laporan Keuangan", icon: TrendingUp, roles: ["marketplace_billing"] },
]

const ROLE_LABELS: Record<AdminRole, string> = {
  marketplace_admin: "Admin",
  marketplace_support: "Support",
  marketplace_billing: "Billing",
}

const ROLE_COLORS: Record<AdminRole, string> = {
  marketplace_admin: "bg-emerald-100 text-emerald-700",
  marketplace_support: "bg-blue-100 text-blue-700",
  marketplace_billing: "bg-amber-100 text-amber-700",
}

interface AdminSidebarProps {
  currentRole: AdminRole
  onRoleChange: (role: AdminRole) => void
}

export default function AdminSidebar({ currentRole, onRoleChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const visibleNav = ADMIN_NAV.filter((item) => item.roles.includes(currentRole))

  const ROLE_USERS: Record<AdminRole, { name: string; email: string }> = {
    marketplace_admin: { name: "Super Admin", email: "admin@umrohq.com" },
    marketplace_support: { name: "Support Agent", email: "support@umrohq.com" },
    marketplace_billing: { name: "Billing Staff", email: "billing@umrohq.com" },
  }

  const currentUser = ROLE_USERS[currentRole]

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-border min-h-screen">
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

      {/* Role Switcher */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as AdminRole)}
            className="w-full appearance-none bg-gray-50 border border-border rounded-xl px-3 py-2 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {(Object.keys(ROLE_LABELS) as AdminRole[]).map((role) => (
              <option key={role} value={role}>{ROLE_LABELS[role]} — {ROLE_USERS[role].name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="mt-2 flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-700">{currentUser.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{currentUser.name}</p>
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
        <AdminLogout />
      </div>
    </aside>
  )
}

function AdminLogout() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Keluar
    </button>
  )
}
