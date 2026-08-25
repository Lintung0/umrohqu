"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Download, DollarSign, Receipt, CreditCard, AlertTriangle, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface TenantRow {
  id: string
  name: string
  status: string
  total_revenue: number
}

interface InvoiceRow {
  id: string
  amount: number
  status: string
  created_at: string
}

interface RevenueRow {
  month: string
  revenue: number
  bookings: number
}

export default function AdminBillingReportsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [revenue, setRevenue] = useState<RevenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: tnts } = await supabase
        .from("tenants")
        .select("id, name, status, total_revenue")
        .is("deleted_at", null)

      setTenants((tnts as TenantRow[]) || [])

      const { data: invs } = await supabase
        .from("invoices")
        .select("id, amount, status, created_at")

      setInvoices((invs as InvoiceRow[]) || [])

      // Generate revenue data from bookings by month
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
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0)
  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="h-6 bg-muted rounded animate-pulse w-16 mb-2" />
              <div className="h-4 bg-muted rounded animate-pulse w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground mt-1">Laporan keuangan dari sisi UmrahQu</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Ekspor Laporan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: "Total Pendapatan", value: formatRupiah(totalRevenue), color: "bg-emerald-100 text-emerald-700" },
          { icon: Receipt, label: "Service Fee Terkumpul", value: formatRupiah(totalPaid), color: "bg-blue-100 text-blue-700" },
          { icon: CreditCard, label: "Belum Dibayar", value: formatRupiah(totalPending), color: "bg-amber-100 text-amber-700" },
          { icon: AlertTriangle, label: "Terlambat", value: invoices.filter((i) => i.status === "overdue").length, color: "bg-red-100 text-red-700" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-3">Ringkasan Invoice</h2>
          <div className="space-y-2 text-sm">
            {(["paid", "pending", "overdue", "cancelled"] as const).map((status) => {
              const invs = invoices.filter((i) => i.status === status)
              const total = invs.reduce((s, i) => s + i.amount, 0)
              return (
                <div key={status} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                  <span className="capitalize text-muted-foreground">{status === "paid" ? "Lunas" : status === "pending" ? "Menunggu" : status === "overdue" ? "Terlambat" : "Dibatalkan"}</span>
                  <span className="font-medium">{invs.length} invoice · {formatRupiah(total)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-3">Travel dengan Pendapatan Tertinggi</h2>
          <div className="space-y-2">
            {tenants.filter((t) => t.status === "active").sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground">{formatRupiah(t.total_revenue || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
