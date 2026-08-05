"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  title?: string
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const allImages = images.filter(Boolean)
  if (allImages.length === 0) return null

  const openLightbox = (idx: number) => {
    setCurrentIndex(idx)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 sm:col-span-2 sm:row-span-2 relative h-64 sm:h-80 rounded-2xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(0)}>
          <Image src={allImages[0]} alt={title || "Gallery"} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {allImages.slice(1, 5).map((img, i) => (
          <div key={i} className="relative h-28 sm:h-[calc(50%-0.25rem)] rounded-xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(i + 1)}>
            <Image src={img} alt={`${title || "Gallery"} ${i + 2}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10" onClick={() => setLightboxOpen(false)}>
            <X className="w-6 h-6" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2 text-white/80 hover:text-white z-10"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((currentIndex - 1 + allImages.length) % allImages.length) }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 p-2 text-white/80 hover:text-white z-10"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((currentIndex + 1) % allImages.length) }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl aspect-video mx-4" onClick={(e) => e.stopPropagation()}>
            <Image src={allImages[currentIndex]} alt={`${title || "Gallery"} ${currentIndex + 1}`} fill className="object-contain" />
          </div>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  )
}
