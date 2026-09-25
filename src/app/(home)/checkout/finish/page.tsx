"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, Clock, AlertCircle, XCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewState = {
  kind: "loading" | "processing" | "success" | "pending" | "canceled" | "error"
  title: string
  description: string
  bookingId: string | null
}

const SUCCESS_STATUSES = ["capture", "settlement"]

function FinishContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [view, setView] = useState<ViewState>({ kind: "loading", title: "", description: "", bookingId: null })
  const [pollLeft, setPollLeft] = useState(0)
  const [retryKey, setRetryKey] = useState(0)

  const verify = useCallback(
    async (bookingId: string) => {
      const res = await fetch("/api/booking/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      return data.status as string | undefined
    },
    [],
  )

  useEffect(() => {
    const bookingId = searchParams.get("booking_id")
    const midtransStatus = searchParams.get("transaction_status")
    const manualStatus = searchParams.get("status")

    if (!bookingId) {
      setView({ kind: "error", title: "Data Tidak Ditemukan", description: "Parameter booking tidak tersedia. Silakan kembali ke halaman booking Anda.", bookingId: null })
      return
    }

    const isSuccessFromMidtrans = SUCCESS_STATUSES.includes(midtransStatus || "")
    const isCanceledFromMidtrans = ["deny", "cancel", "expire"].includes(midtransStatus || "") || manualStatus === "error"

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const MAX_ATTEMPTS = 10

    setView({ kind: "processing", title: "Memproses Pembayaran", description: "Kami sedang memverifikasi status pembayaran Anda...", bookingId })

    const showPending = (left: number) => {
      setPollLeft(left)
      setView({ kind: "pending", title: "Menunggu Pembayaran", description: "Selesaikan pembayaran Anda, lalu halaman ini mengecek otomatis. Tidak perlu buat pembayaran baru.", bookingId })
    }

    const attempt = async (n: number) => {
      if (cancelled) return
      try {
        const verifiedStatus = await verify(bookingId)
        if (cancelled) return

        if (verifiedStatus === "confirmed" || (isSuccessFromMidtrans && verifiedStatus === "processing")) {
          setPollLeft(0)
          setView({ kind: "success", title: "Pembayaran Berhasil", description: "Pembayaran Anda telah kami terima. Travel partner akan memverifikasi dan mengonfirmasi booking Anda. Mengarahkan ke halaman booking...", bookingId })
          setTimeout(() => { if (!cancelled) router.push(`/dashboard/bookings/${bookingId}`) }, 2200)
          return
        }

        if (verifiedStatus === "cancelled" || isCanceledFromMidtrans) {
          setPollLeft(0)
          setView({ kind: "canceled", title: "Booking Dibatalkan", description: "Pembayaran tidak diselesaikan atau gagal. Anda dapat melihat status booking atau mencoba membayar kembali.", bookingId })
          return
        }

        if (n < MAX_ATTEMPTS) {
          showPending(MAX_ATTEMPTS - n)
          timer = setTimeout(() => attempt(n + 1), 3000)
          return
        }

        setPollLeft(0)
        setView({ kind: "pending", title: "Menunggu Pembayaran", description: "Pengecekan otomatis selesai. Jika Anda sudah membayar, tekan Cek Status. Jika belum, selesaikan pembayaran Anda.", bookingId })
      } catch {
        if (cancelled) return
        if (n < MAX_ATTEMPTS) {
          showPending(MAX_ATTEMPTS - n)
          timer = setTimeout(() => attempt(n + 1), 3000)
          return
        }
        setPollLeft(0)
        setView({ kind: "pending", title: "Menunggu Pembayaran", description: "Kami gagal memverifikasi pembayaran saat ini. Tekan Cek Status untuk mencoba lagi.", bookingId })
      }
    }

    attempt(1)

    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [searchParams, verify, router, retryKey])

  const Icon =
    view.kind === "success" ? CheckCircle
    : view.kind === "pending" || view.kind === "processing" ? Clock
    : view.kind === "canceled" ? XCircle
    : AlertCircle

  const iconColor =
    view.kind === "success" ? "bg-emerald-100 text-emerald-600"
    : view.kind === "pending" || view.kind === "processing" ? "bg-amber-100 text-amber-600"
    : view.kind === "canceled" ? "bg-red-100 text-red-500"
    : "bg-red-100 text-red-500"

  return (
    <main className="min-h-screen bg-ivory-50/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${iconColor}`}>
          {view.kind === "processing" ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Icon className="w-8 h-8" />
          )}
        </div>
        <h2 className="text-xl font-bold text-emerald-deep">{view.title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{view.description}</p>

        {view.bookingId && view.kind === "pending" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button onClick={() => setRetryKey((k) => k + 1)} className="gap-2 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
              Cek Status
            </Button>
            <Link href={`/dashboard/bookings/${view.bookingId}`}>
              <Button variant="outline" className="h-12 px-6 text-emerald-600 hover:bg-emerald-100">
                Lihat Status Booking <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {view.bookingId && view.kind !== "pending" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href={`/dashboard/bookings/${view.bookingId}`}>
              <Button className="gap-2 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
                Lihat Status Booking <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="h-12 px-6 text-emerald-600 hover:bg-emerald-100">
                ← Cari Paket
              </Button>
            </Link>
          </div>
        )}

        {view.kind === "pending" && pollLeft > 0 && (
          <p className="text-xs text-slate-400 animate-pulse">Mengecek otomatis... ({pollLeft * 3} detik)</p>
        )}

        {view.kind === "success" && (
          <p className="text-xs text-slate-400 animate-pulse">Mengarahkan dalam beberapa saat...</p>
        )}
      </div>
    </main>
  )
}

export default function CheckoutFinishPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse">Memuat hasil pembayaran...</p>
          </div>
        </main>
      }
    >
      <FinishContent />
    </Suspense>
  )
}