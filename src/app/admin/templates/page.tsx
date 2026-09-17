"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Eye, Edit, Trash2, Users, X, Loader2, Search, Filter, Layout, Sparkles, Globe } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { TEMPLATE_REGISTRY, LiveTemplatePreview } from "@/components/travel-site/templates"
import type { TemplateRegistryEntry } from "@/components/travel-site/templates"

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

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "Umum",
  preview_url: "",
  is_active: true,
}

const CATEGORIES = ["Semua", "Umum", "Premium", "Budget", "VIP"]

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Semua")

  const fetchTemplates = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("website_templates")
      .select("id, name, description, category, preview_url, is_active, used_by_count, created_at")
      .order("created_at", { ascending: false })
    setTemplates((data as TemplateRow[]) || [])
  }, [])

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false))
  }, [fetchTemplates])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("templates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "website_templates" },
        () => {
          fetchTemplates()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTemplates])

  const openAddModal = () => {
    setEditingTemplate(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEditModal = (tpl: TemplateRow) => {
    setEditingTemplate(tpl)
    setForm({
      name: tpl.name,
      description: tpl.description || "",
      category: tpl.category || "Umum",
      preview_url: tpl.preview_url || "",
      is_active: tpl.is_active,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama template wajib diisi")
      return
    }
    setSaving(true)
    const supabase = createClient()

    if (editingTemplate) {
      const { error } = await supabase
        .from("website_templates")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category,
          preview_url: form.preview_url.trim() || null,
          is_active: form.is_active,
        })
        .eq("id", editingTemplate.id)

      if (error) {
        toast.error("Gagal update template")
      } else {
        toast.success("Template berhasil diupdate")
        setShowModal(false)
      }
    } else {
      const { error } = await supabase.from("website_templates").insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        preview_url: form.preview_url.trim() || null,
        is_active: form.is_active,
      })

      if (error) {
        toast.error("Gagal menambahkan template")
      } else {
        toast.success("Template berhasil ditambahkan")
        setShowModal(false)
      }
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("website_templates").delete().eq("id", deleteId)
    if (error) {
      toast.error("Gagal menghapus template")
    } else {
      toast.success("Template berhasil dihapus")
      setDeleteId(null)
    }
    setDeleting(false)
  }

  // Check if template has a built-in component
  const getRegistryEntry = (tpl: TemplateRow): TemplateRegistryEntry | undefined => {
    return TEMPLATE_REGISTRY.find((r) => r.id === tpl.id)
  }

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "Semua" || tpl.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Template Website</h1>
          <p className="text-muted-foreground mt-1">Kelola template website untuk travel</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Template
        </button>
      </div>

      {/* Built-in Templates Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/60 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-emerald-900">Template Bawaan</h3>
            <p className="text-xs text-emerald-700/70 mt-0.5">
              {TEMPLATE_REGISTRY.length} template siap pakai:{" "}
              {TEMPLATE_REGISTRY.map((t) => t.name).join(", ")}. Template ini sudah memiliki tampilan interaktif.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari template..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-3">
          <div className="text-2xl font-bold">{templates.length}</div>
          <div className="text-xs text-muted-foreground">Total Template</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-3">
          <div className="text-2xl font-bold text-emerald-600">{templates.filter((t) => t.is_active).length}</div>
          <div className="text-xs text-muted-foreground">Aktif</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-3">
          <div className="text-2xl font-bold text-gray-500">{templates.filter((t) => !t.is_active).length}</div>
          <div className="text-xs text-muted-foreground">Konsep</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-3">
          <div className="text-2xl font-bold text-blue-600">{templates.reduce((sum, t) => sum + (t.used_by_count || 0), 0)}</div>
          <div className="text-xs text-muted-foreground">Total Pengguna</div>
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Layout className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchQuery || categoryFilter !== "Semua" ? "Tidak ada template yang cocok" : "Belum ada template"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => {
            const registry = getRegistryEntry(tpl)
            return (
              <div key={tpl.id} className="bg-white rounded-2xl border border-border overflow-hidden group">
                {/* Preview Image */}
                <div className="relative h-44 overflow-hidden">
                  {registry ? (
                    <div className={`w-full h-full bg-gradient-to-br ${registry.gradient} flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="w-14 h-10 mx-auto mb-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <Layout className="w-5 h-5 text-white/70" />
                        </div>
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-7 h-5 rounded-sm bg-white/10" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : tpl.preview_url ? (
                    <Image src={tpl.preview_url} alt={tpl.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-600/30">{tpl.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {registry && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Built-in
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tpl.is_active ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"}`}>
                      {tpl.is_active ? "Aktif" : "Konsep"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{tpl.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{tpl.category || "Umum"}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tpl.used_by_count || 0} travel</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => setPreviewId(tpl.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Pratinjau
                    </button>
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button
                      onClick={() => setDeleteId(tpl.id)}
                      className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Live Preview Modal */}
      {previewId && (
        <LiveTemplatePreview
          templateId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingTemplate ? "Ubah Template" : "Tambah Template"}</h2>
              <button onClick={() => !saving && setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Template *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Contoh: Travel Premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Deskripsi singkat template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {CATEGORIES.filter((c) => c !== "Semua").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Preview URL</label>
                <input
                  type="url"
                  value={form.preview_url}
                  onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Status Aktif</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTemplate ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Hapus Template</h3>
              <p className="text-sm text-muted-foreground mt-1">Apakah anda yakin ingin menghapus template ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
