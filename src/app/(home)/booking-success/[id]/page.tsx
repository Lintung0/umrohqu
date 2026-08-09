"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, ArrowRight, Loader2, RefreshCw, Clock } from "lucide-react"
import Link from "next/link"

export default function BookingSuccessPage() {
  const params = useParams()
  const [status, setStatus] = useState<"loading" | "success" | "processing" | "timeout">("loading")
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 5
  const timeoutMs = 10000

  const checkStatus = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", params.id)
      .single()

    if (data && (data.status === "confirmed" || data.status === "completed")) {
      setStatus("success")
      return true
    }

    if (data && data.status === "processing") {
      setStatus("processing")
      return true
    }

    return false
  }, [params.id])

  useEffect(() => {
    let timer: NodeJS.Timeout
    let elapsed = 0
    const interval = 2000

    async function poll() {
      const done = await checkStatus()
      if (done) return

      elapsed += interval
      setAttempts((a) => a + 1)

      if (elapsed >= timeoutMs) {
        setStatus("timeout")
        return
      }

      timer = setTimeout(poll, interval)
    }

    poll()
    return () => clearTimeout(timer)
  }, [checkStatus])

  const handleRetry = async () => {
    setStatus("loading")
    setAttempts(0)
    const done = await checkStatus()
    if (!done) {
      setStatus("timeout")
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Memverifikasi pembayaran...</p>
          <p className="text-sm text-slate-400">Mohon tunggu sebentar</p>
        </div>
      </main>
    )
  }

  if (status === "timeout") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Menunggu Konfirmasi Pembayaran</h1>
          <p className="text-sm text-slate-500">
            Pembayaran Anda sedang diproses. Status akan diperbarui secara otomatis oleh sistem.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Cek Ulang Status
            </button>
            <Link
              href={`/dashboard/bookings/${params.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Lihat Detail Booking <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (status === "processing") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pembayaran Diproses</h1>
          <p className="text-sm text-slate-500">
            Pembayaran Anda sedang diverifikasi oleh travel partner.
          </p>
          <Link
            href={`/dashboard/bookings/${params.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Lihat Detail Booking <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Pembayaran Berhasil!</h1>
        <p className="text-sm text-slate-500">
          Alhamdulillah, pembayaran Anda telah diterima. Booking Anda akan segera dikonfirmasi oleh travel partner.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={`/dashboard/bookings/${params.id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Lihat Detail Booking <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
          >
            Lihat Semua Booking
          </Link>
        </div>
      </div>
    </main>
  )
}
