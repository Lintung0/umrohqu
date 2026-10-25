"use client"

import { useCallback, useEffect, useState } from "react"
import { Banknote, CheckCircle2, Landmark, Loader2, Plus, Power, Star, X } from "lucide-react"
import { toast } from "sonner"

const BANK_DIRECTORY_URL = "https://admin.umrahqu.com/api/banks"

type DirectoryBank = { name: string; code: string }

type TenantBank = {
  id: string
  bank_code: string
  bank_name: string
  account_number: string
  account_holder_name: string
  is_active: boolean
  is_primary: boolean
  created_at: string
}

export function BanksTab({ tenantId }: { tenantId: string | null }) {
  const [directory, setDirectory] = useState<DirectoryBank[]>([])
  const [directoryError, setDirectoryError] = useState(false)
  const [banks, setBanks] = useState<TenantBank[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [holderName, setHolderName] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)

  const selectedBank = directory.find((b) => b.name === bankName)

  const loadBanks = useCallback(async () => {
    try {
      const res = await fetch("/api/tenant/banks")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setBanks(json.data || [])
    } catch {
      toast.error("Gagal memuat rekening travel")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDirectory = useCallback(async () => {
    try {
      const res = await fetch(BANK_DIRECTORY_URL)
      const json = await res.json()
      const rows = Array.isArray(json?.data) ? json.data : []
      setDirectory(rows)
      setDirectoryError(rows.length === 0)
    } catch {
      setDirectoryError(true)
    }
  }, [])

  useEffect(() => {
    if (!tenantId) return
    loadBanks()
    loadDirectory()
  }, [tenantId, loadBanks, loadDirectory])

  function resetForm() {
    setBankName("")
    setAccountNumber("")
    setHolderName("")
    setIsPrimary(false)
    setShowForm(false)
  }

  async function handleCreate() {
    if (!selectedBank) { toast.error("Pilih bank terlebih dahulu"); return }
    if (accountNumber.replace(/\D/g, "").length < 5) { toast.error("Nomor rekening tidak valid"); return }
    if (!holderName.trim()) { toast.error("Nama pemilik rekening wajib diisi"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/tenant/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_code: selectedBank.code,
          bank_name: selectedBank.name,
          account_number: accountNumber.replace(/\D/g, ""),
          account_holder_name: holderName.trim(),
          is_primary: isPrimary || banks.length === 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success("Rekening berhasil ditambahkan")
      resetForm()
      await loadBanks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan rekening")
    } finally {
      setSaving(false)
    }
  }

  async function updateBank(id: string, updates: { is_active?: boolean; is_primary?: boolean }) {
    setBusyId(id)
    try {
      const res = await fetch("/api/tenant/banks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      await loadBanks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui rekening")
    } finally {
      setBusyId(null)
    }
  }

  if (!tenantId) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 text-sm text-muted-foreground">
        Akun ini belum terhubung dengan travel.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold">Rekening Tujuan Transfer</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Rekening aktif tampil di checkout marketplace. Pilih bank dari direktori resmi UmrahQu.
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-gray-50/60 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Rekening Baru</p>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white transition-colors"
                aria-label="Tutup form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Pilih bank...</option>
                  {directory.map((b) => (
                    <option key={`${b.code}-${b.name}`} value={b.name}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                {directoryError && (
                  <p className="text-xs text-red-600 mt-1.5">
                    Gagal memuat direktori bank. Periksa koneksi lalu muat ulang halaman.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nomor Rekening</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Contoh: 1234567890"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Pemilik Rekening</label>
                <input
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Sesuai buku rekening"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary || banks.length === 0}
                disabled={banks.length === 0}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Jadikan rekening utama
                {banks.length === 0 && <span className="text-muted-foreground"> (otomatis untuk rekening pertama)</span>}
              </span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Simpan Rekening
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded-2xl animate-pulse" />
          <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        </div>
      ) : banks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Banknote className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="font-medium">Belum ada rekening</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tambahkan rekening agar jemaah bisa transfer dan mengunggah bukti di checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                bank.is_active ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{bank.bank_name}</p>
                  {bank.is_primary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      <Star className="w-3 h-3" /> Utama
                    </span>
                  )}
                  {!bank.is_active && (
                    <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="text-sm tabular-nums mt-0.5">{bank.account_number}</p>
                <p className="text-xs text-muted-foreground">a.n. {bank.account_holder_name} · Kode {bank.bank_code}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {bank.is_active && !bank.is_primary && (
                  <button
                    onClick={() => updateBank(bank.id, { is_primary: true })}
                    disabled={busyId === bank.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-50"
                  >
                    {busyId === bank.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                    Jadikan Utama
                  </button>
                )}
                <button
                  onClick={() => updateBank(bank.id, { is_active: !bank.is_active })}
                  disabled={busyId === bank.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                    bank.is_active
                      ? "border-border text-muted-foreground hover:border-red-200 hover:text-red-600"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {busyId === bank.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                  {bank.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
