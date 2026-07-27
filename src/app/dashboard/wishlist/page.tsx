"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Heart, Clock, MapPin, Trash2 } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import Link from "next/link"
import Image from "next/image"

interface WishlistItem {
  id: string
  package: {
    id: string
    name: string
    slug: string
    image_url: string | null
    price: number
    duration_days: number | null
    travel_id: string
  } | null
  travel: { id: string; name: string; verified: boolean } | null
}

export default function WishlistPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from("wishlists")
          .select("id, package:packages(id, name, slug, image_url, price, duration_days, tenant_id)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setItems((data as any) || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function removeWishlist(wishlistId: string) {
    await supabase.from("wishlists").delete().eq("id", wishlistId)
    setItems((prev) => prev.filter((i) => i.id !== wishlistId))
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <p className="text-muted-foreground mt-1">Paket umroh yang Anda simpan</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Belum ada paket di wishlist</p>
          <Link href="/search" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
            Cari paket umroh →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const pkg = item.package
            const travel = item.travel
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/package/${pkg?.slug || ""}`}>
                  {pkg?.image_url ? (
                    <Image
                      src={pkg.image_url}
                      alt={pkg.name}
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted" />
                  )}
                </Link>
                <div className="p-4">
                  {travel && (
                    <p className="text-xs text-muted-foreground">{travel.name}</p>
                  )}
                  <Link href={`/package/${pkg?.slug || ""}`}>
                    <h3 className="font-semibold mt-1 hover:text-emerald-600 transition-colors">{pkg?.name}</h3>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    {pkg?.duration_days && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pkg.duration_days} hari
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-emerald-600">{formatRupiah(pkg?.price || 0)}</span>
                    <button
                      onClick={() => removeWishlist(item.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Hapus dari wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
