"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Plus, Tag, Target, Trash2, Edit, X, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import { toast } from "sonner"

interface PromoRow {
  id: string
  type: string
  value: number
  config: any
  active: boolean
  starts_at: string | null
  ends_at: string | null
}

const EMPTY_PROMO = {
  title: "",
  code: "",
  discount_type: "discount_percent",
  discount_value: 0,
  min_booking: 0,
  valid_until: "",
}

export default function TravelPromotionsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [activeTab, setActiveTab] = useState<"promos" | "bidding">("promos")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoRow | null>(null)
  const [form, setForm] = useState(EMPTY_PROMO)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!profile?.tenant_id) { setLoading(false); return }
    setTenantId(profile.tenant_id)

    const { data } = await supabase
      .from("promotions")
      .select("id, type, value, config, active, starts_at, ends_at")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })

    setPromos((data as any) || [])
    setLoading(false)
  }

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

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promosi & Bidding</h1>
          <p className="text-muted-foreground mt-1">Kelola promo dan tingkatkan visibilitas paket</p>
        </div>
        <button
          onClick={activeTab === "promos" ? openCreate : () => toast.info("Fitur bidding akan segera tersedia")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "promos" ? "Tambah Promo" : "Ajukan Bidding"}
        </button>
      </div>

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

      {activeTab === "bidding" && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Fitur bidding akan segera tersedia</p>
        </div>
      )}

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
                    <option value="discount_fixed">Fixed Amount (Rp)</option>
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
                {editingPromo ? "Simpan Perubahan" : "Buat Promo"}
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
