"use client"

import { useState } from "react"
import Image from "next/image"
import { PhotoProvider, PhotoView } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { Maximize2, ChevronLeft, ChevronRight, Camera } from "lucide-react"

const PER_PAGE = 8

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function tileClasses(index: number, total: number): string {
  const isLast = index === total - 1

  let base = "col-span-1"
  if (total === 1) base = "col-span-2"
  else if (total % 2 === 1 && isLast) base = "col-span-2"

  let md = ""
  if (total === 1) {
    md = "md:col-span-4"
  } else if (total === 2) {
    md = "md:col-span-2 md:row-span-2"
  } else if (total === 3) {
    if (index === 0) md = "md:col-span-2 md:row-span-2"
    else md = "md:col-span-2 md:row-span-1"
  } else if (total === 4) {
    md = ""
  } else if (total >= 5) {
    if (index === 0) md = "md:col-span-2 md:row-span-2"
    else if (total === 6) md = isLast ? "md:col-span-4" : ""
    else if (total === 7) md = index >= 5 ? "md:col-span-2" : ""
    else if (total === 8) md = isLast ? "md:col-span-2" : ""
  }

  return `${base} ${md}`.trim()
}

export default function TravelGalleryMosaic({ images, alt }: { images: string[]; alt?: string }) {
  const totalPages = Math.max(1, Math.ceil(images.length / PER_PAGE))
  const [page, setPage] = useState(0)

  const start = page * PER_PAGE
  const pageImages = images.slice(start, start + PER_PAGE)

  return (
    <div>
      <PhotoProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] sm:auto-rows-[150px] md:auto-rows-[170px] gap-2 md:gap-3">
          {pageImages.map((url, i) => {
            const absIndex = start + i
            return (
              <PhotoView key={`${absIndex}-${url}`} src={url}>
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in",
                    tileClasses(i, pageImages.length),
                  )}
                >
                  <Image
                    src={url}
                    alt={`${alt || "Dokumentasi"} ${absIndex + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-end justify-end p-2.5">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
                      <Maximize2 className="w-4 h-4 text-gray-700" />
                    </span>
                  </div>
                </div>
              </PhotoView>
            )
          })}
        </div>
      </PhotoProvider>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Halaman ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  page === i ? "w-7 bg-emerald-600" : "w-2 bg-gray-200 hover:bg-emerald-300",
                )}
              />
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Camera className="w-3.5 h-3.5" />
            {start + 1}–{Math.min(start + pageImages.length, images.length)} dari {images.length}
          </span>
        </div>
      )}
    </div>
  )
}