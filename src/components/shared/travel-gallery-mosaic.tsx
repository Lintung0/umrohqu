"use client"

import Image from "next/image"
import { PhotoProvider, PhotoView } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { Maximize2 } from "lucide-react"

function cover(index: number): string {
  return ["aspect-[4/3]", "aspect-[4/3]", "aspect-square", "aspect-square", "aspect-[4/3]", "aspect-square"][index % 6]
}

function span(index: number, total: number): string {
  if (total === 1) return "col-span-2 row-span-2"
  if (total === 2) return index === 0 ? "col-span-2 aspect-[16/9]" : "col-span-2 aspect-[16/9] sm:col-span-1 sm:aspect-square"
  if (total === 3) return index === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"
  if (index === 0) return "col-span-2 row-span-2"
  if (total === 4) return "col-span-1"
  return index === 5 ? "hidden sm:block col-span-2" : "col-span-1"
}

export default function TravelGalleryMosaic({ images, alt }: { images: string[]; alt?: string }) {
  const items = images.slice(0, 6)
  return (
    <PhotoProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 sm:grid-rows-[repeat(2,minmax(0,1fr))] gap-2 sm:gap-3">
        {items.map((url, i) => (
          <PhotoView key={i} src={url}>
            <div
              className={`group relative overflow-hidden rounded-xl cursor-zoom-in bg-gray-100 ${span(i, items.length)} ${cover(i)}`}
            >
              <Image
                src={url}
                alt={`${alt || "Dokumentasi"} ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center">
                  <Maximize2 className="w-3.5 h-3.5 text-gray-700" />
                </span>
              </div>
            </div>
          </PhotoView>
        ))}
      </div>
    </PhotoProvider>
  )
}