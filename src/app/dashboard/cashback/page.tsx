"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgePercent, Banknote, ChevronLeft, ChevronRight, Info, RefreshCcw } from "lucide-react"
import { formatRupiah } from "@/lib/constants"

interface BookingRow {
  id: string
  package_name: string
  package_slug: string
  cashback_amount: number
  status: string
  created_at: string
}

interface MineResponse {
  data: BookingRow[]
  totals: Record<string, number>
}

const CASHBACK_EXPLANATION =
  "Cashback (pengembalian sebagian dana) dari biaya umrah akan ditangani langsung oleh travel. Biasanya dikembalikan berupa uang cash Riyal atau lainnya sesuai kebijakan travel."

const PAGE_SIZE = 8

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  processing: "Sedang Diproses",
  confirmed: "Terkonfirmasi",
  cancelled: "Dibatalkan",
}

export default function CashbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BookingRow[]>([])
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cashback/requests?mine=1")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Gagal memuat data")
      }
      const data: MineResponse = await res.json()
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

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, rows.length)
  const pageSlice = rows.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
        Memuat...
      </div>
    )
  }

  const totalCashback = rows.reduce((s, r) => s + Number(r.cashback_amount || 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-deep flex items-center gap-2">
          <BadgePercent className="w-6 h-6 text-gold-dark" /> Cashback
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan cashback dari setiap pesanan paket umrah Anda.</p>
      </div>

      {/* Penjelasan — ditangani langsung oleh travel */}
      <div className="rounded-xl border border-gold/30 bg-gold/10 text-emerald-deep px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
            <Info className="w-4 h-4 text-gold-dark" />
          </span>
          <div>
            <p className="font-semibold text-sm">Cashback ditangani langsung oleh travel</p>
            <p className="mt-0.5 text-sm leading-relaxed">{CASHBACK_EXPLANATION}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Tidak ada pengajuan pencairan di sistem kami. Silakan hubungi travel Anda untuk detail penyerahan cashback.
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-ivory-border bg-ivory-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Cashback Anda</p>
            <BadgePercent className="h-4 w-4 text-gold-dark" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-emerald-deep">{formatRupiah(totalCashback)}</p>
        </div>
        <div className="rounded-xl border border-ivory-border bg-ivory-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Pesanan dengan Cashback</p>
            <Banknote className="h-4 w-4 text-emerald-dark" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-emerald-deep">{rows.length} pesanan</p>
        </div>
      </div>

      <section className="rounded-2xl border border-ivory-border bg-ivory-card">
        <div className="border-b border-ivory-border px-5 py-4">
          <h2 className="font-semibold text-emerald-deep text-sm">Pesanan dengan Cashback</h2>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground">
            <Banknote className="mx-auto mb-2 h-7 w-7 opacity-50" />
            Belum ada pesanan yang berhak atas cashback. Pesan paket dengan badge Cashback untuk mulai.
          </div>
        ) : (
          <div className="divide-y divide-ivory-border">
            {pageSlice.map((row) => (
              <div key={row.id} className="flex flex-col gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/package/${row.package_slug}`}
                    className="font-medium text-sm text-emerald-deep hover:text-emerald-dark hover:underline"
                  >
                    {row.package_name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pesanan{" "}
                    {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    · {STATUS_LABEL[row.status] || row.status}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 w-fit rounded-full bg-gold/15 border border-gold/30 px-2.5 py-1 text-xs font-bold text-gold-dark sm:shrink-0">
                  <BadgePercent className="w-3.5 h-3.5 text-gold-dark" /> Cashback {formatRupiah(Number(row.cashback_amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <p className="text-xs text-muted-foreground">
            Menampilkan {startIndex + 1}–{endIndex} dari {rows.length} pesanan
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-dark bg-ivory-card border border-ivory-border hover:bg-ivory transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-dark bg-ivory-card border border-ivory-border hover:bg-ivory transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}