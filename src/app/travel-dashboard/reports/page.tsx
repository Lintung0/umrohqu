"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BarChart3, TrendingUp, DollarSign, Package, Users } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

interface BookingRow {
  status: string
  pilgrim_count: number
  price: number
  fee: number
  total: number
  booking_channel: string
  created_at: string
  package: { name: string } | null
}

export default function TravelReportsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const { data } = await supabase
        .from("bookings")
        .select("status, pilgrim_count, price, fee, total, booking_channel, created_at, package:packages(name)")
        .eq("tenant_id", profile.tenant_id)
        .is("deleted_at", null)

      setBookings((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  const paidBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed")
  const totalRevenue = paidBookings.reduce((s, b) => s + (b.price || 0), 0)
  const totalFees = paidBookings.reduce((s, b) => s + (b.fee || 0), 0)
  const totalBookings = bookings.length
  const totalPilgrims = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + (b.pilgrim_count || 0), 0)
  const avgBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0

  const marketplaceBookings = bookings.filter((b) => b.booking_channel === "marketplace")
  const subdomainBookings = bookings.filter((b) => b.booking_channel !== "marketplace")

  const topBookings = paidBookings.sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-muted-foreground mt-1">Analitik revenue dan performa travel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: DollarSign, label: "Total Pendapatan", value: formatRupiah(totalRevenue), color: "bg-emerald-100 text-emerald-700" },
          { icon: BarChart3, label: "Total Biaya", value: formatRupiah(totalFees), color: "bg-blue-100 text-blue-700" },
          { icon: Package, label: "Total Booking", value: totalBookings, color: "bg-purple-100 text-purple-700" },
          { icon: Users, label: "Total Jamaah", value: totalPilgrims, color: "bg-amber-100 text-amber-700" },
          { icon: TrendingUp, label: "Rata-rata/Booking", value: formatRupiah(avgBooking), color: "bg-pink-100 text-pink-700" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4">Rincian per Channel</h2>
          <div className="space-y-3">
            {[
              { channel: "marketplace", label: "Portal Utama", bookings: marketplaceBookings, color: "bg-emerald-500" },
              { channel: "subdomain", label: "Subdomain", bookings: subdomainBookings, color: "bg-blue-500" },
            ].map(({ label, bookings: chBookings, color }) => {
              const rev = chBookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + (b.price || 0), 0)
              const pct = totalBookings > 0 ? (chBookings.length / totalBookings) * 100 : 0
              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{chBookings.length} booking · {formatRupiah(rev)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4">Top Booking</h2>
          <div className="space-y-3">
            {topBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada booking</p>
            ) : topBookings.map((booking, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.package?.name || "Paket"}</p>
                  <p className="text-xs text-muted-foreground">{booking.pilgrim_count} jamaah</p>
                </div>
                <p className="text-sm font-bold shrink-0">{formatRupiah(booking.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
