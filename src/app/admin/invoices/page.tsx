"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Download, Eye, Send, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface InvoiceRow {
  id: string
  tenant_id: string
  amount: number
  type: string
  description: string | null
  status: string
  due_date: string | null
  created_at: string
  tenants?: { name: string } | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Lunas", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Terlambat", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-500", icon: Clock },
}

const TYPE_MAP: Record<string, string> = {
  setup_fee: "Setup Fee",
  service_fee: "Service Fee",
  subscription: "Subscription",
  refund: "Refund",
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("invoices")
      .select("id, tenant_id, amount, type, description, status, due_date, created_at, tenants(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data || []).map((d: any) => ({
          ...d,
          tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
        }))
        setInvoices(rows as InvoiceRow[])
        setLoading(false)
      })
  }, [])

  const filtered = invoices.filter((inv) => {
    const tenantName = (inv.tenants as any)?.name || ""
    const matchSearch = tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPending = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="h-6 bg-muted rounded animate-pulse w-16 mx-auto" />
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
          <h1 className="text-2xl font-bold">Invoice</h1>
          <p className="text-muted-foreground mt-1">Kelola invoice untuk travel</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <FileText className="w-4 h-4" />
          Buat Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: invoices.length, color: "text-foreground" },
          { label: "Pending", value: invoices.filter((i) => i.status === "pending").length, color: "text-yellow-600" },
          { label: "Terlambat", value: invoices.filter((i) => i.status === "overdue").length, color: "text-red-500" },
          { label: "Total Lunas", value: formatRupiah(totalPaid), color: "text-green-600" },
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
            placeholder="Cari invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "paid", "overdue", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Semua" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Travel</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deskripsi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jatuh Tempo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv) => {
                const status = STATUS_MAP[inv.status] || STATUS_MAP.pending
                const StatusIcon = status.icon
                const tenantName = (inv.tenants as any)?.name || "-"
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{inv.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{tenantName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{TYPE_MAP[inv.type] || inv.type}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{inv.description}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.due_date || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg"><Download className="w-4 h-4" /></button>
                        {(inv.status === "pending" || inv.status === "overdue") && (
                          <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Send className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
