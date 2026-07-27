"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Globe, Palette, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function TravelWebsitePage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [brandColor, setBrandColor] = useState("#10b981")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!profile?.tenant_id) { setLoading(false); return }
      setTenantId(profile.tenant_id)

      const { data: tenant } = await supabase.from("tenants").select("slug, custom_domain, config").eq("id", profile.tenant_id).single()
      if (tenant) {
        setSubdomain(tenant.slug || "")
        setCustomDomain(tenant.custom_domain || "")
        const config = (tenant.config || {}) as any
        if (config.brand_color) setBrandColor(config.brand_color)
        if (config.description) setDescription(config.description)
      }
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
      toast.error("Gagal menyimpan: " + error.message)
    } else {
      toast.success("Pengaturan website berhasil disimpan")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Website</h1>
        <p className="text-muted-foreground mt-1">Atur tampilan website travel Anda</p>
      </div>

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
          Simpan Perubahan
        </button>
      </div>
    </div>
  )
}
