"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, ArrowRight, Loader2, RefreshCw, Clock } from "lucide-react"
import Link from "next/link"

export default function BookingSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "processing" | "timeout">("loading")

  const checkStatus = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("id", params.id)
      .single()

    if (data?.payment_status === "paid" || data?.status === "confirmed" || data?.status === "completed") {
      setStatus("success")
      return true
    }
    return false
  }, [params.id])

  // ── Polling: 2s interval, max 5x (10s) ──
  useEffect(() => {
    let timer: NodeJS.Timeout
    let elapsed = 0
    const interval = 2000
    const timeout = 10000

    async function poll() {
      const done = await checkStatus()
      if (done) return
      elapsed += interval
      if (elapsed >= timeout) { setStatus("timeout"); return }
      timer = setTimeout(poll, interval)
    }
    poll()
    return () => clearTimeout(timer)
  }, [checkStatus])

  // ── Auto-redirect on success (3s) ──
  useEffect(() => {
    if (status !== "success") return
    const t = setTimeout(() => router.push(`/dashboard/bookings/${params.id}`), 3000)
    return () => clearTimeout(t)
  }, [status, params.id, router])

  const handleRetry = async () => {
    setStatus("loading")
    const done = await checkStatus()
    if (!done) setStatus("timeout")
  }

  // ── Loading ──
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
            <CheckCircle className="absolute inset-0 m-auto w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-slate-700 font-semibold">Memverifikasi pembayaran</p>
          <p className="text-sm text-slate-400">Tunggu sebentar...</p>
        </div>
      </main>
    )
  }

  // ── Timeout ──
  if (status === "timeout") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pembayaran Sedang Diverifikasi</h1>
            <p className="text-sm text-slate-500 mt-1">Tim kami sedang memproses pembayaran Anda.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleRetry} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Cek Status
            </button>
            <Link href={`/dashboard/bookings/${params.id}`} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Lihat Booking <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── Processing (webhook belum sampai) ──
  if (status === "processing") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pembayaran Diproses</h1>
            <p className="text-sm text-slate-500 mt-1">Menunggu konfirmasi dari sistem pembayaran.</p>
          </div>
          <Link href={`/dashboard/bookings/${params.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            Lihat Booking <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    )
  }

  // ── Success ──
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-5 shadow-sm">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Pembayaran & Pemesanan Berhasil!</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pembayaran terverifikasi. Travel partner sedang menyiapkan dokumen umrah Anda.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href={`/dashboard/bookings/${params.id}`} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <p className="text-xs text-slate-400">Redirect otomatis dalam 3 detik</p>
        </div>
      </div>
    </main>
  )
}
