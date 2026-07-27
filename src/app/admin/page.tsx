"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Building2, BookOpen, DollarSign, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ travelCount: 0, bookingCount: 0, totalRevenue: 0, pendingTravel: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [travelRes, bookingRes] = await Promise.all([
        supabase.from("tenants").select("id, status", { count: "exact" }).is("deleted_at", null),
        supabase.from("bookings").select("id, status, total, pilgrim_count, package:packages(name), customer:users(full_name), created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
      ])

      const tenants = travelRes.data || []
      const bookings = bookingRes.data || []
      const totalRevenue = bookings.filter((b: any) => b.status === "confirmed" || b.status === "completed").reduce((s: number, b: any) => s + (b.total || 0), 0)

      setStats({
        travelCount: travelRes.count || 0,
        bookingCount: bookings.length,
        totalRevenue,
        pendingTravel: tenants.filter((t) => t.status === "pending").length,
      })
      setRecentBookings(bookings)
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview seluruh sistem UmrohQ</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Total Travel", value: stats.travelCount, color: "bg-emerald-100 text-emerald-600" },
          { icon: BookOpen, label: "Total Booking", value: stats.bookingCount, color: "bg-blue-100 text-blue-600" },
          { icon: DollarSign, label: "Revenue Platform", value: formatRupiah(stats.totalRevenue), color: "bg-purple-100 text-purple-600" },
          { icon: AlertTriangle, label: "Pending Verifikasi", value: stats.pendingTravel, color: "bg-yellow-100 text-yellow-600" },
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
            <Link href="/admin/invoices" className="text-sm text-emerald-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">Belum ada booking</p>
            ) : recentBookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.customer?.full_name || "Pelanggan"}</p>
                  <p className="text-xs text-muted-foreground">{b.package?.name || "Paket"} · {b.pilgrim_count} jamaah</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status, "booking")}`}>
                  {getStatusLabel(b.status, "booking")}
                </span>
                <p className="text-sm font-semibold shrink-0">{formatRupiah(b.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/admin/travels" className="block bg-white border border-border rounded-2xl p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Akun Travel</p>
                <p className="text-sm text-muted-foreground">{stats.travelCount} terdaftar</p>
              </div>
              {stats.pendingTravel > 0 && (
                <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">{stats.pendingTravel} pending</span>
              )}
            </div>
          </Link>

          <Link href="/admin/billing-promos" className="block bg-white border border-border rounded-2xl p-5 hover:bg-gray-50 transition-colors">
            <p className="font-semibold">Promo</p>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola promo platform</p>
          </Link>

          <Link href="/admin/service-fees" className="block bg-emerald-600 text-white rounded-2xl p-5 hover:bg-emerald-700 transition-colors">
            <p className="font-semibold">Fee & Revenue</p>
            <p className="text-emerald-100 text-sm mt-0.5">Pengaturan biaya layanan</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
