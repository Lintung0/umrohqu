"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Download, DollarSign, Building2, Users, Package, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface TenantRow {
  id: string
  name: string
  city: string | null
  status: string
  total_revenue: number
  packages_count: number
}

interface RevenueRow {
  month: string
  revenue: number
  bookings: number
}

export default function AdminReportsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [revenue, setRevenue] = useState<RevenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: tnts } = await supabase
        .from("tenants")
        .select("id, name, city, status, total_revenue, packages_count")
        .is("deleted_at", null)

      setTenants((tnts as TenantRow[]) || [])

      const { data: bkgs } = await supabase
        .from("bookings")
        .select("total, created_at")
        .is("deleted_at", null)
        .eq("status", "confirmed")

      if (bkgs) {
        const monthly: Record<string, { revenue: number; bookings: number }> = {}
        bkgs.forEach((b: any) => {
          const date = new Date(b.created_at)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          if (!monthly[key]) monthly[key] = { revenue: 0, bookings: 0 }
          monthly[key].revenue += b.total || 0
          monthly[key].bookings += 1
        })
        const revArray = Object.entries(monthly)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([key, val]) => ({ month: key, ...val }))
        setRevenue(revArray)
      }

      setLoading(false)
    }
    fetch()
  }, [])

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalBookings = revenue.reduce((s, r) => s + r.bookings, 0)
  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1)
  const activeTravels = tenants.filter((t) => t.status === "active")

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="h-8 bg-muted rounded animate-pulse w-8 mb-2" />
              <div className="h-5 bg-muted rounded animate-pulse w-20 mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Sistem</h1>
          <p className="text-muted-foreground mt-1">Analitik seluruh platform UmrahQu</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Ekspor Laporan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: DollarSign, label: "Total Pendapatan", value: formatRupiah(totalRevenue), color: "bg-emerald-100 text-emerald-700" },
          { icon: Package, label: "Total Pesanan", value: totalBookings, color: "bg-blue-100 text-blue-700" },
          { icon: Building2, label: "Total Travel", value: tenants.length, color: "bg-purple-100 text-purple-700" },
          { icon: Users, label: "Travel Aktif", value: activeTravels.length, color: "bg-amber-100 text-amber-700" },
          { icon: TrendingUp, label: "Rata-rata/Travel", value: formatRupiah(activeTravels.length > 0 ? Math.round(totalRevenue / activeTravels.length) : 0), color: "bg-pink-100 text-pink-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color} mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold mb-4">Pendapatan Platform per Bulan</h2>
        <div className="flex items-end gap-3 h-48">
          {revenue.map((r) => (
            <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{formatRupiah(r.revenue)}</p>
              <div
                className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                style={{ height: `${(r.revenue / maxRevenue) * 100}%` }}
              />
              <p className="text-xs font-medium">{r.month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold mb-4">Travel Teratas berdasarkan Pendapatan</h2>
        <div className="space-y-3">
          {activeTravels.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 5).map((travel, idx) => (
            <div key={travel.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
              <span className="text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{travel.name}</p>
                <p className="text-xs text-muted-foreground">{travel.city || "-"} · {travel.packages_count || 0} paket</p>
              </div>
              <p className="text-sm font-bold shrink-0">{formatRupiah(travel.total_revenue || 0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
