"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgePercent, Banknote, Info, RefreshCcw } from "lucide-react"
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BadgePercent className="w-6 h-6 text-emerald-600" /> Cashback
        </h1>
      </div>

      {/* Penjelasan — ditangani langsung oleh travel */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4 sm:p-5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
        <div className="flex items-start gap-3.5">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
            <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          </span>
          <div>
            <p className="font-semibold">Cashback ditangani langsung oleh travel</p>
            <p className="mt-1 text-sm leading-relaxed">{CASHBACK_EXPLANATION}</p>
            <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-200/70">
              Tidak ada pengajuan pencairan di sistem kami — silakan hubungi travel Anda untuk detail penyerahan cashback.
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Cashback Anda</p>
            <BadgePercent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalCashback)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Pesanan dengan Cashback</p>
            <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">{rows.length} pesanan</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-semibold">Pesanan dengan Cashback</h2>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Banknote className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Belum ada pesanan yang berhak atas cashback. Pesan paket dengan badge Cashback untuk mulai.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/package/${row.package_slug}`}
                    className="font-medium hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                  >
                    {row.package_name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pesanan{" "}
                    {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    · {STATUS_LABEL[row.status] || row.status}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 w-fit rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 border border-yellow-400 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-sm sm:shrink-0">
                  <BadgePercent className="w-3.5 h-3.5 text-amber-800" /> Cashback {formatRupiah(Number(row.cashback_amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}