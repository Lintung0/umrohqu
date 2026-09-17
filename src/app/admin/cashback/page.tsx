"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, Save, Loader2, BadgePercent, TrendingUp } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { toast } from "sonner"

interface CashbackRow {
  id: string
  name: string
  type: string
  price: number
  cashback_amount: number | null
  status: string
  travel_name: string | null
}

export default function AdminCashbackPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<CashbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, type, price, cashback_amount, status, travel:tenants(name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) {
        toast.error("Gagal memuat data paket")
      } else {
        const list: CashbackRow[] = (data as any[] | null || []).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          price: Number(p.price) || 0,
          cashback_amount: p.cashback_amount == null ? null : Number(p.cashback_amount),
          status: p.status,
          travel_name: Array.isArray(p.travel) ? (p.travel[0]?.name ?? null) : (p.travel?.name ?? null),
        }))
        setRows(list)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = rows.filter((r) => {
    const q = searchQuery.toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || (r.travel_name || "").toLowerCase().includes(q)
  })

  const enabledCount = rows.filter((r) => Number(r.cashback_amount) > 0).length
  const totalNominal = rows.reduce((s, r) => s + (Number(r.cashback_amount) > 0 ? Number(r.cashback_amount) : 0), 0)

  const handleDraft = (id: string, value: string) => {
    const digits = value.replace(/[^\d]/g, "")
    setDrafts((prev) => ({ ...prev, [id]: digits }))
  }

  const saveRow = useCallback(
    async (row: CashbackRow) => {
      const draft = drafts[row.id]
      if (draft === undefined) return
      const value = draft === "" ? 0 : Number(draft)
      setSavingId(row.id)
      const { error } = await supabase.from("packages").update({ cashback_amount: value }).eq("id", row.id)
      if (error) {
        toast.error("Gagal menyimpan cashback: " + error.message)
      } else {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, cashback_amount: value } : r)))
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[row.id]
          return next
        })
        toast.success("Cashback diperbarui")
      }
      setSavingId(null)
    },
    [drafts, supabase]
  )

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BadgePercent className="w-6 h-6 text-emerald-600" /> Kelola Cashback Paket
        </h1>
        <p className="text-muted-foreground mt-1">Atur nominal cashback setiap paket yang ditampilkan di marketplace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Paket</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-emerald-600">{enabledCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Paket dengan Cashback</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalNominal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Nilai Cashback</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari paket atau travel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/70 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Paket</th>
                <th className="px-4 py-3 font-semibold">Travel</th>
                <th className="px-4 py-3 font-semibold">Harga</th>
                <th className="px-4 py-3 font-semibold">Cashback (Rp)</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Tidak ada paket ditemukan
                  </td>
                </tr>
              ) : filtered.map((row) => {
                const current = Number(row.cashback_amount) > 0 ? Number(row.cashback_amount) : null
                const currentDraft = drafts[row.id]
                const hasDraft = currentDraft !== undefined
                const display = hasDraft ? (currentDraft === "" ? "0" : currentDraft) : String(current ?? "")
                const dirty = hasDraft && (currentDraft === "" ? 0 : Number(currentDraft)) !== (current ?? 0)

                return (
                  <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-emerald-600">{(row.name || "?").charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate max-w-[260px]">{row.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{row.type || "paket"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">{row.travel_name || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{formatRupiah(row.price)}</td>
                    <td className="px-4 py-3">
                      <div className="relative w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          inputMode="numeric"
                          value={display}
                          onChange={(e) => handleDraft(row.id, e.target.value)}
                          placeholder="0"
                          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasDraft && dirty ? (
                        <button
                          onClick={() => saveRow(row)}
                          disabled={savingId === row.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {savingId === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Simpan
                        </button>
                      ) : current ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                          <TrendingUp className="w-3 h-3" /> {formatRupiah(current)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Tidak ada</span>
                      )}
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