"use client"

import Image from "next/image"
import { FolderOpen, ExternalLink } from "lucide-react"

interface DocPackage {
  id: string
  name: string
  slug: string
  image_url?: string | null
  images?: string[] | null
  status?: string
}

export function PackageDocumentationSection({ packages, title }: { packages: DocPackage[]; title?: string }) {
  if (!packages || packages.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{title || "Dokumentasi Jamaah"}</h2>
            <p className="text-xs text-muted-foreground">Foto & video dokumentasi perjalanan umrah</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
              <div className="relative w-14 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                {pkg.image_url && (
                  <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{pkg.name}</p>
                <a
                  href={pkg.images?.[0] || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" /> Buka Dokumentasi
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
