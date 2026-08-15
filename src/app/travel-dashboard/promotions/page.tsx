"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import {
  Plus, Tag, Target, Trash2, Edit, X, Loader2,
  DollarSign, Eye, EyeOff, MousePointerClick, TrendingUp, Calendar, Package
} from "lucide-react"
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils"
import { toast } from "sonner"
import { getTravelTenantId } from "@/lib/get-travel-tenant"
import { calculateCTR } from "@/lib/business-logic/bidding"

interface PromoRow {
  id: string
  type: string
  value: number
  config: any
  active: boolean
  starts_at: string | null
  ends_at: string | null
}

interface BidRow {
  id: string
  package_id: string
  bid_value: number
  start_date: string
  end_date: string
  is_active: boolean
  impressions: number
  clicks: number
  position: number | null
  package: { name: string } | null
}

interface PackageOption {
  id: string
  name: string
}

const EMPTY_PROMO = {
  title: "",
  code: "",
  discount_type: "discount_percent",
  discount_value: 0,
  min_booking: 0,
  valid_until: "",
}

const EMPTY_BID = {
  package_id: "",
  bid_value: 0,
  start_date: "",
  end_date: "",
}

export default function TravelPromotionsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [activeTab, setActiveTab] = useState<"promos" | "bidding">("promos")
  const [loading, setLoading] = useState(true)

  // Promo state
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoRow | null>(null)
  const [form, setForm] = useState(EMPTY_PROMO)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bidding state
  const [bids, setBids] = useState<BidRow[]>([])
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [showBidModal, setShowBidModal] = useState(false)
  const [editingBid, setEditingBid] = useState<BidRow | null>(null)
  const [bidForm, setBidForm] = useState(EMPTY_BID)
  const [bidDisplay, setBidDisplay] = useState("0")
  const [bidSaving, setBidSaving] = useState(false)
  const [deleteBidId, setDeleteBidId] = useState<string | null>(null)
  const [deletingBid, setDeletingBid] = useState(false)
  const [togglingBidId, setTogglingBidId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) { setLoading(false); return }

    const tId = await getTravelTenantId(supabase, user.id)
    if (!tId) { setLoading(false); return }
    setTenantId(tId)

    const [promoRes, bidRes, pkgRes] = await Promise.all([
      supabase
        .from("promotions")
        .select("id, type, value, config, active, starts_at, ends_at")
        .eq("tenant_id", tId)
        .order("created_at", { ascending: false }),
      supabase
        .from("biddings")
        .select("*, package:packages(name)")
        .eq("tenant_id", tId)
        .order("created_at", { ascending: false }),
      supabase
        .from("packages")
        .select("id, name")
        .eq("tenant_id", tId)
        .is("deleted_at", null)
        .in("status", ["active", "ongoing"]),
    ])

    setPromos((promoRes.data as any) || [])
    setBids((bidRes.data as any) || [])
    setPackages((pkgRes.data as any) || [])
    setLoading(false)
  }

  // ─── Promo CRUD ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditingPromo(null)
    setForm(EMPTY_PROMO)
    setShowModal(true)
  }

  function openEdit(promo: PromoRow) {
    setEditingPromo(promo)
    const cfg = (promo.config || {}) as any
    setForm({
      title: cfg.title || "",
      code: cfg.code || "",
      discount_type: promo.type || "discount_percent",
      discount_value: promo.value || 0,
      min_booking: cfg.min_booking || 0,
      valid_until: promo.ends_at ? promo.ends_at.split("T")[0] : "",
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title || !form.code || !tenantId) {
      toast.error("Judul dan kode promo wajib diisi")
      return
    }
    setSaving(true)
    const payload = {
      tenant_id: tenantId,
      type: form.discount_type,
      value: form.discount_value,
      config: {
        title: form.title,
        code: form.code.toUpperCase(),
        min_booking: form.min_booking,
      },
      active: true,
      starts_at: new Date().toISOString(),
      ends_at: form.valid_until || null,
    }
    if (editingPromo) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editingPromo.id)
      if (error) {
        toast.error("Gagal memperbarui promo")
      } else {
        toast.success("Promo berhasil diperbarui")
        setShowModal(false)
        load()
      }
    } else {
      const { error } = await supabase.from("promotions").insert(payload)
      if (error) {
        toast.error("Gagal membuat promo")
      } else {
        toast.success("Promo berhasil dibuat")
        setShowModal(false)
        load()
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from("promotions").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId)
    if (error) {
      toast.error("Gagal menghapus promo")
    } else {
      toast.success("Promo berhasil dihapus")
      setDeleteId(null)
      load()
    }
    setDeleting(false)
  }

  // ─── Bidding CRUD ─────────────────────────────────────────────────────────

  const bidStats = useMemo(() => {
    const active = bids.filter((b) => b.is_active)
    const totalBudget = active.reduce((sum, b) => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      return sum + b.bid_value * days
    }, 0)
    const totalImpressions = bids.reduce((sum, b) => sum + b.impressions, 0)
    const totalClicks = bids.reduce((sum, b) => sum + b.clicks, 0)
    const avgCTR = calculateCTR(totalClicks, totalImpressions)
    return {
      totalBudget,
      activeCount: active.length,
      totalImpressions,
      totalClicks,
      avgCTR,
    }
  }, [bids])

  function openBidCreate() {
    setEditingBid(null)
    setBidForm(EMPTY_BID)
    setBidDisplay("0")
    setShowBidModal(true)
  }

  function openBidEdit(bid: BidRow) {
    setEditingBid(bid)
    setBidForm({
      package_id: bid.package_id,
      bid_value: bid.bid_value,
      start_date: bid.start_date.split("T")[0],
      end_date: bid.end_date.split("T")[0],
    })
    setBidDisplay(formatRupiahInput(bid.bid_value))
    setShowBidModal(true)
  }

  const estimatedCost = useMemo(() => {
    if (!bidForm.start_date || !bidForm.end_date || !bidForm.bid_value) return 0
    const start = new Date(bidForm.start_date)
    const end = new Date(bidForm.end_date)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    return bidForm.bid_value * days
  }, [bidForm.bid_value, bidForm.start_date, bidForm.end_date])

  async function handleBidSave() {
    if (!bidForm.package_id || !bidForm.bid_value || !bidForm.start_date || !bidForm.end_date || !tenantId) {
      toast.error("Semua field wajib diisi")
      return
    }
    if (new Date(bidForm.end_date) <= new Date(bidForm.start_date)) {
      toast.error("Tanggal akhir harus setelah tanggal awal")
      return
    }
    setBidSaving(true)
    const payload = {
      tenant_id: tenantId,
      package_id: bidForm.package_id,
      bid_value: bidForm.bid_value,
      start_date: bidForm.start_date,
      end_date: bidForm.end_date,
      is_active: true,
      impressions: 0,
      clicks: 0,
    }
    if (editingBid) {
      const { error } = await supabase.from("biddings").update(payload).eq("id", editingBid.id)
      if (error) {
        toast.error("Gagal memperbarui bid")
      } else {
        toast.success("Bid berhasil diperbarui")
        setShowBidModal(false)
        load()
      }
    } else {
      const { error } = await supabase.from("biddings").insert(payload)
      if (error) {
        toast.error("Gagal membuat bid")
      } else {
        toast.success("Bid berhasil dibuat")
        setShowBidModal(false)
        load()
      }
    }
    setBidSaving(false)
  }

  async function handleBidDelete() {
    if (!deleteBidId) return
    setDeletingBid(true)
    const { error } = await supabase.from("biddings").delete().eq("id", deleteBidId)
    if (error) {
      toast.error("Gagal menghapus bid")
    } else {
      toast.success("Bid berhasil dihapus")
      setDeleteBidId(null)
      load()
    }
    setDeletingBid(false)
  }

  async function toggleBidActive(bid: BidRow) {
    setTogglingBidId(bid.id)
    const { error } = await supabase.from("biddings").update({ is_active: !bid.is_active }).eq("id", bid.id)
    if (error) {
      toast.error("Gagal mengubah status bid")
    } else {
      setBids((prev) => prev.map((b) => b.id === bid.id ? { ...b, is_active: !b.is_active } : b))
      toast.success(`Bid ${bid.is_active ? "dinonaktifkan" : "diaktifkan"}`)
    }
    setTogglingBidId(null)
  }

  function getBidStatus(bid: BidRow) {
    if (!bid.is_active) return { label: "Nonaktif", color: "bg-gray-100 text-gray-500" }
    const now = new Date()
    const start = new Date(bid.start_date)
    const end = new Date(bid.end_date)
    if (now < start) return { label: "Terjadwal", color: "bg-blue-100 text-blue-700" }
    if (now > end) return { label: "Selesai", color: "bg-amber-100 text-amber-700" }
    return { label: "Aktif", color: "bg-emerald-100 text-emerald-700" }
  }

  // ─── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promosi & Bidding</h1>
          <p className="text-muted-foreground mt-1">Kelola promo dan tingkatkan visibilitas paket</p>
        </div>
        <button
          onClick={activeTab === "promos" ? openCreate : openBidCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "promos" ? "Tambah Promo" : "Ajukan Bidding"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("promos")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "promos" ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Tag className="w-4 h-4 inline mr-1.5" />
          Promo
        </button>
        <button
          onClick={() => setActiveTab("bidding")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "bidding" ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Target className="w-4 h-4 inline mr-1.5" />
          Bidding
        </button>
      </div>

      {/* ─── Promo Tab ──────────────────────────────────────────────── */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          {promos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada promo</p>
            </div>
          ) : promos.map((promo) => {
            const config = (promo.config || {}) as any
            return (
              <div key={promo.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{config.title || promo.type}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {promo.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {config.code && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{config.code}</span>}
                      <span>Nilai: <strong>{promo.type === "discount_percent" ? `${promo.value}%` : formatRupiah(promo.value)}</strong></span>
                    </div>
                    {promo.starts_at && promo.ends_at && (
                      <p className="text-sm text-muted-foreground">
                        Berlaku: {new Date(promo.starts_at).toLocaleDateString("id-ID")} — {new Date(promo.ends_at).toLocaleDateString("id-ID")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(promo)} className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(promo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Bidding Tab ────────────────────────────────────────────── */}
      {activeTab === "bidding" && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Budget", value: formatRupiah(bidStats.totalBudget), icon: DollarSign, color: "text-emerald-600" },
              { label: "Bid Aktif", value: String(bidStats.activeCount), icon: Target, color: "text-blue-600" },
              { label: "Impressions", value: bidStats.totalImpressions.toLocaleString("id-ID"), icon: Eye, color: "text-purple-600" },
              { label: "Clicks", value: bidStats.totalClicks.toLocaleString("id-ID"), icon: MousePointerClick, color: "text-amber-600" },
              { label: "Avg CTR", value: `${bidStats.avgCTR}%`, icon: TrendingUp, color: "text-rose-600" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                </div>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Bids Table */}
          {bids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Belum ada bidding</p>
              <p className="text-sm text-muted-foreground/70">Buat bidding baru untuk meningkatkan visibilitas paket Anda</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Paket</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Bid/Hari</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Periode</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Tayangan</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Klik</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">CTR</th>
                      <th className="text-center px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-5 py-3 font-medium text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => {
                      const status = getBidStatus(bid)
                      const ctr = calculateCTR(bid.clicks, bid.impressions)
                      return (
                        <tr key={bid.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="font-medium">{bid.package?.name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold">{formatRupiah(bid.bid_value)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs">
                                {new Date(bid.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                {" — "}
                                {new Date(bid.end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{bid.impressions.toLocaleString("id-ID")}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{bid.clicks.toLocaleString("id-ID")}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{ctr}%</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleBidActive(bid)}
                                disabled={togglingBidId === bid.id}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  bid.is_active
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-muted-foreground hover:bg-gray-100"
                                } disabled:opacity-50`}
                                title={bid.is_active ? "Nonaktifkan" : "Aktifkan"}
                              >
                                {togglingBidId === bid.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : bid.is_active ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openBidEdit(bid)}
                                className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors"
                                title="Ubah"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteBidId(bid.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Promo Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">{editingPromo ? "Edit Promo" : "Tambah Promo Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Promo *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Contoh: Diskon Awal Tahun" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kode Promo *</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="DISKON2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Diskon</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    <option value="discount_percent">Persentase (%)</option>
                    <option value="discount_fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nilai Diskon</label>
                  <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Booking (Rp)</label>
                  <input type="number" value={form.min_booking} onChange={(e) => setForm({ ...form, min_booking: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Berlaku Hingga</label>
                <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingPromo ? "Simpan" : "Buat Promo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Promo Delete Confirmation ──────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold">Hapus Promo</h3>
                <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin menghapus promo ini?</p>
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

      {/* ─── Bid Modal ──────────────────────────────────────────────── */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBidModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">{editingBid ? "Edit Bidding" : "Buat Bidding Baru"}</h2>
              <button onClick={() => setShowBidModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Paket *</label>
                <select
                  value={bidForm.package_id}
                  onChange={(e) => setBidForm({ ...bidForm, package_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Pilih paket...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
                {packages.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Tidak ada paket aktif. Buat paket terlebih dahulu.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nilai Bid per Hari (Rp) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bidDisplay}
                  onChange={(e) => {
                    const raw = parseRupiahInput(e.target.value)
                    setBidForm({ ...bidForm, bid_value: raw })
                    setBidDisplay(raw > 0 ? formatRupiahInput(raw) : "")
                  }}
                  onFocus={() => { if (bidForm.bid_value === 0) setBidDisplay("") }}
                  onBlur={() => { if (!bidDisplay) setBidDisplay(formatRupiahInput(bidForm.bid_value)) }}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="50000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={bidForm.start_date}
                    onChange={(e) => setBidForm({ ...bidForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    value={bidForm.end_date}
                    onChange={(e) => setBidForm({ ...bidForm, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              {estimatedCost > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm text-emerald-700">
                    Estimasi total biaya: <strong>{formatRupiah(estimatedCost)}</strong>
                  </p>
                  <p className="text-xs text-emerald-600/70 mt-0.5">
                    {bidForm.bid_value ? formatRupiah(bidForm.bid_value) : "Rp 0"} ×{" "}
                    {bidForm.start_date && bidForm.end_date
                      ? Math.max(1, Math.ceil((new Date(bidForm.end_date).getTime() - new Date(bidForm.start_date).getTime()) / (1000 * 60 * 60 * 24)))
                      : 0} hari
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setShowBidModal(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleBidSave} disabled={bidSaving || packages.length === 0} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {bidSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBid ? "Simpan" : "Buat Bidding"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bid Delete Confirmation ────────────────────────────────── */}
      {deleteBidId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteBidId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold">Hapus Bidding</h3>
                <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin menghapus bidding ini? Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteBidId(null)} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50">Batal</button>
              <button onClick={handleBidDelete} disabled={deletingBid} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {deletingBid && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
