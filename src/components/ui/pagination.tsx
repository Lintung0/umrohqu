"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function getVisiblePages(current: number, total: number) {
  const count = Math.min(3, total)
  const start = Math.min(Math.max(current - 1, 1), total - count + 1)
  return range(start, start + count - 1)
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getVisiblePages(page, totalPages)
  const navButtonClass =
    "min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"

  return (
    <nav
      role="navigation"
      aria-label="Navigasi halaman"
      className={cn("flex flex-wrap items-center justify-center gap-1.5 sm:gap-2", className)}
    >
      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="size-4 sm:size-3.5" />
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          aria-label={`Halaman ${item}`}
          className={cn(
            "min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 shrink-0 px-3 inline-flex items-center justify-center rounded-full text-sm sm:text-[13px] font-bold sm:font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
            item === page
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.04] sm:scale-100"
              : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 active:scale-95"
          )}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="size-4 sm:size-3.5" />
      </button>
    </nav>
  )
}
