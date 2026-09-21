"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, BookOpen, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight, Users, DollarSign, Package, Zap } from "lucide-react"
import Link from "next/link"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-gold)",
  verified: "var(--color-brand-900, #0E5C4E)",
  rejected: "#e53e3e",
  open: "#3b82f6",
  in_progress: "var(--color-gold)",
  resolved: "var(--color-brand-900, #0E5C4E)",
}

const BRAND_PRIMARY = "#0E5C4E"

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

  const totalRevenue = data.reduce((sum, d) => sum + d.gmv, 0)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" role="img" aria-label={`Tren GMV: total ${formatRupiah(totalRevenue)}`}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_PRIMARY} stopOpacity={0.25} />
          <stop offset="50%" stopColor={BRAND_PRIMARY} stopOpacity={0.08} />
          <stop offset="100%" stopColor={BRAND_PRIMARY} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={BRAND_PRIMARY} stopOpacity={0.6} />
          <stop offset="50%" stopColor={BRAND_PRIMARY} stopOpacity={1} />
          <stop offset="100%" stopColor={BRAND_PRIMARY} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={points.join(" ")} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (d.gmv / max) * (h - 10)
        const isLast = i === data.length - 1
        return (
          <g key={i}>
            {isLast && <circle cx={x} cy={y} r="8" fill={BRAND_PRIMARY} opacity={0.12} />}
            <circle cx={x} cy={y} r={isLast ? 5 : 3.5} fill={BRAND_PRIMARY} stroke="white" strokeWidth="2" />
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ travelCount: 0, bookingCount: 0, totalRevenue: 0, pendingTravel: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [pendingTravels, setPendingTravels] = useState<any[]>([])
  const [chartData, setChartData] = useState<{ month: string; gmv: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [travelRes, bookingRes, allBookingsRes, pendingTravelRes] = await Promise.all([
          supabase.from("tenants").select("id, status").is("deleted_at", null),
          supabase.from("bookings").select("id, status, total, pilgrim_count, package:packages(name), customer:users(full_name), created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
          supabase.from("bookings").select("id, total, status").is("deleted_at", null),
          supabase.from("tenants").select("id, name, status, created_at").eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }).limit(4),
        ])

        const tenants = travelRes.data || []
        const allBookings = allBookingsRes.data || []
        const REVENUE_STATUSES = ["processing", "confirmed", "completed"]
        const totalRevenue = allBookings
          .filter((b: any) => REVENUE_STATUSES.includes(b.status))
          .reduce((s: number, b: any) => s + (b.total || 0), 0)

        setStats({
          travelCount: travelRes.data?.length || 0,
          bookingCount: allBookings.length,
          totalRevenue,
          pendingTravel: tenants.filter((t) => t.status === "pending").length,
        })
        setRecentBookings(bookingRes.data || [])
        setPendingTravels(pendingTravelRes.data || [])

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        const revenueByMonth = new Map<string, number>()
        allBookings
          .filter((b: any) => REVENUE_STATUSES.includes(b.status) && b.created_at)
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
      } catch (error) {
        console.error("Admin dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Realtime: refresh stats when bookings/tenants change
  useEffect(() => {
    async function refresh() {
      try {
        const [travelRes, allBookingsRes] = await Promise.all([
          supabase.from("tenants").select("id, status").is("deleted_at", null),
          supabase.from("bookings").select("id, total, status").is("deleted_at", null),
        ])
        const tenants = travelRes.data || []
        const allBookings = allBookingsRes.data || []
        const REVENUE_STATUSES = ["processing", "confirmed", "completed"]
        const totalRevenue = allBookings
          .filter((b: any) => REVENUE_STATUSES.includes(b.status))
          .reduce((s: number, b: any) => s + (b.total || 0), 0)
        setStats({
          travelCount: tenants.length,
          bookingCount: allBookings.length,
          totalRevenue,
          pendingTravel: tenants.filter((t) => t.status === "pending").length,
        })
      } catch {}
    }
    const channel = supabase
      .channel("admin-dash-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tenants" }, refresh)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

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
          <p className="text-muted-foreground text-sm mt-1">UmrahQu Platform · {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Link href="/admin/travels" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors w-fit">
          Kelola Travel <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards - Minimalist White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Building2, label: "Total Travel", value: stats.travelCount, sub: `${stats.pendingTravel} menunggu verifikasi`, iconBg: "bg-emerald-50 text-emerald-600" },
          { icon: BookOpen, label: "Total Pesanan", value: stats.bookingCount, sub: "Sepanjang platform", iconBg: "bg-blue-50 text-blue-600" },
          { icon: DollarSign, label: "Pendapatan Platform", value: formatRupiah(stats.totalRevenue), sub: "Dari booking confirmed", iconBg: "bg-amber-50 text-amber-600" },
          { icon: AlertTriangle, label: "Menunggu Verifikasi", value: stats.pendingTravel, sub: "Travel menunggu tinjauan", iconBg: "bg-rose-50 text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
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
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Semua Travel Terverifikasi</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada travel yang perlu diverifikasi saat ini</p>
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
            <h2 className="font-semibold">Pesanan Terbaru</h2>
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
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verifikasi Travel", href: "/admin/verification", icon: CheckCircle, iconBg: "bg-emerald-50 text-emerald-600" },
          { label: "Promo Platform", href: "/admin/billing-promos", icon: Zap, iconBg: "bg-amber-50 text-amber-600" },
          { label: "Konfigurasi Fee", href: "/admin/service-fees", icon: DollarSign, iconBg: "bg-blue-50 text-blue-600" },
          { label: "Laporan Keuangan", href: "/admin/billing-reports", icon: TrendingUp, iconBg: "bg-purple-50 text-purple-600" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md transition-all flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${l.iconBg}`}>
              <l.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-700">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
