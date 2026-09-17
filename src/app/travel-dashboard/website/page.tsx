"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Globe, Palette, Save, Loader2, Check, Layout, ExternalLink, Eye, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { TEMPLATE_REGISTRY, LiveTemplatePreview } from "@/components/travel-site/templates"
import type { Tenant, Package } from "@/lib/types"

interface TemplateRow {
  id: string
  name: string
  description: string | null
  preview_url: string | null
  is_active: boolean
  category: string | null
}

export default function TravelWebsitePage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [brandColor, setBrandColor] = useState("#10b981")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Template state
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [tenantSlug, setTenantSlug] = useState("")
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Tenant data for preview
  const [tenantData, setTenantData] = useState<Tenant | null>(null)
  const [tenantPackages, setTenantPackages] = useState<Package[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const [tenantRes, websiteRes, templatesRes, pkgRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", profile.tenant_id).single(),
        supabase.from("tenant_websites").select("template_id").eq("tenant_id", profile.tenant_id).single(),
        supabase.from("website_templates").select("id, name, description, preview_url, is_active, category").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("packages").select("*").eq("tenant_id", profile.tenant_id).in("status", ["active", "ongoing"]).order("created_at", { ascending: false }),
      ])

      if (tenantRes.data) {
        setSubdomain(tenantRes.data.slug || "")
        setTenantSlug(tenantRes.data.slug || "")
        setCustomDomain(tenantRes.data.custom_domain || "")
        setTenantData(tenantRes.data as Tenant)
        const config = (tenantRes.data.config || {}) as any
        if (config.brand_color) setBrandColor(config.brand_color)
        if (config.description) setDescription(config.description)
      }

      if (websiteRes.data) {
        setSelectedTemplateId(websiteRes.data.template_id)
      }

      setTemplates((templatesRes.data as TemplateRow[]) || [])
      setTenantPackages((pkgRes.data as Package[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from("tenants").update({
      custom_domain: customDomain || null,
      config: { brand_color: brandColor, description },
    }).eq("id", tenantId)
    if (error) {
      toast.error(t("toast.error") + ": " + error.message)
    } else {
      toast.success(t("toast.website_saved"))
    }
    setSaving(false)
  }

  async function handleSelectTemplate(templateId: string) {
    if (!tenantId || savingTemplate) return
    setSavingTemplate(true)

    const { error } = await supabase.from("tenant_websites").upsert(
      { tenant_id: tenantId, template_id: templateId },
      { onConflict: "tenant_id" }
    )

    if (error) {
      toast.error(t("toast.error") + ": " + error.message)
    } else {
      setSelectedTemplateId(templateId)
      toast.success(t("toast.template_changed"))
    }
    setSavingTemplate(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("nav.website")}</h1>
        <p className="text-muted-foreground mt-1">Atur tampilan website travel Anda</p>
      </div>

      {/* Template Selector */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Template Website</h2>
          </div>
          {selectedTemplateId && tenantSlug && (
            <Link
              href={`/travel-site/${tenantSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Website
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Pilih tampilan template untuk website travel Anda</p>

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const registry = TEMPLATE_REGISTRY.find((r) => r.id === tpl.id)
              const isSelected = selectedTemplateId === tpl.id

              return (
                <div
                  key={tpl.id}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "border-border/60 hover:border-emerald-300 hover:shadow-md"
                  }`}
                >
                  {/* Template Preview */}
                  <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${registry?.gradient || "from-emerald-100 to-blue-100"}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-8 mx-auto mb-1 rounded bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <Layout className="w-4 h-4 text-white/60" />
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-6 h-4 rounded-sm bg-white/10" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Built-in badge */}
                    {registry && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500 text-white flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Built-in
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewId(tpl.id)
                      }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                      title="Pratinjau template"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Template Info + Select */}
                  <button
                    onClick={() => handleSelectTemplate(tpl.id)}
                    disabled={savingTemplate}
                    className="w-full text-left p-3 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{tpl.name}</h3>
                      {tpl.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-muted-foreground">{tpl.category}</span>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tpl.description}</p>
                    )}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Check className="w-3 h-3" /> Template Aktif
                      </div>
                    )}
                  </button>

                  {/* Selected ring */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500 ring-offset-2 pointer-events-none" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-2xl">
            <Layout className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada template tersedia</p>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {previewId && (
        <LiveTemplatePreview
          templateId={previewId}
          onClose={() => setPreviewId(null)}
          tenant={tenantData || undefined}
          packages={tenantPackages}
          themeConfig={{ primary_color: brandColor }}
        />
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Domain & Subdomain</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Subdomain</label>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={subdomain}
                disabled
                className="flex-1 px-4 py-2.5 border border-border border-r-0 rounded-l-xl text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <span className="px-4 py-2.5 bg-gray-50 border border-border rounded-r-xl text-sm text-muted-foreground">.umrohq.com</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Custom Domain (Opsional)</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="www.travelanda.com"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Branding</h2>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Warna Brand</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Deskripsi Travel</h2>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi tentang travel Anda..."
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("common.save")}
        </button>
      </div>
    </div>
  )
}
