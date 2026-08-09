"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Logo from "./logo"
import { CompactLanguageSwitcher } from "@/components/shared/compact-language-switcher"
import { LayoutDashboard, LogOut, ChevronDown, Menu, X, Clock } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  super_admin: "/admin",
  marketplace_admin: "/admin",
  marketplace_finance: "/admin",
  marketplace_operational: "/admin",
  travel_admin: "/travel-dashboard",
  travel_staff: "/travel-dashboard",
  customer: "/dashboard",
}

const ROLE_DASHBOARD_LABEL_KEYS: Record<string, string> = {
  super_admin: "admin_dashboard",
  marketplace_admin: "admin_dashboard",
  marketplace_finance: "finance_dashboard",
  marketplace_operational: "operational_dashboard",
  travel_admin: "travel_dashboard",
  travel_staff: "travel_staff_dashboard",
  customer: "dashboard_saya",
}

const NAV_LINKS_KEYS = ["search_packages", "promo", "faq", "al_quran"] as const
const NAV_HREFS: Record<string, string> = {
  search_packages: "/search",
  promo: "/promotions",
  faq: "/faq",
  al_quran: "/al-quran",
}

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useTranslation()

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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setMenuOpen(false)
    setMobileOpen(false)
    router.push("/")
  }

  const dashboardPath = userRole ? (ROLE_DASHBOARD_MAP[userRole] || "/dashboard") : "/dashboard"
  const dashboardLabel = userRole
    ? (t.nav as Record<string, string>)[ROLE_DASHBOARD_LABEL_KEYS[userRole]] || t.nav.dashboard
    : t.nav.dashboard

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

        {/* ── Left: Logo ── */}
        <div className="flex items-center justify-start shrink-0">
          <Logo />
        </div>

        {/* ── Center: Nav links ── */}
        <nav className="hidden md:flex items-center justify-center gap-6 text-sm font-medium text-slate-700">
          {NAV_LINKS_KEYS.map((key) => (
            <Link
              key={key}
              href={NAV_HREFS[key]}
              className="whitespace-nowrap hover:text-emerald-600 transition-colors"
            >
              {t.nav[key]}
            </Link>
          ))}
        </nav>

        {/* ── Right: Utilities + Auth ── */}
        <div className="flex items-center justify-end shrink-0">
          <div className="hidden md:flex items-center gap-2">
            {/* Prayer Times — icon only */}
            <Link
              href="/jadwal-sholat"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-colors"
              title={t.nav.jadwal_sholat}
            >
              <Clock className="w-[18px] h-[18px]" />
            </Link>

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
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                >
                  <Image
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || "U")}&background=0E5C4E&color=fff&size=80&bold=true`}
                    alt={user.user_metadata?.full_name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-emerald-100"
                  />
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", menuOpen && "rotate-180")} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-200"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-in slide-in-from-top-2 duration-200">
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
              href="/jadwal-sholat"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              {t.nav.jadwal_sholat}
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
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                    {t.nav.login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md transition-colors">
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
