"use client"

import { Gift } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Gift className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Promo & Diskon</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8 space-y-6">
        <div className="bg-white rounded-2xl border border-border p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Belum Ada Promo Aktif</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Saat ini belum ada paket promo yang tersedia. Silakan jelajahi katalog paket umrah untuk menemukan
            penawaran terbaik.
          </p>
          <Link href="/search">
            <Button className="mt-2">Jelajahi Paket Umrah</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
