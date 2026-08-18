"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Search, Eye, Check, X, Download, Users } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel, BOOKING_STATUSES } from "@/lib/constants"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

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
  const { t } = useTranslation()
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
    const updateData: Record<string, any> = { status: newStatus }
    if (newStatus === "confirmed") updateData.payment_status = "paid"
    if (newStatus === "cancelled") updateData.payment_status = "cancelled"
    const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)
    if (error) {
      toast.error(t("travel_dashboard.status_update_failed"))
    } else {
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: newStatus, ...(updateData.payment_status ? { payment_status: updateData.payment_status } : {}) } : b))
      toast.success(t("travel_dashboard.status_updated"))
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
          <h1 className="text-2xl font-bold">{t("travel_dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("travel_dashboard.manage_bookings")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("travel_dashboard.total"), value: bookings.length, color: "text-foreground" },
          { label: t("travel_dashboard.pending"), value: bookings.filter((b) => b.status === "pending_payment").length, color: "text-yellow-600" },
          { label: t("travel_dashboard.processing"), value: bookings.filter((b) => b.status === "processing").length, color: "text-purple-600" },
          { label: t("travel_dashboard.confirmed"), value: bookings.filter((b) => b.status === "confirmed").length, color: "text-green-600" },
          { label: t("travel_dashboard.revenue"), value: formatRupiah(totalRevenue), color: "text-emerald-600" },
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
            placeholder={t("travel_dashboard.search_placeholder")}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.customer")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.package")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.amount")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("booking.total")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.fee")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("booking.status")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.channel")}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("travel_dashboard.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{t("travel_dashboard.no_bookings")}</td>
                </tr>
              ) : filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{booking.customer?.full_name || t("travel_dashboard.customer")}</p>
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
                      {booking.status === "processing" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          title={t("travel_dashboard.confirm_title")}
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          {t("travel_dashboard.confirm_btn")}
                        </button>
                      )}
                      {booking.status === "pending_payment" && (
                        <span className="px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg">
                          Menunggu Pembayaran
                        </span>
                      )}
                      {booking.status === "processing" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("travel_dashboard.reject_title")}
                        >
                          <X className="w-4 h-4" />
                        </button>
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
