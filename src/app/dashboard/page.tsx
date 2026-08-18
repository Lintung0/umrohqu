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
            supabase.from("bookings").select("id, status, total, created_at, package:packages(name, slug, image_url)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {firstName}</h1>
          <p className="text-muted-foreground mt-1">Kelola perjalanan ibadah Anda dari sini</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-white border border-border rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="w-4 h-4" />
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
          label="Wishlist"
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
          className="group bg-white border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-emerald-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
              <Search className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Cari Paket Umroh</p>
              <p className="text-xs text-muted-foreground mt-0.5">Temukan paket terbaik untuk Anda</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
          </div>
        </Link>
        <Link
          href="/dashboard/wishlist"
          className="group bg-white border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-rose-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Lihat Wishlist</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stats.wishlist} paket yang Anda simpan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-border rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-semibold">Pesan Terakhir</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Aktivitas booking terbaru Anda</p>
          </div>
          <Link href="/dashboard/bookings" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5 pt-3">
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Belum ada booking</p>
              <Link href="/search" className="text-sm text-emerald-600 hover:underline mt-2 inline-flex items-center gap-1">
                Mulai Cari Paket <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentBookings.map((booking: any) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{booking.package?.name || "Paket Umroh"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(booking.status, "booking")}`}>
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
