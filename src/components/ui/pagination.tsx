"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function getVisiblePages(current: number, total: number, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5
  if (total <= totalNumbers) return range(1, total) as (number | string)[]

  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, total)
  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < total - 1

  if (!showLeftDots && showRightDots) {
    return [...range(1, totalNumbers - 2), "right-ellipsis", total] as (number | string)[]
  }
  if (showLeftDots && !showRightDots) {
    return [1, "left-ellipsis", ...range(total - (totalNumbers - 3), total)] as (number | string)[]
  }
  return [1, "left-ellipsis", ...range(leftSibling, rightSibling), "right-ellipsis", total] as (number | string)[]
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getVisiblePages(page, totalPages, siblingCount)
  const navButtonClass =
    "h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"

  return (
    <nav
      role="navigation"
      aria-label="Navigasi halaman"
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((item, i) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Halaman ${item}`}
            className={cn(
              "h-9 min-w-9 shrink-0 px-3 inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
              item === page
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 active:scale-95"
            )}
          >
            {item}
          </button>
        ) : (
          <span
            key={`${item}-${i}`}
            className="h-9 w-6 inline-flex items-center justify-center text-slate-400"
            aria-hidden
          >
            <MoreHorizontal className="size-4" />
          </span>
        )
      )}

      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
