"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RefreshCw } from "lucide-react"
import { IslamicPattern } from "@/components/ui/islamic-pattern"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>

      <div className="relative text-center space-y-6 max-w-md">
        <div className="text-6xl">⚠️</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Terjadi Kesalahan</h1>
          <p className="text-white/60 mt-2">
            Maaf, terjadi kesalahan tak terduga. Silakan coba lagi atau kembali ke beranda.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-light text-emerald-deep px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 border border-white/20 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
          >
            <Home className="w-4 h-4" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
