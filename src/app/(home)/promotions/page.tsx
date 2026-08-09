"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tag, Clock, Gift, Copy, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Promotion } from "@/lib/types"

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPromos((data as Promotion[]) || []);
        setLoading(false);
      });
  }, [])

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-emerald-600 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <Gift className="w-12 h-12 mx-auto opacity-80" />
            <h1 className="text-3xl font-bold">Promo & Diskon</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-6 -mt-8 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-6">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-3" />
              <div className="h-6 bg-muted rounded animate-pulse w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Gift className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Promo & Diskon</h1>
          <p className="text-emerald-100">Jangan lewatkan penawaran spesial untuk perjalanan umroh Anda</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8 space-y-6">
        {promos.map((promo) => (
          <div key={promo.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row p-6 space-y-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                    {promo.discount_type === "discount_percent" ? `${promo.discount_value ?? 0}%` : `Rp ${(promo.discount_value ?? 0).toLocaleString("id-ID")}`}
                  </span>
                  <button
                    onClick={() => copyCode(promo.id, promo.code || "")}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors cursor-pointer"
                  >
                    {copiedId === promo.id ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {promo.code}
                  </button>
                </div>
                <h2 className="text-xl font-bold">{promo.title}</h2>
                <p className="text-sm text-muted-foreground">{promo.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  {promo.valid_until && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Berlaku hingga {new Date(promo.valid_until).toLocaleDateString("id-ID")}</span>
                  )}
                  {promo.min_booking && (
                    <span>Min. booking: Rp {(promo.min_booking / 1_000_000).toFixed(0)}jt</span>
                  )}
                </div>
                <div className="pt-2">
                  <Link href="/search">
                    <Button size="sm" className="text-xs h-8">Cari Paket</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <Tag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada promo aktif saat ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
