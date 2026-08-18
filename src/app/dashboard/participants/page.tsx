"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, User, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const confirmDelete = async () => {
    if (!deletingId) return
    await fetch("/api/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingId }),
    })
    setDeletingId(null)
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
      {/* Topbar — h-16 to match sidebar profile */}
      <div className="bg-white border-b border-border h-16 px-6 flex items-center">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold leading-tight">Data Peserta</h1>
          </div>
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="w-4 h-4" /> Isi Data Jamaah
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {participants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Belum ada peserta</h3>
            <p className="text-sm text-muted-foreground">Tambah data jamaah agar lebih cepat saat booking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-600">{p.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
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
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingId(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centered Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-gray-100" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-2">
              <div>
                <h3 className="text-lg font-bold">{editingId ? "Edit Peserta" : "Isi Data Jamaah Baru"}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingId ? "Ubah data peserta yang sudah ada." : "Lengkapi identitas sesuai paspor/KTP untuk mempermudah booking."}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Nama Lengkap *</label>
                <Input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="Nama sesuai paspor" className="mt-1.5" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NIK</label>
                  <Input type="text" value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value})} placeholder="16 digit NIK" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
                  <Select value={form.gender ?? ""} onValueChange={(val) => setForm({...form, gender: val ?? ""})}>
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nomor Paspor</label>
                  <Input type="text" value={form.passport_number} onChange={(e) => setForm({...form, passport_number: e.target.value})} placeholder="Nomor paspor" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Masa Berlaku Paspor</label>
                  <Input type="date" value={form.passport_expiry} onChange={(e) => setForm({...form, passport_expiry: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({...form, birth_date: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">No. Telepon</label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="08xxx" className="mt-1.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Alamat</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  rows={2}
                  className="w-full border border-input rounded-md px-2.5 py-1.5 text-sm mt-1.5 focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Alamat lengkap"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_main} onChange={(e) => setForm({...form, is_main: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                Jadikan peserta utama
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan Data"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-center mb-1">Hapus Peserta?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">Data peserta yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1">Batal</Button>
              <Button variant="destructive" onClick={confirmDelete} className="flex-1">Hapus</Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </main>
  )
}
