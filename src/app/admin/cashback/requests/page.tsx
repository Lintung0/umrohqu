"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgePercent, Check, Loader2, RefreshCcw, Send, X, XCircle } from "lucide-react"
import { formatRupiah } from "@/lib/constants"

interface AdminClaim {
  id: string
  booking_id: string
  amount: number
  status: string
  bank_code: string
  account_number: string
  account_holder_name: string
  failure_reason: string | null
  claimed_at: string | null
  disbursed_at: string | null
  iris_reference_no: string | null
  jamaah: { full_name: string | null; email: string | null } | null
  booking: { package: { name: string; slug: string } | null } | null
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  paid: { label: "Dicairkan", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  rejected: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
}

export default function CashbackRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AdminClaim[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [rejectFor, setRejectFor] = useState<AdminClaim | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cashback/requests")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login")
          return
        }
        if (res.status === 403) {
          router.push("/admin")
          return
        }
        throw new Error("Gagal memuat data")
      }
      const data = await res.json()
      setRows(data.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (id: string, action: "approve" | "disburse" | "reject", note?: string) => {
    setBusyId(id)
    setError("")
    try {
      const res = await fetch("/api/cashback/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note: note || "" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses")
      setRejectFor(null)
      setRejectNote("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setBusyId(null)
    }
  }

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    paid: rows.filter((r) => r.status === "paid").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Cashback</h1>
          <p className="text-muted-foreground">Setujui, tolak, atau tandai dicairkan pengajuan cashback jamaah.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
        >
          <RefreshCcw className="h-4 w-4" /> Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Menunggu", value: counts.pending, cls: "text-amber-600 dark:text-amber-400" },
          { label: "Disetujui", value: counts.approved, cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Dicairkan", value: counts.paid, cls: "text-blue-600 dark:text-blue-400" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-16 text-center text-muted-foreground">
          <BadgePercent className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Belum ada pengajuan cashback.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Jamaah / Paket</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Rekening</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const meta = STATUS_META[r.status]
                const last4 = String(r.account_number || "").slice(-4)
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.jamaah?.full_name || "Jamaah"}</p>
                      <p className="text-xs text-muted-foreground">{r.jamaah?.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.booking?.package?.name || "Paket"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(Number(r.amount))}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {r.account_holder_name || "-"}
                        <span className="text-muted-foreground"> · {r.bank_code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">•••• {last4 || "----"}</p>
                      {r.status === "paid" && r.iris_reference_no && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">IRIS: {r.iris_reference_no}</p>
                      )}
                      {r.status === "rejected" && r.failure_reason && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">Alasan: {r.failure_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta?.cls || ""}`}>
                        {meta?.label || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => runAction(r.id, "approve")}
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Setujui
                            </button>
                            <button
                              onClick={() => {
                                setRejectFor(r)
                                setRejectNote("")
                              }}
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                              <X className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <button
                            onClick={() => runAction(r.id, "disburse")}
                            disabled={busyId === r.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" /> Tandai Dicairkan
                          </button>
                        )}
                        {busyId === r.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectFor(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Tolak Pengajuan</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rejectFor.jamaah?.full_name || "Jamaah"} · {formatRupiah(Number(rejectFor.amount))}
                </p>
              </div>
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" onClick={() => setRejectFor(null)} aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Alasan Penolakan</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Alasan akan dikirim sebagai notifikasi ke jamaah"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                onClick={() => runAction(rejectFor.id, "reject", rejectNote)}
                disabled={busyId === rejectFor.id}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {busyId === rejectFor.id ? "Memproses..." : "Tolak Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}