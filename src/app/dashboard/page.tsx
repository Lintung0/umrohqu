"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, Heart, Clock, Package, ArrowRight } from "lucide-react"

export default function DashboardOverview() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({ bookings: 0, wishlist: 0, completed: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const [bookingsRes, allBookingsRes, wishlistRes] = await Promise.all([
          supabase.from("bookings").select("id, status, created_at, package:packages(name, slug, image_url)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("bookings").select("id, status").eq("customer_id", user.id),
          supabase.from("wishlists").select("id", { count: "exact" }).eq("user_id", user.id),
        ])

        const allBookings = allBookingsRes.data || []
        setRecentBookings(bookingsRes.data || [])
        setStats({
          bookings: allBookings.filter((b: any) => b.status === "pending_payment" || b.status === "confirmed").length,
          wishlist: wishlistRes.count || 0,
          completed: allBookings.filter((b: any) => b.status === "completed").length,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Selamat Datang{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola perjalanan ibadah Anda dari sini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/bookings" className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.bookings}</p>
              <p className="text-xs text-muted-foreground">Booking Aktif</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary mt-3 group-hover:underline">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link href="/dashboard/wishlist" className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.wishlist}</p>
              <p className="text-xs text-muted-foreground">Wishlist</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary mt-3 group-hover:underline">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/search" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
            <Package className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium">Cari Paket Umroh</p>
              <p className="text-xs text-muted-foreground">Temukan paket terbaik untuk Anda</p>
            </div>
          </Link>
          <Link href="/dashboard/wishlist" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-rose-50 hover:border-rose-200 transition-colors">
            <Heart className="w-5 h-5 text-rose-600" />
            <div>
              <p className="text-sm font-medium">Lihat Wishlist</p>
              <p className="text-xs text-muted-foreground">Paket yang Anda simpan</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Booking Terakhir</h2>
          <Link href="/dashboard/bookings" className="text-xs text-primary hover:underline">Lihat Semua</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada booking</p>
            <Link href="/search" className="text-xs text-primary hover:underline mt-2 inline-block">Mulai Cari Paket</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking: any) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.package?.name || "Paket Umroh"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                  booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                  booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {booking.status === "pending_payment" ? "Menunggu" :
                   booking.status === "confirmed" ? "Dikonfirmasi" :
                   booking.status === "completed" ? "Selesai" :
                   booking.status === "cancelled" ? "Dibatalkan" : booking.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
