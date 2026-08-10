"use client"

import Link from "next/link"
import { Search, GitCompare, Package, Inbox, LucideIcon } from "lucide-react"

type EmptyVariant = "search" | "compare" | "packages" | "bookings" | "generic"

interface VariantConfig {
  icon: LucideIcon
  title: string
  desc: string
  cta?: { label: string; href: string }
}

const VARIANTS: Record<EmptyVariant, VariantConfig> = {
  search: {
    icon: Search,
    title: "Paket tidak ditemukan",
    desc: "Coba ubah filter atau kata kunci pencarian Anda.",
    cta: { label: "Reset Pencarian", href: "/search" },
  },
  compare: {
    icon: GitCompare,
    title: "Belum ada paket dipilih",
    desc: "Pilih paket dari halaman pencarian untuk mulai membandingkan.",
    cta: { label: "Cari Paket", href: "/search" },
  },
  packages: {
    icon: Package,
    title: "Belum ada paket",
    desc: "Tambahkan paket umroh pertama Anda untuk mulai menerima pesanan.",
    cta: { label: "Buat Paket Baru", href: "/travel-dashboard/packages/new" },
  },
  bookings: {
    icon: Inbox,
    title: "Belum ada pesanan",
    desc: "Pesanan yang masuk akan tampil di sini.",
  },
  generic: {
    icon: Inbox,
    title: "Tidak ada data",
    desc: "Data yang Anda cari tidak tersedia saat ini.",
  },
}

interface IllustratedEmptyStateProps {
  variant?: EmptyVariant
  title?: string
  desc?: string
  cta?: { label: string; href?: string; onClick?: () => void }
  className?: string
}

export default function IllustratedEmptyState({
  variant = "generic",
  title,
  desc,
  cta,
  className = "",
}: IllustratedEmptyStateProps) {
  const config = VARIANTS[variant]
  const IconComponent = config.icon
  const finalTitle = title ?? config.title
  const finalDesc = desc ?? config.desc
  const finalCta = cta ?? config.cta

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-50 flex items-center justify-center mx-auto mb-5 border border-primary/10">
        <IconComponent className="w-9 h-9 text-primary/40" />
      </div>
      <h3 className="font-semibold text-base text-foreground mb-2">{finalTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">{finalDesc}</p>
      {finalCta && (
        "href" in finalCta && finalCta.href ? (
          <Link
            href={finalCta.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {finalCta.label}
          </Link>
        ) : (
          <button
            onClick={"onClick" in finalCta ? finalCta.onClick : undefined}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {finalCta.label}
          </button>
        )
      )}
    </div>
  )
}
