"use client"

import { useState } from "react"
import {
  Search, Loader2, Package, CalendarDays, MapPin, Building2,
  CheckCircle2, Clock, Circle, AlertCircle, Compass,
} from "lucide-react"

interface TrackingStep {
  key: string
  label: string
  status: "pending" | "in_progress" | "completed"
  note: string | null
}

interface TrackingResult {
  booking_code: string
  status: string
  created_at: string
  package_name: string | null
  travel_name: string | null
  departure_date: string | null
  departure_city: string | null
  steps: TrackingStep[]
}

const STATUS_META: Record<string, { label: string; className: string; dotClassName: string }> = {
  pending_payment: { label: "Menunggu Pembayaran", className: "bg-gold/15 text-gold-dark", dotClassName: "bg-gold" },
  processing: { label: "Sedang Diproses", className: "bg-gold/15 text-gold-dark", dotClassName: "bg-gold" },
  cancellation_pending: { label: "Pembatalan Diproses", className: "bg-gold/15 text-gold-dark", dotClassName: "bg-gold" },
  confirmed: { label: "Terkonfirmasi", className: "bg-emerald-dark/10 text-emerald-dark", dotClassName: "bg-emerald-dark" },
  completed: { label: "Selesai", className: "bg-emerald-dark/10 text-emerald-dark", dotClassName: "bg-emerald-dark" },
  cancelled: { label: "Dibatalkan", className: "bg-red-50 text-red-600", dotClassName: "bg-red-500" },
  refunded: { label: "Refund", className: "bg-ivory text-muted-foreground", dotClassName: "bg-muted-foreground" },
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export default function TrackingPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/tracking?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || "Kode pesanan tidak ditemukan")
        return
      }
      setResult(json.data)
    } catch {
      setError("Gagal memuat progres pesanan, coba lagi")
    } finally {
      setLoading(false)
    }
  }

  const statusMeta = result ? STATUS_META[result.status] || STATUS_META.processing : null

  return (
    <div className="min-h-screen bg-ivory">
      {/* ── Hero ── */}
      <div className="bg-emerald-dark text-ivory py-14 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-light">Lacak Pesanan Anda</p>
          <h1 className="text-3xl font-bold">Lacak Status Pesanan</h1>
          <p className="text-ivory/70 text-sm max-w-lg mx-auto">
            Masukkan kode pesanan Anda untuk melihat progres pemesanan, dari pembayaran hingga keberangkatan.
          </p>

          <form onSubmit={handleTrack} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory-ink/40" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: UQ-1234"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-ivory-card border border-ivory-border text-sm text-ivory-ink placeholder:text-ivory-ink/40 focus:outline-none focus:border-emerald-dark focus:ring-4 focus:ring-emerald-dark/15"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="h-12 px-8 rounded-xl bg-gold hover:bg-gold-dark text-emerald-dark font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Lacak"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* ── Error ── */}
        {error && (
          <div className="bg-ivory-card rounded-2xl border border-red-200 p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="font-bold text-ivory-ink">Kode Tidak Ditemukan</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!result && !error && (
          <div className="bg-ivory-card rounded-2xl border border-ivory-border p-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-ivory flex items-center justify-center">
              <Compass className="h-7 w-7 text-emerald-dark/60" />
            </div>
            <h2 className="font-bold text-ivory-ink">Belum Ada Pencarian</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Kode pesanan dikirim ke email Anda setelah pemesanan berhasil, contoh: UQ-1234.
            </p>
          </div>
        )}

        {/* ── Hasil ── */}
        {result && statusMeta && (
          <div className="bg-ivory-card rounded-2xl border border-ivory-border overflow-hidden">
            {/* Kepala card */}
            <div className="p-6 border-b border-ivory-border space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Kode Pesanan</p>
                  <p className="text-xl font-bold font-mono">{result.booking_code}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${statusMeta.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClassName}`} />
                  {statusMeta.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 text-ivory-ink">
                  <Package className="h-4 w-4 text-emerald-dark shrink-0" />
                  {result.package_name || "Paket umrah"}
                </div>
                <div className="flex items-center gap-2.5 text-ivory-ink">
                  <Building2 className="h-4 w-4 text-emerald-dark shrink-0" />
                  {result.travel_name || "Travel"}
                </div>
                <div className="flex items-center gap-2.5 text-ivory-ink">
                  <CalendarDays className="h-4 w-4 text-emerald-dark shrink-0" />
                  Berangkat: {formatDate(result.departure_date)}
                </div>
                <div className="flex items-center gap-2.5 text-ivory-ink">
                  <MapPin className="h-4 w-4 text-emerald-dark shrink-0" />
                  {result.departure_city || "—"}
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground sm:col-span-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  Dipesan: {formatDate(result.created_at)}
                </div>
              </div>
            </div>

            {/* Progres */}
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Progres Pemesanan</p>
              <ol className="space-y-0">
                {result.steps.map((step, i) => {
                  const isLast = i === result.steps.length - 1
                  const isDone = step.status === "completed"
                  const isProgress = step.status === "in_progress"
                  return (
                    <li key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                            isDone
                              ? "bg-emerald-dark text-ivory"
                              : isProgress
                                ? "bg-gold text-emerald-dark ring-4 ring-gold/20"
                                : "bg-ivory text-muted-foreground border border-ivory-border"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-4.5 w-4.5" /> : isProgress ? <Clock className="h-4.5 w-4.5" /> : <Circle className="h-4.5 w-4.5" />}
                        </div>
                        {!isLast && <div className={`w-0.5 flex-1 min-h-6 my-1 ${isDone ? "bg-emerald-dark/30" : "bg-ivory-border"}`} />}
                      </div>
                      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                        <p className={`text-sm font-semibold ${isDone ? "text-emerald-dark" : isProgress ? "text-gold-dark" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isDone ? "Selesai" : isProgress ? "Sedang berjalan" : "Menunggu"}
                          {step.note ? ` · ${step.note}` : ""}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
