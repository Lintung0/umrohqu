"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { enrichEmbeddedPackageCovers } from "@/lib/package-covers"
import { User } from "@supabase/supabase-js"
import { Heart, Clock, Trash2, ChevronRight } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface WishlistItem {
  id: string
  package: {
    id: string
    name: string
    slug: string
    image_url: string | null
    price: number
    duration_nights: number | null
    tenant_id: string
    status: string | null
  } | null
}

export default function WishlistPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from("wishlists")
          .select("id, package:packages(id, name, slug, price, duration_nights, tenant_id, status)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        const enriched = await enrichEmbeddedPackageCovers(supabase, data as any)
        setItems((enriched as any) || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function confirmRemove() {
    if (!deletingId) return
    const { error } = await supabase.from("wishlists").delete().eq("id", deletingId)
    if (error) {
      toast.error("Gagal menghapus dari wishlist")
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deletingId))
      toast.success("Berhasil dihapus dari wishlist")
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Keinginan</h1>
        <p className="text-muted-foreground mt-1">Paket umroh yang Anda simpan</p>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Belum ada paket di wishlist</p>
          <Link href="/search" className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-flex items-center gap-1">
            Cari paket umroh <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const pkg = item.package
            return (
              <div
                key={item.id}
                className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <Link href={`/package/${pkg?.slug || ""}`} className="block">
                  <div className="relative">
                    {pkg?.image_url ? (
                      <Image
                        src={pkg.image_url}
                        alt={pkg.name}
                        width={400}
                        height={200}
                        className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted" />
                    )}
                    <div className="absolute top-2 left-2">
                      <PackageStatusBadge status={pkg?.status} />
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/package/${pkg?.slug || ""}`}>
                    <h3 className="font-semibold text-sm hover:text-emerald-600 transition-colors line-clamp-1">{pkg?.name}</h3>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    {pkg?.duration_nights && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pkg.duration_nights} hari
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-base font-bold text-emerald-600">{formatRupiah(pkg?.price || 0)}</span>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
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

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-center mb-1">Hapus dari Wishlist?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">Paket ini akan dihapus dari daftar wishlist Anda.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Batal</button>
              <button onClick={confirmRemove} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
