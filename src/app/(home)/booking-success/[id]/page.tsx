"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function BookingSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "processing">("loading")

  useEffect(() => {
    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 10

    async function checkStatus() {
      const { data } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("id", params.id)
        .single()

      if (data && (data.status === "confirmed" || data.status === "completed")) {
        setStatus("success")
        return
      }

      if (data && data.status === "processing") {
        setStatus("processing")
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 2000)
      } else {
        setStatus("processing")
      }
    }

    checkStatus()
  }, [params.id])

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

  if (status === "processing") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pembayaran Diproses</h1>
          <p className="text-sm text-slate-500">
            Pembayaran Anda sedang diverifikasi. Status akan diperbarui secara otomatis.
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
