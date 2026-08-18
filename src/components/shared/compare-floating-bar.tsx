"use client"

import { usePathname, useRouter } from "next/navigation"
import { GitCompare, X, ArrowRight } from "lucide-react"
import { useCompare, MAX_COMPARE } from "@/lib/compare-context"
import { useIsMobile } from "@/hooks/use-mobile"

export default function CompareFloatingBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { comparePackages, clearCompare } = useCompare()

  if (comparePackages.length === 0) return null
  if (pathname === "/compare") return null
  if (pathname.startsWith("/admin") || pathname.startsWith("/travel-dashboard")) return null

  const count = comparePackages.length

  return (
    <div
      className={`fixed z-50 animate-slide-up ${
        isMobile
          ? "bottom-20 left-3 right-3"
          : "bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[340px]"
      }`}
    >
      <div className="bg-white border border-emerald-200 rounded-2xl shadow-lg shadow-emerald-100/50 px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <GitCompare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {count}/{MAX_COMPARE} paket
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">dipilih</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 shrink-0" />

        <button
          onClick={clearCompare}
          className="p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Hapus semua"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => router.push("/compare")}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          Lihat
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
