"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Logo from "./logo"
import { CompactLanguageSwitcher } from "@/components/shared/compact-language-switcher"
import { LayoutDashboard, LogOut, ChevronDown, Menu, X, Scale, Bell } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useCompare } from "@/lib/compare-context"
import NotificationBell from "@/components/shared/notification-bell"

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  admin: "/admin",
  finance: "/admin",
  operational: "/admin",
  travel_admin: "/travel-dashboard",
  travel_operational: "/travel-dashboard",
  travel_finance: "/travel-dashboard",
  customer: "/dashboard",
}

const ROLE_DASHBOARD_LABEL_KEYS: Record<string, string> = {
  admin: "admin_dashboard",
  finance: "finance_dashboard",
  operational: "operational_dashboard",
  travel_admin: "travel_dashboard",
  travel_operational: "travel_dashboard",
  travel_finance: "travel_dashboard",
  customer: "dashboard_saya",
}

const NAV_LINKS_KEYS = ["search_packages", "faq", "travel"] as const
const NAV_HREFS: Record<string, string> = {
  search_packages: "/search",
  promo: "/promotions",
  faq: "/faq",
  travel: "/travel",
}

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifUnread, setNotifUnread] = useState(0)
  const router = useRouter()
  const { t } = useTranslation()
  const { compareCount } = useCompare()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
        if (mounted) setUserRole(profile?.role || null)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()
        setUserRole(profile?.role || null)
      } else {
        setUserRole(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setNotifUnread(0)
      return
    }
    let cancelled = false
    const supabase = createClient()
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => {
        if (!cancelled) setNotifUnread(count || 0)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setMenuOpen(false)
    setMobileOpen(false)
    router.push("/")
    router.refresh()
  }

  const dashboardPath = userRole ? (ROLE_DASHBOARD_MAP[userRole] || "/dashboard") : "/dashboard"
  const dashboardLabel = userRole
    ? (t.nav as Record<string, string>)[ROLE_DASHBOARD_LABEL_KEYS[userRole]] || t.nav.dashboard
    : t.nav.dashboard

  return (
    <header className="w-full sticky top-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60 shadow-[0_4px_30px_-12px_rgba(6,78,59,0.15)]">
      <div className="relative flex items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">

        {/* ── Left: Logo ── */}
        <div className="flex items-center shrink-0">
          <Logo />
        </div>

        {/* ── Center: Nav links ── */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-slate-700 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS_KEYS.map((key) => (
            <Link
              key={key}
              href={NAV_HREFS[key]}
              className="relative whitespace-nowrap py-1.5 text-slate-600 hover:text-emerald-700 transition-colors group"
            >
              {t.nav[key]}
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* ── Right: Utilities + Auth ── */}
        <div className="flex items-center shrink-0">
          <div className="hidden md:flex items-center gap-2">
            {/* Compare */}
            <Link
              href="/compare"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              title={t.nav.compare || "Bandingkan"}
              aria-label="Bandingkan"
            >
              <Scale className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[10px] font-bold leading-none shadow-md shadow-emerald-500/40 ring-2 ring-white">
                  {compareCount > 99 ? "99+" : compareCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <NotificationBell />

            <div className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Compact Language Selector */}
            <CompactLanguageSwitcher />

            <div className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Auth */}
            {loading ? (
              <div className="w-20 h-9 bg-slate-100 rounded-xl animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 transition-all duration-200 cursor-pointer shadow-sm shadow-emerald-500/20"
                >
                  <Image
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || "U")}&background=0E5C4E&color=fff&size=80&bold=true`}
                    alt={user.user_metadata?.full_name || "User"}
                    width={32}
                    height={32}
                    className="shrink-0 rounded-full ring-2 ring-white"
                  />
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/90 transition-transform duration-200", menuOpen && "rotate-180")} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl shadow-emerald-900/10 z-50 py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-emerald-50 bg-gradient-to-br from-emerald-50/80 to-white dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-card">
                        <p className="font-semibold text-sm text-slate-900 truncate">{user.user_metadata?.full_name || "User"}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        {dashboardLabel}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 border-t border-slate-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-amber-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS_KEYS.map((key) => (
              <Link
                key={key}
                href={NAV_HREFS[key]}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {t.nav[key]}
              </Link>
            ))}

            <Link
              href="/compare"
              onClick={() => setMobileOpen(false)}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <Scale className="w-4 h-4 text-emerald-600" />
              {t.nav.compare || "Bandingkan"}
              {compareCount > 0 && (
                <span className="ml-auto w-5 h-5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none">
                  {compareCount}
                </span>
              )}
            </Link>

            <div className="px-4 py-2">
              <CompactLanguageSwitcher />
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2">
              {loading ? (
                <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : user ? (
                <>
                  <Link href={dashboardPath} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-emerald-600" /> {dashboardLabel}
                  </Link>
                  <Link href="/dashboard/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    <Bell className="w-4 h-4 text-emerald-600" /> Notifikasi
                    {notifUnread > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                        {notifUnread > 99 ? "99+" : notifUnread}
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                    {t.nav.login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-amber-500 text-white shadow-md shadow-emerald-600/30 transition-all hover:-translate-y-0.5">
                    {t.nav.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
