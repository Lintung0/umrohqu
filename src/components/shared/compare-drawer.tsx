"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, GitCompare, ArrowRight } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { Package } from "@/lib/types"

interface CompareDrawerProps {
  packages: Package[]
  onRemove: (id: string) => void
  onClear: () => void
  maxItems?: number
}

export default function CompareDrawer({ packages, onRemove, onClear, maxItems = 3 }: CompareDrawerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(packages.length > 0)
  }, [packages.length])

  if (!visible) return null

  const compareUrl = `/compare?${packages.map((p) => `packages=${p.slug}`).join("&")}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
      <div className="bg-white border-t border-border shadow-2xl shadow-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {packages.length}/{maxItems} paket
              </span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-1.5 shrink-0">
                  {pkg.image_url && (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate max-w-[120px]">{pkg.name}</p>
                    <p className="text-[10px] text-primary font-medium">{formatRupiah(pkg.price)}</p>
                  </div>
                  <button
                    onClick={() => onRemove(pkg.id)}
                    className="ml-1 w-4 h-4 rounded-full bg-muted hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {Array.from({ length: maxItems - packages.length }).map((_, i) => (
                <div key={i} className="flex items-center justify-center w-28 h-10 border-2 border-dashed border-border rounded-xl shrink-0">
                  <span className="text-[10px] text-muted-foreground">+ Tambah</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Hapus
              </button>
              <Link
                href={compareUrl}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Bandingkan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
