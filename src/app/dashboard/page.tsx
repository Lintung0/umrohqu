"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, Heart, Package, Clock, Search, ChevronRight, Calendar } from "lucide-react"
import StatCard from "@/components/shared/stat-card"
import { getStatusColor, getStatusLabel, formatRupiah } from "@/lib/constants"

export default function DashboardOverview() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({ bookings: 0, wishlist: 0, completed: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const [bookingsRes, allBookingsRes, wishlistRes] = await Promise.all([
            supabase.from("bookings").select("id, status, total, created_at, package:packages(name, slug)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
            supabase.from("bookings").select("id, status, created_at").eq("customer_id", user.id),
            supabase.from("wishlists").select("id", { count: "exact" }).eq("user_id", user.id),
          ])

          const allBookings = allBookingsRes.data || []
          setRecentBookings(bookingsRes.data || [])

          const thisMonth = allBookings.filter((b: any) => {
            const d = new Date(b.created_at)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length

          setStats({
            bookings: allBookings.filter((b: any) => b.status === "pending_payment" || b.status === "confirmed").length,
            wishlist: wishlistRes.count || 0,
            completed: allBookings.filter((b: any) => b.status === "completed").length,
          })
        }
      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Jamaah"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white p-6 sm:p-8 flex items-start justify-between">
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="dash-islamic" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <polygon points="22,2 26,17 41,17 29,27 33,42 22,32 11,42 15,27 3,17 18,17" fill="none" stroke="#d4a017" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dash-islamic)" />
        </svg>
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">Dashboard Jamaah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-lg">
            Selamat Datang, <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-emerald-100/80 mt-1 text-sm sm:text-base">Kelola perjalanan ibadah Anda dari sini</p>
        </div>
        <div className="relative hidden sm:flex items-center gap-2 text-sm text-emerald-50 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <Calendar className="w-4 h-4 text-amber-300" />
          {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          label="Pesan Aktif"
          value={stats.bookings}
          color="bg-emerald-100 text-emerald-600"
          href="/dashboard/bookings"
          subtitle={`${stats.bookings} pesanan sedang diproses`}
        />
        <StatCard
          icon={Heart}
          label="Daftar Keinginan"
          value={stats.wishlist}
          color="bg-rose-100 text-rose-600"
          href="/dashboard/wishlist"
          subtitle={`${stats.wishlist} paket tersimpan`}
        />
        <StatCard
          icon={Package}
          label="Selesai"
          value={stats.completed}
          color="bg-blue-100 text-blue-600"
          subtitle={`${stats.completed} perjalanan selesai`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/search"
          className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0 group-hover:from-emerald-500 group-hover:to-emerald-700 group-hover:text-white transition-colors">
              <Search className="w-5 h-5 text-emerald-600 group-hover:text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Cari Paket Umroh</p>
              <p className="text-xs text-muted-foreground mt-0.5">Temukan paket terbaik untuk Anda</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-all group-hover:translate-x-0.5" />
          </div>
        </Link>
        <Link
          href="/dashboard/wishlist"
          className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-100/50 hover:border-rose-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shrink-0 group-hover:from-rose-500 group-hover:to-rose-600 group-hover:text-white transition-colors">
              <Heart className="w-5 h-5 text-rose-600 group-hover:text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Lihat Wishlist</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stats.wishlist} paket yang Anda simpan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 transition-all group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              Pesan Terakhir
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">Aktivitas booking terbaru Anda</p>
          </div>
          <Link href="/dashboard/bookings" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline">
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5 pt-3">
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                <Clock className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Belum ada booking</p>
              <Link href="/search" className="mt-3 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 inline-flex items-center gap-1">
                Mulai Cari Paket <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((booking: any) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-emerald-50/40 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0 group-hover:from-emerald-500 group-hover:to-emerald-700 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-emerald-700 transition-colors">{booking.package?.name || "Paket Umroh"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium ${getStatusColor(booking.status, "booking")}`}>
                      {getStatusLabel(booking.status, "booking")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
