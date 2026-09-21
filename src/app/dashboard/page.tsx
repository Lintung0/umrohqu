"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, Heart, Package, Clock, ChevronRight, Calendar } from "lucide-react"
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-deep">Salam, {firstName}</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-dark bg-ivory-card border border-ivory-border rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          label="Pesanan Aktif"
          value={stats.bookings}
          color="bg-gold/15 text-gold-dark"
          href="/dashboard/bookings"
          hideFooter
          className="bg-ivory-card border-ivory-border shadow-none hover:shadow-none"
        />
        <StatCard
          icon={Heart}
          label="Daftar Keinginan"
          value={stats.wishlist}
          color="bg-emerald-dark/10 text-emerald-dark"
          href="/dashboard/wishlist"
          hideFooter
          className="bg-ivory-card border-ivory-border shadow-none hover:shadow-none"
        />
        <StatCard
          icon={Package}
          label="Selesai"
          value={stats.completed}
          color="bg-emerald-dark/10 text-emerald-dark"
          href="/dashboard/bookings"
          hideFooter
          className="bg-ivory-card border-ivory-border shadow-none hover:shadow-none"
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-ivory-card border border-ivory-border rounded-2xl">
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="font-semibold text-emerald-deep">Pesanan Terakhir</h2>
          </div>
          <Link href="/dashboard/bookings" className="text-sm text-emerald-dark hover:text-emerald-deep font-medium flex items-center gap-0.5">
            Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="p-6 pt-4">
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-emerald-dark/25 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Belum ada pesanan</p>
              <Link href="/search" className="text-sm text-emerald-dark hover:underline mt-2 inline-flex items-center gap-1">
                Mulai Cari Paket <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-ivory-border">
              {recentBookings.map((booking: any) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-ivory -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-dark/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-dark" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate text-emerald-deep">{booking.package?.name || "Paket umrah"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusColor(booking.status, "booking")}`}>
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
