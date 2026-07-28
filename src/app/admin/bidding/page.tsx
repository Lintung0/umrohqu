"use client"

import { useState, useEffect } from "react"
import { Target, Eye, MousePointerClick, TrendingUp, Edit, Trash2, Loader2, X } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface BiddingRow {
  id: string
  tenant_id: string
  package_id: string
  bid_value: number
  position: number
  impressions: number
  clicks: number
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  tenants?: { name: string } | null
  packages?: { name: string } | null
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "bg-emerald-100 text-emerald-700" },
  outbid: { label: "Kalah", color: "bg-red-100 text-red-700" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Dibatalkan", color: "bg-yellow-100 text-yellow-700" },
}

export default function AdminBiddingPage() {
  const [biddings, setBiddings] = useState<BiddingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBid, setEditingBid] = useState<BiddingRow | null>(null)
  const [form, setForm] = useState({ bid_value: 0, start_date: "", end_date: "", status: "active" })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBiddings()
  }, [])

  async function fetchBiddings() {
    const supabase = createClient()
    const { data } = await supabase
      .from("biddings")
      .select("id, tenant_id, package_id, bid_value, position, impressions, clicks, status, start_date, end_date, created_at, tenants(name), packages(name)")
      .order("position", { ascending: true })
    const rows = (data || []).map((d: any) => ({
      ...d,
      tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
      packages: Array.isArray(d.packages) ? d.packages[0] : d.packages,
    }))
    setBiddings(rows as BiddingRow[])
    setLoading(false)
  }

  function openEdit(bid: BiddingRow) {
    setEditingBid(bid)
    setForm({
      bid_value: bid.bid_value,
      start_date: bid.start_date || "",
      end_date: bid.end_date || "",
      status: bid.status,
    })
  }

  async function handleSave() {
    if (!editingBid) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("biddings").update({
      bid_value: form.bid_value,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
    }).eq("id", editingBid.id)
    if (error) {
      toast.error("Gagal memperbarui bidding")
    } else {
      toast.success("Bidding berhasil diperbarui")
      setEditingBid(null)
      fetchBiddings()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("biddings").delete().eq("id", deleteId)
    if (error) {
      toast.error("Gagal menghapus bidding")
    } else {
      toast.success("Bidding berhasil dihapus")
      setDeleteId(null)
      fetchBiddings()
    }
    setDeleting(false)
  }

  const totalBudget = biddings.reduce((s, b) => s + b.bid_value, 0)
  const activeBids = biddings.filter((b) => b.status === "active").length
  const totalImpressions = biddings.reduce((s, b) => s + (b.impressions || 0), 0)
  const totalClicks = biddings.reduce((s, b) => s + (b.clicks || 0), 0)

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
          <h1 className="text-2xl font-bold">Kelola Bidding</h1>
          <p className="text-muted-foreground mt-1">Kelola posisi bidding paket travel di hasil pencarian</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Budget/Hari", value: formatRupiah(totalBudget), icon: Target, color: "bg-emerald-100 text-emerald-700" },
          { label: "Active Bids", value: activeBids, icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
          { label: "Total Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "bg-purple-100 text-purple-700" },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "bg-amber-100 text-amber-700" },
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

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Posisi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Travel</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bid/Hari</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Impressions</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Clicks</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CTR</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Periode</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {biddings.map((bid) => {
                const status = STATUS_MAP[bid.status] || STATUS_MAP.active
                const tenantName = (bid.tenants as any)?.name || "-"
                const packageName = (bid.packages as any)?.name || "-"
                const ctr = bid.impressions > 0 ? ((bid.clicks / bid.impressions) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={bid.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        bid.position === 1 ? "bg-yellow-100 text-yellow-700" :
                        bid.position === 2 ? "bg-gray-100 text-gray-600" :
                        bid.position === 3 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-gray-400"
                      }`}>
                        #{bid.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{tenantName}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{packageName}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(bid.bid_value)}</td>
                    <td className="px-4 py-3">{(bid.impressions || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(bid.clicks || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{ctr}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{bid.start_date || "-"} — {bid.end_date || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(bid)} className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(bid.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingBid && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingBid(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Bidding</h2>
              <button onClick={() => setEditingBid(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Bid Value per Hari (Rp)</label>
                <input type="number" value={form.bid_value} onChange={(e) => setForm({ ...form, bid_value: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" min={0} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingBid(null)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold">Hapus Bidding</h3>
                <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin menghapus bidding ini?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
