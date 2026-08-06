"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Logo from "./logo"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import CountrySelect from "@/components/shared/country-select"
import { LayoutDashboard, LogOut, ChevronDown, Search, Menu, X } from "lucide-react"
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

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [country, setCountry] = useState("id")
  const router = useRouter()
  const { t } = useTranslation()

  const ROLE_DASHBOARD_LABEL_KEYS: Record<string, string> = {
    super_admin: "admin_dashboard",
    marketplace_admin: "admin_dashboard",
    marketplace_finance: "finance_dashboard",
    marketplace_operational: "operational_dashboard",
    travel_admin: "travel_dashboard",
    travel_staff: "travel_staff_dashboard",
    customer: "dashboard_saya",
  }

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

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })

    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/user/country")
        const data = await res.json()
        if (data.country) setCountry(data.country)
      } catch {}
    }
    fetchCountry()

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleCountryChange = async (code: string) => {
    setCountry(code)
    try {
      await fetch("/api/user/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      })
    } catch {}
  }

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
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 h-16 items-center">
          {/* Left: Logo */}
          <div className="flex items-center justify-start">
            <Logo />
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              <Search className="w-3.5 h-3.5" />
              {t.nav.search_packages}
            </Link>
            <Link
              href="/articles"
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              {t.nav.blog}
            </Link>
            <Link
              href="/promotions"
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              {t.nav.promo}
            </Link>
            <Link
              href="/faq"
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              {t.nav.faq}
            </Link>
            <Link
              href="/al-quran"
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              {t.nav.al_quran}
            </Link>
            <Link
              href="/jadwal-sholat"
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              {t.nav.jadwal_sholat}
            </Link>
          </nav>

          {/* Right: User & Language */}
          <div className="hidden md:flex items-center justify-end gap-2">
            <CountrySelect value={country} onChange={handleCountryChange} />
            <LanguageSwitcher />
            {loading ? (
              <div className="w-20 h-9 bg-gray-100 rounded-xl animate-pulse ml-1" />
            ) : user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Image
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || "U")}&background=0D7C5F&color=fff&size=80&bold=true`}
                    alt={t.nav.dashboard}
                    width={30}
                    height={30}
                    className="rounded-full ring-2 ring-primary/20"
                  />
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", menuOpen && "rotate-180")} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-60 glass-strong border border-border/50 rounded-2xl shadow-xl shadow-primary/5 z-50 py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
                        <p className="font-semibold text-sm truncate">{user.user_metadata?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        {dashboardLabel}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-glow text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle - visible only on mobile, in 3rd column */}
          <div className="flex md:hidden items-center justify-end">
            <button
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-1">
            <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              <Search className="w-4 h-4 text-primary" /> {t.nav.search_packages}
            </Link>
            <Link href="/articles" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              {t.nav.blog}
            </Link>
            <Link href="/promotions" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              {t.nav.promo}
            </Link>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              {t.nav.faq}
            </Link>
            <Link href="/al-quran" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              {t.nav.al_quran}
            </Link>
            <Link href="/jadwal-sholat" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              {t.nav.jadwal_sholat}
            </Link>
            <div className="flex items-center gap-2 px-4 py-2">
              <CountrySelect value={country} onChange={handleCountryChange} />
              <LanguageSwitcher />
            </div>
            <div className="pt-2 border-t border-border/50 mt-2">
              {loading ? (
                <div className="w-full h-10 bg-muted rounded-xl animate-pulse" />
              ) : user ? (
                <>
                  <Link href={dashboardPath} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-primary" /> {dashboardLabel}
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                    {t.nav.login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-glow text-white shadow-md transition-colors">
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
