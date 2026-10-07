"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, Clock, AlertCircle, XCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewState = {
  kind: "loading" | "processing" | "received" | "success" | "pending" | "nogateway" | "canceled" | "error"
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

  // Mengembalikan respons verify apa adanya agar UI bisa jujur:
  // WTO "Belum ada transaksi gateway" = Snap tidak pernah terbentuk.
  const verify = useCallback(
    async (bookingId: string) => {
      const res = await fetch("/api/booking/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      return data as { status?: string; error?: string; gateway_found?: boolean; midtrans_status?: string | null }
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
    // Cek cepat: tiap 2 detik, maks 3x (±6 detik). Setelah itu berhenti dan
    // serahkan ke tombol "Cek Status" manual — jangan polling buta 30 detik.
    const MAX_ATTEMPTS = 3
    const POLL_INTERVAL_MS = 2000

    setView({ kind: "processing", title: "Memeriksa Pembayaran", description: "Harap tunggu sebentar...", bookingId })

    const showPending = (left: number) => {
      setPollLeft(left)
      setView({ kind: "pending", title: "Menunggu Pembayaran", description: "Selesaikan pembayaran Anda, lalu halaman ini mengecek otomatis. Tidak perlu buat pembayaran baru.", bookingId })
    }

    const attempt = async (n: number) => {
      if (cancelled) return
      try {
        const v = await verify(bookingId)
        if (cancelled) return

        // Jujur: tidak ada transaksi gateway = Snap tidak pernah terbentuk
        // (popup ditutup sebelum pilih metode / Snap gagal dimuat).
        if (v.error === "Belum ada transaksi gateway" || v.gateway_found === false) {
          setPollLeft(0)
          setView({ kind: "nogateway", title: "Transaksi Tidak Ditemukan", description: "Tidak ada transaksi pembayaran untuk booking ini — kemungkinan popup pembayaran tertutup sebelum Anda memilih metode. Silakan kembali dan tekan Bayar ulang. Tidak perlu buat booking baru.", bookingId })
          return
        }

        const verifiedStatus = v.status

        if (verifiedStatus === "confirmed" || (isSuccessFromMidtrans && verifiedStatus === "processing")) {
          setPollLeft(0)
          setView({ kind: "success", title: "Pembayaran Anda Sukses!", description: "Pembayaran telah kami terima. Travel partner akan memverifikasi dan mengonfirmasi booking Anda. Mengarahkan ke pesanan...", bookingId })
          setTimeout(() => { if (!cancelled) router.push(`/dashboard/bookings/${bookingId}`) }, 2000)
          return
        }

        // Webhook sudah lebih dulu mencatat pembayaran (antri verifikasi travel)
        if (verifiedStatus === "processing" && !isSuccessFromMidtrans) {
          setPollLeft(0)
          setView({ kind: "received", title: "Pembayaran Diterima", description: "Pembayaran telah kami terima. Travel partner sedang memverifikasi dana — booking akan dikonfirmasi setelah diverifikasi.", bookingId })
          return
        }

        if (verifiedStatus === "cancelled" || isCanceledFromMidtrans) {
          setPollLeft(0)
          setView({ kind: "canceled", title: "Booking Dibatalkan", description: "Pembayaran tidak diselesaikan atau gagal. Anda dapat melihat status booking atau mencoba membayar kembali.", bookingId })
          return
        }

        if (n < MAX_ATTEMPTS) {
          showPending(MAX_ATTEMPTS - n)
          timer = setTimeout(() => attempt(n + 1), POLL_INTERVAL_MS)
          return
        }

        setPollLeft(0)
        setView({ kind: "pending", title: "Menunggu Pembayaran", description: "Pengecekan otomatis selesai. Jika Anda sudah membayar, tekan Cek Status. Jika belum, selesaikan pembayaran Anda.", bookingId })
      } catch {
        if (cancelled) return
        if (n < MAX_ATTEMPTS) {
          showPending(MAX_ATTEMPTS - n)
          timer = setTimeout(() => attempt(n + 1), POLL_INTERVAL_MS)
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
    : view.kind === "received" ? CheckCircle
    : view.kind === "pending" || view.kind === "processing" ? Clock
    : view.kind === "nogateway" ? AlertCircle
    : view.kind === "canceled" ? XCircle
    : AlertCircle

  const iconColor =
    view.kind === "success" ? "bg-emerald-dark/10 text-emerald-dark"
    : view.kind === "received" ? "bg-emerald-dark/10 text-emerald-dark"
    : view.kind === "pending" || view.kind === "processing" ? "bg-gold/15 text-gold-dark"
    : view.kind === "nogateway" ? "bg-gold/15 text-gold-dark"
    : view.kind === "canceled" ? "bg-red-100 text-red-500"
    : "bg-red-100 text-red-500"

  return (
    <main className="min-h-screen bg-ivory-50 flex items-center justify-center px-4">
      <div className="bg-ivory-card rounded-2xl border border-ivory-border shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${iconColor}`}>
          {view.kind === "processing" ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Icon className="w-8 h-8" />
          )}
        </div>
        <h2 className="text-xl font-bold text-emerald-deep">{view.title}</h2>
        <p className="text-sm text-ivory-ink/70 leading-relaxed">{view.description}</p>

        {view.bookingId && (view.kind === "pending" || view.kind === "nogateway") && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {view.kind === "pending" ? (
              <Button onClick={() => setRetryKey((k) => k + 1)} className="gap-2 px-6 h-12 bg-emerald-dark hover:bg-emerald-deep text-ivory">
                Cek Status
              </Button>
            ) : (
              <Link href={`/dashboard/bookings/${view.bookingId}`}>
                <Button className="gap-2 px-6 h-12 bg-emerald-dark hover:bg-emerald-deep text-ivory">
                  Kembali & Bayar Ulang
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/bookings/${view.bookingId}`}>
              <Button variant="outline" className="h-12 px-6 border-emerald-dark/30 text-emerald-dark hover:bg-emerald-dark/5">
                Lihat Pesanan <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {view.bookingId && view.kind !== "pending" && view.kind !== "nogateway" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href={`/dashboard/bookings/${view.bookingId}`}>
              <Button className="gap-2 px-6 h-12 bg-emerald-dark hover:bg-emerald-deep text-ivory">
                Lihat Pesanan <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="h-12 px-6 border-emerald-dark/30 text-emerald-dark hover:bg-emerald-dark/5">
                ← Cari Paket
              </Button>
            </Link>
          </div>
        )}

        {view.kind === "pending" && pollLeft > 0 && (
          <p className="text-xs text-ivory-ink/50 animate-pulse">Mengecek otomatis... ({pollLeft * 2} detik)</p>
        )}

        {view.kind === "success" && (
          <p className="text-xs text-ivory-ink/50 animate-pulse">Mengarahkan ke pesanan...</p>
        )}
      </div>
    </main>
  )
}

export default function CheckoutFinishPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ivory-ink/60 animate-pulse">Memuat hasil pembayaran...</p>
          </div>
        </main>
      }
    >
      <FinishContent />
    </Suspense>
  )
}