"use client"

import { useState, useEffect } from "react"
import { Plus, Eye, Edit, Trash2, Users, Loader2 } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface TemplateRow {
  id: string
  name: string
  description: string | null
  category: string | null
  preview_url: string | null
  is_active: boolean
  used_by_count: number | null
  created_at: string
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("website_templates")
      .select("id, name, description, category, preview_url, is_active, used_by_count, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTemplates((data as TemplateRow[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="h-44 bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Template Website</h1>
          <p className="text-muted-foreground mt-1">Kelola template website untuk travel</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Tambah Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-border overflow-hidden group">
            <div className="relative h-44 overflow-hidden">
              {tpl.preview_url ? (
                <Image src={tpl.preview_url} alt={tpl.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600/30">{tpl.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tpl.is_active ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"}`}>
                  {tpl.is_active ? "Aktif" : "Draft"}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{tpl.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{tpl.category || "Umum"}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tpl.used_by_count || 0} travel</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
