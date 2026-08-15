"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, User, Phone, Calendar, CheckCircle, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import MobileBottomNav from "@/components/shared/mobile-bottom-nav"

interface Participant {
  id: string
  full_name: string
  nik: string | null
  passport_number: string | null
  passport_expiry: string | null
  gender: string | null
  phone: string | null
  birth_date: string | null
  address: string | null
  is_main: boolean
}

const emptyForm = {
  full_name: "", nik: "", passport_number: "", passport_expiry: "",
  gender: "", phone: "", birth_date: "", address: "", is_main: false,
}

export default function ParticipantsPage() {
  const { t } = useTranslation()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const fetchParticipants = async () => {
    const res = await fetch("/api/participants")
    const json = await res.json()
    if (json.data) setParticipants(json.data)
    setLoading(false)
  }

  useEffect(() => { fetchParticipants() }, [])

  const openNew = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError("")
  }

  const openEdit = (p: Participant) => {
    setForm({
      full_name: p.full_name,
      nik: p.nik || "",
      passport_number: p.passport_number || "",
      passport_expiry: p.passport_expiry || "",
      gender: p.gender || "",
      phone: p.phone || "",
      birth_date: p.birth_date || "",
      address: p.address || "",
      is_main: p.is_main,
    })
    setEditingId(p.id)
    setShowForm(true)
    setError("")
  }

  const save = async () => {
    if (!form.full_name.trim()) { setError("Nama wajib diisi"); return }
    setSaving(true)
    setError("")

    const body = editingId ? { id: editingId, ...form } : form
    const res = await fetch("/api/participants", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }

    setShowForm(false)
    setEditingId(null)
    await fetchParticipants()
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm("Hapus peserta ini?")) return
    await fetch("/api/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    await fetchParticipants()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat data peserta...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Data Peserta</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola data jamaah untuk mempercepat pemesanan</p>
          </div>
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="w-4 h-4" /> {t.common.add}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {participants.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Belum ada peserta</h3>
            <p className="text-sm text-muted-foreground mb-6">Tambah data jamaah agar lebih cepat saat booking</p>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> {t.common.add}</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {participants.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-emerald-600">{p.full_name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{p.full_name}</span>
                        {p.is_main && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">Utama</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {p.nik && <span>NIK: {p.nik}</span>}
                        {p.passport_number && <span>Paspor: {p.passport_number}</span>}
                        {p.phone && <span>Telp: {p.phone}</span>}
                        {p.gender && <span>{p.gender === "L" ? "Laki-laki" : "Perempuan"}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white">
              <h3 className="font-semibold">{editingId ? t.common.edit : t.common.add}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nama Lengkap *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Nama sesuai paspor" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NIK</label>
                  <input type="text" value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
                  <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nomor Paspor</label>
                  <input type="text" value={form.passport_number} onChange={(e) => setForm({...form, passport_number: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Masa Berlaku Paspor</label>
                  <input type="date" value={form.passport_expiry} onChange={(e) => setForm({...form, passport_expiry: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
                  <input type="date" value={form.birth_date} onChange={(e) => setForm({...form, birth_date: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">No. Telepon</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Alamat</label>
                <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} rows={2} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_main} onChange={(e) => setForm({...form, is_main: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                Jadikan peserta utama
              </label>
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t.common.saving}</> : t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </main>
  )
}
