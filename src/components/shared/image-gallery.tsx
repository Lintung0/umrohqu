"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { PhotoProvider, PhotoView } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be")
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url
}

interface GalleryItem {
  url: string
  type?: "image" | "video"
}

interface ImageGalleryProps {
  images: string[]
  items?: GalleryItem[]
  alt?: string
  title?: string
}

export default function ImageGallery({ images, items, alt = "Gallery", title }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const galleryItems: GalleryItem[] = items || images.map((url) => ({ url, type: "image" as const }))

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Keyboard navigation: ← / → pindah slide (aktif saat galeri punya fokus)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef
    if (!el || !emblaApi) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        emblaApi.scrollPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        emblaApi.scrollNext()
      }
    }
    el.addEventListener("keydown", onKeyDown)
    return () => el.removeEventListener("keydown", onKeyDown)
  }, [containerRef, emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)

    let interval: NodeJS.Timeout
    const startAutoPlay = () => {
      interval = setInterval(() => {
        emblaApi.scrollNext()
      }, 4000)
    }
    startAutoPlay()

    const stopAutoPlay = () => clearInterval(interval)
    emblaApi.on("pointerDown", stopAutoPlay)
    emblaApi.on("pointerUp", startAutoPlay)

    return () => {
      clearInterval(interval)
      emblaApi.off("select", onSelect)
      emblaApi.off("pointerDown", stopAutoPlay)
      emblaApi.off("pointerUp", startAutoPlay)
    }
  }, [emblaApi])

  if (!images.length) return null

  return (
    <PhotoProvider
      loop={galleryItems.filter((i) => i.type !== "video").length > 1}
      speed={() => 300}
      bannerVisible
    >
      {/* WRAPPER CONTAINER ULTIMATE — lokal overflow agar foto/titik tidak bocor keluar garis */}
      <div
        ref={setContainerRef}
        tabIndex={0}
        className="relative w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-900 shadow-sm focus:outline-none"
      >
        {/* Main carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {galleryItems.map((item, i) => (
              <div
                key={i}
                className={`flex-[0_0_100%] min-w-0 relative aspect-video max-h-[360px] w-full overflow-hidden ${item.type !== "video" ? "cursor-pointer" : ""}`}
              >
                {item.type === "video" && isYouTubeUrl(item.url) ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <iframe
                      src={getYouTubeEmbedUrl(item.url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : item.type === "video" ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={item.url}
                      controls
                      playsInline
                      autoPlay
                      preload="metadata"
                      className="w-full h-full object-contain"
                      poster={images[0] || undefined}
                    />
                  </div>
                ) : (
                  <PhotoView
                    src={item.url}
                    overlay={<span className="text-sm text-white/80">{alt} {i + 1}</span>}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={item.url}
                        alt={`${alt} ${i + 1}`}
                        fill
                        className="object-cover w-full h-full"
                        sizes="100vw"
                        unoptimized
                      />
                      <button
                        className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-20 cursor-zoom-in"
                        aria-label="Perbesar foto"
                        type="button"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </PhotoView>
                )}
                {item.type === "video" && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-xs text-white font-medium flex items-center gap-1 pointer-events-none">
                    <Play className="w-3 h-3" fill="white" />
                    Video
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all z-20"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all z-20"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Pagination dots — DI DALAM area gambar, tengah bawah */}
        {galleryItems.length > 1 && galleryItems.length <= 25 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-20 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
            {galleryItems.map((item, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ke ${item.type === "video" ? "video" : "foto"} ${i + 1}`}
                className={cn(
                  "rounded-full transition-all",
                  selectedIndex === i
                    ? "w-2.5 h-2.5 bg-emerald-500"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}

        {/* BADGE COUNTER — pojok kiri bawah di dalam gambar */}
        <div className="absolute bottom-4 left-4 z-20 px-2.5 py-1 text-xs font-medium text-white bg-black/50 backdrop-blur-md rounded-md">
          {selectedIndex + 1} / {galleryItems.length}
        </div>
      </div>
    </PhotoProvider>
  )
}