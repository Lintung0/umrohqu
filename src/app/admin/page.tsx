"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, BookOpen, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight, Users, DollarSign, Package, Zap } from "lucide-react"
import Link from "next/link"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import StatCard from "@/components/shared/stat-card"

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9A24B",
  verified: "#0E5C4E",
  rejected: "#e53e3e",
  open: "#3b82f6",
  in_progress: "#C9A24B",
  resolved: "#0E5C4E",
}

function MiniChart({ data }: { data: { month: string; gmv: number }[] }) {
  const max = Math.max(...data.map((d) => d.gmv), 1)
  const w = 300
  const h = 80
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (d.gmv / max) * (h - 10)
    return `${x},${y}`
  })
  const area = `0,${h} ${points.join(" ")} ${w},${h}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E5C4E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0E5C4E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={points.join(" ")} fill="none" stroke="#0E5C4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (d.gmv / max) * (h - 10)
        return <circle key={i} cx={x} cy={y} r="4" fill="#0E5C4E" stroke="white" strokeWidth="2" />
      })}
    </svg>
  )
}

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ travelCount: 0, bookingCount: 0, totalRevenue: 0, pendingTravel: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [pendingTravels, setPendingTravels] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [chartData, setChartData] = useState<{ month: string; gmv: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [travelRes, bookingRes, allBookingsRes, pendingTravelRes, ticketsRes] = await Promise.all([
        supabase.from("tenants").select("id, status").is("deleted_at", null),
        supabase.from("bookings").select("id, status, total, pilgrim_count, package:packages(name), customer:users(full_name), created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, total, status").is("deleted_at", null),
        supabase.from("tenants").select("id, name, city, status, created_at").eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }).limit(4),
        supabase.from("support_tickets").select("id, subject, status, priority, created_at, user:users(full_name)").order("created_at", { ascending: false }).limit(4),
      ])

      const tenants = travelRes.data || []
      const allBookings = allBookingsRes.data || []
      const totalRevenue = allBookings
        .filter((b: any) => b.status === "confirmed" || b.status === "completed")
        .reduce((s: number, b: any) => s + (b.total || 0), 0)

      setStats({
        travelCount: travelRes.data?.length || 0,
        bookingCount: allBookings.length,
        totalRevenue,
        pendingTravel: tenants.filter((t) => t.status === "pending").length,
      })
      setRecentBookings(bookingRes.data || [])
      setPendingTravels(pendingTravelRes.data || [])
      setRecentTickets(ticketsRes.data || [])

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
      const revenueByMonth = new Map<string, number>()
      allBookings
        .filter((b: any) => (b.status === "confirmed" || b.status === "completed") && b.created_at)
        .forEach((b: any) => {
          const d = new Date(b.created_at)
          const key = monthNames[d.getMonth()]
          revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + (b.total || 0))
        })
      const now = new Date()
      const chart: { month: string; gmv: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const name = monthNames[m.getMonth()]
        chart.push({ month: name, gmv: revenueByMonth.get(name) || 0 })
      }
      setChartData(chart)

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Ringkasan Sistem</h1>
          <p className="text-muted-foreground text-sm mt-1">UmrohQ Platform · {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Link href="/admin/travels" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors w-fit">
          Kelola Travel <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards - Gradient */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Building2, label: "Total Travel", value: stats.travelCount, sub: `${stats.pendingTravel} menunggu verifikasi`, gradient: "from-emerald-500 to-emerald-700" },
          { icon: BookOpen, label: "Total Booking", value: stats.bookingCount, sub: "Sepanjang platform", gradient: "from-blue-500 to-blue-700" },
          { icon: DollarSign, label: "Revenue Platform", value: formatRupiah(stats.totalRevenue), sub: "Dari booking confirmed", gradient: "from-amber-500 to-orange-600" },
          { icon: AlertTriangle, label: "Pending Verifikasi", value: stats.pendingTravel, sub: "Travel menunggu review", gradient: "from-red-500 to-rose-600" },
        ].map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} subtitle={s.sub} variant="gradient" gradient={s.gradient} />
        ))}
      </div>

      {/* GMV Chart + Pending Travels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* GMV Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Tren GMV Platform</h2>
              <p className="text-xs text-muted-foreground mt-0.5">6 bulan terakhir</p>
            </div>
            <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
              Rp {((chartData[chartData.length - 1]?.gmv || 0) / 1_000_000_000).toFixed(1)}M
            </span>
          </div>
          <MiniChart data={chartData} />
          <div className="flex justify-between mt-2">
            {chartData.map((d) => (
              <span key={d.month} className="text-xs text-muted-foreground">{d.month}</span>
            ))}
          </div>
        </div>

        {/* Pending Travel Verifications */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Verifikasi Travel</h2>
            <Link href="/admin/verification" className="text-xs text-primary hover:underline">Lihat Semua</Link>
          </div>
          {pendingTravels.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/30" />
              Semua travel sudah diverifikasi
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTravels.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city || "Indonesia"}</p>
                  </div>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings + Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Booking Terbaru</h2>
            <Link href="/admin/invoices" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">Belum ada booking</p>
            ) : recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(b.customer?.full_name || "P").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.customer?.full_name || "Pelanggan"}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.package?.name || "Paket"} · {b.pilgrim_count} jamaah</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(b.status, "booking")}`}>
                  {getStatusLabel(b.status, "booking")}
                </span>
                <p className="text-sm font-semibold shrink-0">{formatRupiah(b.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-sm">Tiket Terbaru</h2>
            <Link href="/admin/tickets" className="text-xs text-primary hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">Tidak ada tiket aktif</p>
            ) : recentTickets.map((t: any) => (
              <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-1">{t.subject}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${STATUS_COLORS[t.status] || "#888"}15`, color: STATUS_COLORS[t.status] || "#888" }}>
                    {t.status === "open" ? "Baru" : t.status === "in_progress" ? "Diproses" : "Selesai"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.user?.full_name || "Pengguna"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verifikasi Travel", href: "/admin/verification", icon: CheckCircle, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Promo Platform", href: "/admin/billing-promos", icon: Zap, gradient: "from-amber-500 to-orange-600" },
          { label: "Konfigurasi Fee", href: "/admin/service-fees", icon: DollarSign, gradient: "from-blue-500 to-blue-700" },
          { label: "Laporan Keuangan", href: "/admin/billing-reports", icon: TrendingUp, gradient: "from-purple-500 to-purple-700" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className={`rounded-2xl p-4 text-white text-sm font-semibold hover:shadow-lg hover:opacity-90 transition-all bg-gradient-to-br ${l.gradient} flex items-center gap-3`}>
            <l.icon className="w-5 h-5 opacity-80" />
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
