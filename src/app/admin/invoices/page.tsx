"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Download, Eye, Send, Clock, CheckCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Lunas", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Terlambat", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-500", icon: Clock },
}

const TYPE_MAP: Record<string, string> = {
  setup_fee: "Biaya Setup",
  service_fee: "Biaya Layanan",
  subscription: "Langganan",
  refund: "Pengembalian",
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    const supabase = createClient()
    const { data } = await supabase
      .from("invoices")
      .select("id, tenant_id, amount, type, description, status, due_date, created_at, tenants(name)")
      .order("created_at", { ascending: false })

    const rows = (data || []).map((d: any) => ({
      ...d,
      tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
    }))
    setInvoices(rows as InvoiceRow[])
    setLoading(false)
  }

  async function handleMarkAsPaid(invoiceId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoiceId)

    if (error) {
      toast.error("Gagal update status: " + error.message)
    } else {
      toast.success("Faktur ditandai sebagai lunas")
      fetchInvoices()
      setSelectedInvoice(null)
    }
  }

  async function handleSendReminder(invoice: InvoiceRow) {
    toast.success(`Pengingat terkirim ke ${invoice.tenants?.name || "travel"}`)
    setSelectedInvoice(null)
  }

  function handleDownloadInvoice(invoice: InvoiceRow) {
    const invoiceContent = `
INVOICE UMROHQ
================
ID: ${invoice.id.slice(0, 8).toUpperCase()}
Travel: ${invoice.tenants?.name || "-"}
Tipe: ${TYPE_MAP[invoice.type] || invoice.type}
Deskripsi: ${invoice.description || "-"}
Jumlah: ${formatRupiah(invoice.amount)}
Status: ${STATUS_MAP[invoice.status]?.label || invoice.status}
Jatuh Tempo: ${invoice.due_date || "-"}
Tanggal: ${new Date(invoice.created_at).toLocaleDateString("id-ID")}
================
Terima kasih.
    `.trim()

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${invoice.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Faktur berhasil diunduh")
  }

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
          <h1 className="text-2xl font-bold">Faktur</h1>
          <p className="text-muted-foreground mt-1">Kelola faktur untuk travel</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Buat Faktur
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: invoices.length, color: "text-foreground" },
          { label: "Menunggu", value: invoices.filter((i) => i.status === "pending").length, color: "text-yellow-600" },
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
                    <td className="px-4 py-3 text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg"
                          title="Unduh"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(inv.status === "pending" || inv.status === "overdue") && (
                          <button
                            onClick={() => handleSendReminder(inv)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Kirim Pengingat"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    Tidak ada invoice ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Detail Invoice</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{selectedInvoice.id.slice(0, 8)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Travel</span><span>{(selectedInvoice.tenants as any)?.name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tipe</span><span>{TYPE_MAP[selectedInvoice.type] || selectedInvoice.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deskripsi</span><span>{selectedInvoice.description || "-"}</span></div>
              <div className="flex justify-between font-bold"><span>Jumlah</span><span className="text-emerald-600">{formatRupiah(selectedInvoice.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_MAP[selectedInvoice.status] || STATUS_MAP.pending).color}`}>
                  {(STATUS_MAP[selectedInvoice.status] || STATUS_MAP.pending).label}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jatuh Tempo</span><span>{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString("id-ID") : "-"}</span></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleDownloadInvoice(selectedInvoice)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> Unduh
              </button>
              {(selectedInvoice.status === "pending" || selectedInvoice.status === "overdue") && (
                <button onClick={() => handleMarkAsPaid(selectedInvoice.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Tandai Lunas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchInvoices() }} />
      )}
    </div>
  )
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantId, setTenantId] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("service_fee")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from("tenants").select("id, name").eq("status", "active").then(({ data }) => {
      setTenants(data || [])
    })
  }, [])

  async function handleCreate() {
    if (!tenantId || !amount) {
      toast.error("Lengkapi semua field")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("invoices").insert({
      tenant_id: tenantId,
      amount: Number(amount),
      type,
      description: description || `Faktur ${type}`,
      status: "pending",
    })
    setSaving(false)
    if (error) {
      toast.error("Gagal membuat invoice: " + error.message)
    } else {
      toast.success("Faktur berhasil dibuat")
      onCreated()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Buat Invoice Baru</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Travel</label>
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Pilih travel</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipe</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="service_fee">Biaya Layanan</option>
              <option value="setup_fee">Biaya Pemasangan</option>
              <option value="subscription">Langganan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi invoice" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Buat
          </button>
        </div>
      </div>
    </div>
  )
}
