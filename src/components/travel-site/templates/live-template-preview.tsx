"use client"

import { useEffect, useRef } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"
import { TEMPLATE_BY_ID, MOCK_TENANT, MOCK_PACKAGES } from "./template-registry"
import type { Tenant, Package } from "@/lib/types"

interface LiveTemplatePreviewProps {
  templateId: string
  onClose: () => void
  tenant?: Tenant
  packages?: Package[]
  themeConfig?: Record<string, unknown>
}

export default function LiveTemplatePreview({
  templateId,
  onClose,
  tenant,
  packages,
  themeConfig,
}: LiveTemplatePreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const template = TEMPLATE_BY_ID[templateId]
  const TemplateComponent = template?.component

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  if (!template || !TemplateComponent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Template tidak ditemukan</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm">Tutup</button>
        </div>
      </div>
    )
  }

  const previewTenant = tenant || { ...MOCK_TENANT, brand_color: template.accent }
  const previewPackages = packages || MOCK_PACKAGES

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex flex-col m-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${template.gradient}`} />
            <div>
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-muted-foreground">{template.category}</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-100">
          <div className="min-h-[600px]">
            <TemplateComponent
              tenant={previewTenant}
              packages={previewPackages}
              themeConfig={themeConfig}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
