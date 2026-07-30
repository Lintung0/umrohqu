"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Search, Eye, Check, X, Download, Users } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel, BOOKING_STATUSES } from "@/lib/constants"
import { toast } from "sonner"

interface BookingRow {
  id: string
  status: string
  pilgrim_count: number
  price: number
  fee: number
  total: number
  booking_channel: string
  created_at: string
  package: { name: string } | null
  customer: { full_name: string; email: string } | null
}

export default function TravelBookingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
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
        .select("id, status, pilgrim_count, price, fee, total, booking_channel, created_at, package:packages(name), customer:users(full_name, email)")
        .eq("tenant_id", profile.tenant_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      setBookings((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId)
    if (error) {
      toast.error("Gagal mengubah status")
    } else {
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: newStatus } : b))
      toast.success("Status booking diperbarui")
    }
  }

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || b.customer?.full_name?.toLowerCase().includes(q) || b.id.includes(q) || b.package?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || statusFilter === "semua" || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRevenue = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + (b.price || 0), 0)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pesanan</h1>
          <p className="text-muted-foreground mt-1">Kelola semua pesanan masuk dari jamaah</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: bookings.length, color: "text-foreground" },
          { label: "Menunggu", value: bookings.filter((b) => b.status === "pending_payment").length, color: "text-yellow-600" },
          { label: "Diproses", value: bookings.filter((b) => b.status === "processing").length, color: "text-purple-600" },
          { label: "Dikonfirmasi", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-green-600" },
          { label: "Revenue", value: formatRupiah(totalRevenue), color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, paket, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {BOOKING_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s.value ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pelanggan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Channel</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Tidak ada pesanan</td>
                </tr>
              ) : filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{booking.customer?.full_name || "Pelanggan"}</p>
                    <p className="text-xs text-muted-foreground">{booking.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{booking.package?.name}</td>
                  <td className="px-4 py-3">{booking.pilgrim_count}</td>
                  <td className="px-4 py-3 font-semibold">{formatRupiah(booking.total)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRupiah(booking.fee)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, "booking")}`}>
                      {getStatusLabel(booking.status, "booking")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${booking.booking_channel === "marketplace" ? "text-emerald-600" : "text-blue-600"}`}>
                      {booking.booking_channel === "marketplace" ? "Portal" : "Subdomain"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(booking.status === "pending_payment" || booking.status === "processing") && (
                        <>
                          {booking.status === "processing" ? (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Konfirmasi pembayaran"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              Konfirmasi
                            </button>
                          ) : (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Konfirmasi"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => updateBookingStatus(booking.id, "cancelled")}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Tolak"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
