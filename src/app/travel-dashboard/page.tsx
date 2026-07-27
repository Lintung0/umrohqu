"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Package, BookOpen, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

interface TravelStats {
  packageCount: number
  bookingCount: number
  totalRevenue: number
  totalPilgrims: number
  recentBookings: any[]
}

export default function TravelDashboardOverview() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [stats, setStats] = useState<TravelStats>({ packageCount: 0, bookingCount: 0, totalRevenue: 0, totalPilgrims: 0, recentBookings: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const [packagesRes, bookingsRes] = await Promise.all([
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id).is("deleted_at", null),
        supabase.from("bookings").select("id, status, pilgrim_count, price, fee, total, package:packages(name), customer:users(full_name), created_at").eq("tenant_id", profile.tenant_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
      ])

      const bookings = bookingsRes.data || []
      const totalRevenue = bookings.filter((b: any) => b.status === "confirmed" || b.status === "completed").reduce((sum: number, b: any) => sum + (b.price || 0), 0)
      const totalPilgrims = bookings.filter((b: any) => b.status !== "cancelled").reduce((sum: number, b: any) => sum + (b.pilgrim_count || 0), 0)
      const pendingBookings = bookings.filter((b: any) => b.status === "pending_payment").length

      setStats({
        packageCount: packagesRes.count || 0,
        bookingCount: bookings.length,
        totalRevenue,
        totalPilgrims,
        recentBookings: bookings,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const displayName = user?.user_metadata?.full_name || "Travel"

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Travel</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {displayName}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Paket Aktif", value: stats.packageCount, color: "bg-emerald-100 text-emerald-600" },
          { icon: BookOpen, label: "Total Booking", value: stats.bookingCount, color: "bg-blue-100 text-blue-600" },
          { icon: DollarSign, label: "Total Revenue", value: formatRupiah(stats.totalRevenue), color: "bg-purple-100 text-purple-600" },
          { icon: Users, label: "Total Jamaah", value: stats.totalPilgrims, color: "bg-amber-100 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Booking Terbaru</h2>
            <Link href="/travel-dashboard/bookings" className="text-sm text-emerald-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-border">
            {stats.recentBookings.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">Belum ada booking</p>
            ) : stats.recentBookings.slice(0, 5).map((booking: any) => (
              <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{booking.customer?.full_name || "Pelanggan"}</p>
                  <p className="text-xs text-muted-foreground">{booking.package?.name || "Paket"} · {booking.pilgrim_count} jamaah</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, "booking")}`}>
                  {getStatusLabel(booking.status, "booking")}
                </span>
                <p className="text-sm font-semibold shrink-0">{formatRupiah(booking.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/travel-dashboard/packages" className="block bg-emerald-600 text-white rounded-2xl p-5 hover:bg-emerald-700 transition-colors">
            <Package className="w-6 h-6 mb-2" />
            <p className="font-semibold">Kelola Paket</p>
            <p className="text-emerald-100 text-sm mt-0.5">{stats.packageCount} paket</p>
          </Link>

          <Link href="/travel-dashboard/reports" className="block bg-white border border-border rounded-2xl p-5 hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-6 h-6 mb-2 text-emerald-600" />
            <p className="font-semibold">Lihat Laporan</p>
            <p className="text-muted-foreground text-sm mt-0.5">Revenue & analytics</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
