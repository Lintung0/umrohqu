"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Package, BookOpen, Users, DollarSign, TrendingUp, CheckCircle, ArrowRight, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import { getTravelTenantId } from "@/lib/get-travel-tenant"

interface TravelStats {
  packageCount: number
  bookingCount: number
  totalRevenue: number
  totalPilgrims: number
  recentBookings: any[]
}

const ONBOARDING_STEPS = [
  { step: 1, label: "Pendaftaran", desc: "Form pendaftaran terisi" },
  { step: 2, label: "Verifikasi Data", desc: "Dokumen terverifikasi" },
  { step: 3, label: "Setup Website", desc: "Pilih template & branding" },
  { step: 4, label: "Training", desc: "Onboarding penggunaan" },
  { step: 5, label: "Go Live", desc: "Website aktif" },
]

export default function TravelDashboardOverview() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [stats, setStats] = useState<TravelStats>({ packageCount: 0, bookingCount: 0, totalRevenue: 0, totalPilgrims: 0, recentBookings: [] })
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const tId = await getTravelTenantId(supabase, user.id)
      if (!tId) { setLoading(false); return }
      setTenantId(tId)

      const [tenantRes, packagesRes, bookingsRes, allBookingsRes] = await Promise.all([
        supabase.from("tenants").select("config, status").eq("id", tId).single(),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", tId).is("deleted_at", null),
        supabase.from("bookings").select("id, status, pilgrim_count, price, fee, total, package:packages(name), customer:users(full_name), created_at").eq("tenant_id", tId).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
        supabase.from("bookings").select("id, status, pilgrim_count, price, total").eq("tenant_id", tId).is("deleted_at", null),
      ])

      if (tenantRes.data) {
        const config = (tenantRes.data.config || {}) as any
        const step = Number(config.onboarding_step)
        if (step >= 1 && step <= 5) {
          setOnboardingStep(step)
        } else if (tenantRes.data.status === "verified") {
          setOnboardingStep(2)
        }
      }

      const bookings = bookingsRes.data || []
      const allBookings = allBookingsRes.data || []

      const totalRevenue = allBookings
        .filter((b: any) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum: number, b: any) => sum + (b.total || 0), 0)
      const totalPilgrims = allBookings
        .filter((b: any) => b.status !== "cancelled")
        .reduce((sum: number, b: any) => sum + (b.pilgrim_count || 0), 0)

      setStats({
        packageCount: packagesRes.count || 0,
        bookingCount: allBookings.length,
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
  const isComplete = onboardingStep >= 5

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Travel</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {displayName}</p>
      </div>

      {!isComplete && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-emerald-900">Progres Onboarding</h2>
              <p className="text-sm text-emerald-700 mt-0.5">
                Langkah {onboardingStep} dari 5 — {ONBOARDING_STEPS[onboardingStep - 1]?.label}
              </p>
              <div className="flex items-center gap-3 mt-3">
                {ONBOARDING_STEPS.map((s) => (
                  <div key={s.step} className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.step < onboardingStep
                        ? "bg-emerald-600 text-white"
                        : s.step === onboardingStep
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                        : "bg-emerald-100 text-emerald-400"
                    }`}>
                      {s.step < onboardingStep ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    {s.step < 5 && <ArrowRight className="w-3 h-3 text-emerald-300" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                Langkah selanjutnya: {ONBOARDING_STEPS[onboardingStep]?.label} — {ONBOARDING_STEPS[onboardingStep]?.desc}
              </p>
            </div>
            <Link
              href="/travel-dashboard/website"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors shrink-0"
            >
              Lanjutkan
            </Link>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">Onboarding selesai! Website Anda sudah aktif.</p>
        </div>
      )}

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
