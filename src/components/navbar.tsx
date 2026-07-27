"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import Logo from "./logo"
import { LayoutDashboard, LogOut, ChevronDown, Search, Menu, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    setMobileOpen(false)
    router.push("/")
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass-strong shadow-lg shadow-primary/5 border-b border-primary/10"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              <Search className="w-4 h-4" />
              Cari Paket
            </Link>
            <Link
              href="/articles"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              Blog
            </Link>
            <Link
              href="/promotions"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary text-gold-dark font-semibold"
            >
              Promo
            </Link>
            <Link
              href="/faq"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              FAQ
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-muted rounded-xl animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Image
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || "U")}&background=0D7C5F&color=fff&size=80&bold=true`}
                    alt="Avatar"
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
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-semibold rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-glow text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-primary/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-1">
            <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              <Search className="w-4 h-4 text-primary" /> Cari Paket
            </Link>
            <Link href="/articles" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              Blog
            </Link>
            <Link href="/promotions" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gold-dark hover:bg-gold/10 transition-colors">
              Promo
            </Link>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
              FAQ
            </Link>
            <div className="pt-2 border-t border-border/50 mt-2">
              {loading ? (
                <div className="w-full h-10 bg-muted rounded-xl animate-pulse" />
              ) : user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-primary" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                    Masuk
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-glow text-white shadow-md transition-colors">
                    Daftar
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
