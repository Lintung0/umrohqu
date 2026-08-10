"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Tag, Loader2, X } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PromotionRow {
  id: string
  title: string
  description: string | null
  code: string
  discount_type: string
  discount_value: number
  min_booking: number | null
  max_usage: number | null
  valid_until: string | null
  is_active: boolean
  tenant_id: string | null
  usage_count: number | null
  tenants?: { name: string } | null
}

const EMPTY_FORM = {
  title: "",
  description: "",
  code: "",
  discount_type: "discount_percent",
  discount_value: 0,
  min_booking: 0,
  max_usage: 0,
  valid_until: "",
  is_active: true,
}

type TabKey = "platform" | "agency"

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("platform")
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromotionRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPromos()
  }, [])

  async function fetchPromos() {
    const supabase = createClient()
    const { data } = await supabase
      .from("promotions")
      .select("id, title, description, code, discount_type, discount_value, min_booking, max_usage, valid_until, is_active, tenant_id, usage_count, tenants(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
    const rows = (data || []).map((d: any) => ({
      ...d,
      tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
    }))
    setPromos(rows as PromotionRow[])
    setLoading(false)
  }

  function openCreate() {
    setEditingPromo(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(promo: PromotionRow) {
    setEditingPromo(promo)
    setForm({
      title: promo.title,
      description: promo.description || "",
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_booking: promo.min_booking || 0,
      max_usage: promo.max_usage || 0,
      valid_until: promo.valid_until ? promo.valid_until.split("T")[0] : "",
      is_active: promo.is_active,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title || !form.code) {
      toast.error("Judul dan kode promo wajib diisi")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const payload: Record<string, any> = {
      title: form.title,
      description: form.description || null,
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_booking: form.min_booking || null,
      max_usage: form.max_usage || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
    }
    // When creating on platform tab, ensure tenant_id is null (global promo)
    if (!editingPromo && activeTab === "platform") {
      payload.tenant_id = null
    }
    if (editingPromo) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editingPromo.id)
      if (error) {
        toast.error("Gagal memperbarui promo")
      } else {
        toast.success("Promo berhasil diperbarui")
        setShowModal(false)
        fetchPromos()
      }
    } else {
      const { error } = await supabase.from("promotions").insert(payload)
      if (error) {
        toast.error("Gagal membuat promo")
      } else {
        toast.success("Promo berhasil dibuat")
        setShowModal(false)
        fetchPromos()
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("promotions").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId)
    if (error) {
      toast.error("Gagal menghapus promo")
    } else {
      toast.success("Promo berhasil dihapus")
      setDeleteId(null)
      fetchPromos()
    }
    setDeleting(false)
  }

  const globalPromos = promos.filter((p) => !p.tenant_id)
  const travelPromos = promos.filter((p) => !!p.tenant_id)
  const activePromos = activeTab === "platform" ? globalPromos : travelPromos
  const activeCount = activeTab === "platform" ? globalPromos.length : travelPromos.length
  const activeActiveCount = activePromos.filter((p) => p.is_active).length

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="bg-white rounded-2xl border border-border p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 border-b border-border last:border-0">
              <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promo & Voucher</h1>
          <p className="text-muted-foreground mt-1">Kelola promo dan voucher untuk platform dan travel partner</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Tambah Promo
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl border border-border">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("platform")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "platform"
                ? "text-emerald-700 bg-emerald-50/50"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Tag className="w-4 h-4" />
              Promo Platform
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === "platform" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}>
                {globalPromos.length}
              </span>
            </div>
            {activeTab === "platform" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("agency")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "agency"
                ? "text-emerald-700 bg-emerald-50/50"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Tag className="w-4 h-4" />
              Promo Agensi Travel
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === "agency" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}>
                {travelPromos.length}
              </span>
            </div>
            {activeTab === "agency" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 bg-gray-50/50 flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{activeCount}</strong> promo
          </span>
          <span className="text-muted-foreground">
            Aktif: <strong className="text-emerald-600">{activeActiveCount}</strong>
          </span>
          <span className="text-muted-foreground">
            Nonaktif: <strong className="text-gray-500">{activeCount - activeActiveCount}</strong>
          </span>
        </div>

        {/* Promo List */}
        <div className="divide-y divide-border">
          {activePromos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-muted-foreground font-medium">
                {activeTab === "platform" ? "Belum ada promo platform" : "Belum ada promo agensi travel"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Klik &quot;Tambah Promo&quot; untuk membuat promo baru
              </p>
            </div>
          ) : (
            activePromos.map((promo) => (
              <div key={promo.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{promo.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {promo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{promo.code}</span>
                    <span>Diskon: <strong>{promo.discount_type === "discount_percent" ? `${promo.discount_value}%` : formatRupiah(promo.discount_value)}</strong></span>
                    {promo.min_booking && <span>Min: {formatRupiah(promo.min_booking)}</span>}
                    {promo.valid_until && <span>Hingga: {new Date(promo.valid_until).toLocaleDateString("id-ID")}</span>}
                    {activeTab === "agency" && promo.tenants?.name && (
                      <span className="text-emerald-600">{promo.tenants.name}</span>
                    )}
                    {activeTab === "agency" && (
                      <span>Terpakai: {promo.usage_count || 0}/{promo.max_usage || "∞"}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(promo)} className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(promo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">{editingPromo ? "Edit Promo" : `Tambah Promo ${activeTab === "platform" ? "Platform" : "Agensi"}`}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Promo *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Contoh: Diskon Awal Tahun" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" rows={2} placeholder="Deskripsi singkat promo" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Maks. Penggunaan</label>
                  <input type="number" value={form.max_usage} onChange={(e) => setForm({ ...form, max_usage: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" min={0} placeholder="0 = tak terbatas" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Berlaku Hingga</label>
                  <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Status:</label>
                <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-emerald-600" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-muted-foreground">{form.is_active ? "Aktif" : "Nonaktif"}</span>
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

      {/* Delete Confirmation */}
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
    </div>
  )
}
